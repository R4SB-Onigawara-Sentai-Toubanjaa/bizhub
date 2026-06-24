/**
 * src/features/my_card/screens/MyCardEditScreen.tsx
 *
 * 自分の名刺画面：プレビュー表示 + タブ切替による編集。
 * - ヘッダー：左上に戻るボタン
 * - プレビューエリア：入力値変更時に即時更新
 * - 編集タブエリア：社名・氏名・画像・要素1〜4
 * - 入力フォームエリア：選択中タブに応じて表示
 *
 * NOTE: 認証ユーザーIDの取得方法は features/auth 側の実装に依存するため、
 * 本コンポーネントは useAuth() フックを通じて userId を受け取る前提とする
 * （features/auth/ 配下に既存の同等フックがある場合はそれに合わせて
 * import パスを調整してください）。
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import CardPreview from '../components/CardPreview';
import EditTabs from '../components/EditTabs';
import FormInput from '../components/FormInput';
import ImagePickerField from '../components/ImagePickerField';
import { fetchMyCard, saveMyCard, uploadLogoImage } from '../api/myCardApi';
import {
  CustomFieldSlot,
  MyCardTabDefinition,
  MyCardTabKey,
  createInitialCustomFields,
} from '../types';
import { useAuth } from '../../auth/AuthContext';
import type { RootStackParamList } from '../../../navigation/types';

// 現在の画面ではなく「アプリ全体のナビゲーション型」を指定する（any型の使用禁止）
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyCardEdit'>;
const COLORS = {
  bg: '#F5F6F8',
  cardBg: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  border: '#D1D5DB',
  brand: '#2563EB',
  danger: '#DC2626',
};

const TABS: MyCardTabDefinition[] = [
  { key: 'company', label: '社名', slotNumber: null },
  { key: 'name', label: '氏名', slotNumber: null },
  { key: 'image', label: '画像', slotNumber: null },
  { key: 'slot1', label: '要素1', slotNumber: 1 },
  { key: 'slot2', label: '要素2', slotNumber: 2 },
  { key: 'slot3', label: '要素3', slotNumber: 3 },
  { key: 'slot4', label: '要素4', slotNumber: 4 },
];

export const MyCardEditScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldSlot[]>(createInitialCustomFields());

  const [activeTab, setActiveTab] = useState<MyCardTabKey>('company');
  const fadeAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) return;
      try {
        setIsLoading(true);
        const card = await fetchMyCard(userId);
        if (!isMounted) return;
        if (card) {
          setCompany(card.company);
          setName(card.name);
          setLogoUri(card.logoUrl);
          setCustomFields(card.customFields);
        }
      } catch (e) {
        if (isMounted) {
          setErrorMessage(e instanceof Error ? e.message : '名刺データの読み込みに失敗しました。');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleTabChange = useCallback(
    (tab: MyCardTabKey) => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setActiveTab(tab);
    },
    [fadeAnim]
  );

  const updateSlot = useCallback((slotNumber: number, patch: Partial<CustomFieldSlot>) => {
    setCustomFields((prev) =>
      prev.map((slot) => (slot.slot === slotNumber ? { ...slot, ...patch } : slot))
    );
  }, []);

  const handleLogoChange = useCallback(
    async (localUri: string) => {
      setLogoUri(localUri); // 即時プレビュー反映
      if (!userId) return;
      try {
        setIsUploadingLogo(true);
        const uploadedUrl = await uploadLogoImage(userId, localUri);
        setLogoUri(uploadedUrl);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'ロゴ画像のアップロードに失敗しました。');
      } finally {
        setIsUploadingLogo(false);
      }
    },
    [userId]
  );

  const handleSave = useCallback(async () => {
    if (!userId) return;

    if (!name.trim() || !company.trim()) {
      setErrorMessage('氏名と会社名は必須項目です。');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await saveMyCard(userId, {
        name: name.trim(),
        company: company.trim(),
        logoUrl: logoUri,
        customFields,
      });
      navigation.goBack();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '名刺の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }, [userId, name, company, logoUri, customFields, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* 1. ヘッダーエリア */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>自分の名刺</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
            {isSaving ? (
              <ActivityIndicator color={COLORS.brand} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* 2. 名刺プレビューエリア */}
          <View style={styles.section}>
            <CardPreview
              company={company}
              name={name}
              logoUrl={logoUri}
              customFields={customFields}
            />
          </View>

          {/* 3. 編集タブエリア */}
          <View style={styles.section}>
            <EditTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
          </View>

          {/* 4. 入力フォームエリア */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            {activeTab === 'company' && (
              <FormInput
                label="会社名"
                required
                placeholder="株式会社サンプル"
                value={company}
                onChangeText={setCompany}
              />
            )}

            {activeTab === 'name' && (
              <FormInput
                label="氏名"
                required
                placeholder="山田 太郎"
                value={name}
                onChangeText={setName}
              />
            )}

            {activeTab === 'image' && (
              <ImagePickerField
                imageUri={logoUri}
                onChange={handleLogoChange}
                isUploading={isUploadingLogo}
              />
            )}

            {TABS.filter((t) => t.slotNumber !== null).map((tab) => {
              if (tab.key !== activeTab || tab.slotNumber === null) return null;
              const slot = customFields.find((f) => f.slot === tab.slotNumber);
              if (!slot) return null;
              return (
                <View key={tab.key}>
                  <FormInput
                    label="項目名（任意）"
                    placeholder="例：役職、電話番号など"
                    value={slot.label}
                    onChangeText={(text) => updateSlot(slot.slot, { label: text })}
                  />
                  <FormInput
                    label="入力値"
                    placeholder="値を入力"
                    value={slot.value}
                    onChangeText={(text) => updateSlot(slot.slot, { value: text })}
                  />
                </View>
              );
            })}
          </Animated.View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brand,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
  },
});