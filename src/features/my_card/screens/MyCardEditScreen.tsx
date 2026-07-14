/**
 * src/features/my_card/screens/MyCardEditScreen.tsx
 *
 * 自分の名刺画面：プレビュー表示 + タブ切替による編集。
 * - ヘッダー：左上に戻るボタン
 * - プレビューエリア：入力値変更時に即時更新
 * - 編集タブエリア：社名・氏名・画像・要素（動的スロット）
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
  Keyboard,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardPreview from '../components/CardPreview';
import EditTabs, { AddCandidateItem } from '../components/EditTabs';
import FormInput from '../components/FormInput';
import ImagePickerField from '../components/ImagePickerField';
import { fetchMyCard, saveMyCard, uploadLogoImage } from '../api/myCardApi';
import {
  CustomFieldSlot,
  MyCardTabDefinition,
  MyCardTabKey,
  FIELD_CANDIDATES,
  FURIGANA_SLOT,
  createInitialCustomFields,
  COMPANY_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from '../types';
import { useAuth } from '../../auth/AuthContext';
import { RootStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  bg: '#F5F6F8',
  cardBg: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  border: '#D1D5DB',
  brand: '#2563EB',
  danger: '#DC2626',
};

export const MyCardEditScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const screenHeight = Dimensions.get('window').height;

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
  const [cardMaxHeight, setCardMaxHeight] = useState(
    screenHeight * 0.52,
  );

  // ── 動的 TABS の導出 ───────────────────────────────────────────────────
  const TABS = useMemo<MyCardTabDefinition[]>(() => {
    const fixedTabs: MyCardTabDefinition[] = [
      { key: 'company', label: '社名',  slotNumber: null },
      { key: 'name',    label: '氏名',  slotNumber: null },
      { key: 'image',   label: '画像',  slotNumber: null },
    ];

    const slotTabs: MyCardTabDefinition[] = customFields.map((f) => ({
      key: `slot${f.slot}` as MyCardTabKey,
      label: f.label !== ''
        ? (FIELD_CANDIDATES.find((c) => c.value === f.label)?.label ?? f.label)
        : `要素${f.slot}`,
      slotNumber: f.slot,
    }));

    return [...fixedTabs, ...slotTabs];
  }, [customFields]);

  // ── 新規追加スロット候補の導出 ──────────────────────────────────────────
  /**
   * まだ使われていない候補（モーダルに表示する追加候補一覧）。
   * FIELD_CANDIDATES のうち isFree なものと、すでに label として使用済みのものを除外。
   * フリー入力（isFree）はスロット追加後に手動入力してもらうため除外しない。
   */
  const addCandidates = useMemo<AddCandidateItem[]>(() => {
    const usedLabels = new Set(
      customFields
        .filter((f) => f.label !== '')
        .map((f) => f.label),
    );

    return FIELD_CANDIDATES
      .filter((c) => c.isFree || !usedLabels.has(c.value))
      .map((c) => ({
        label: c.label,           // 表示名（例：「メールアドレス」）
        value: c.isFree ? '' : c.value,  // label カラムに入れる値（'' = フリー入力）
      }));
  }, [customFields]);

  /** スロットが 10 個に達したら追加不可 */
  const isAddDisabled = customFields.filter((f) => f.slot !== FURIGANA_SLOT).length >= 10;

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

  useEffect(() => {
    const show = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;

        setCardMaxHeight(
          Math.max(
            200,
            screenHeight - keyboardHeight - 200,
          ),
        );
      },
    );

    const hide = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setCardMaxHeight(
          screenHeight * 0.52,
        );
      },
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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

  // ── スロット削除処理 ───────────────────────────────────────────────────
  /**
   * 指定スロット番号を削除し、残ったスロットを 1 始まりで詰め直す。
   * activeTab が削除対象なら 'company' へリセット。
   */
  const handleDeleteSlots = useCallback(
    (slotNumbers: number[]) => {
      setCustomFields((prev) => {
        // slot 0（フリガナ）は削除・番号変更の対象外
        const furigana = prev.filter((f) => f.slot === FURIGANA_SLOT);
        const survived = prev
          .filter((f) => f.slot !== FURIGANA_SLOT && !slotNumbers.includes(f.slot))
          .map((f, idx) => ({ ...f, slot: idx + 1 })); // 1 始まりで詰め直す
        return [...furigana, ...survived];
      });
  
      // 削除されたタブがアクティブだったら固定タブへ戻す
      const activeSlot = TABS.find((t) => t.key === activeTab)?.slotNumber;
      if (activeSlot !== null && activeSlot !== undefined && slotNumbers.includes(activeSlot)) {
        setActiveTab('company');
      }
    },
    [activeTab, TABS],
  );

  // ── スロット追加処理 ───────────────────────────────────────────────────
  /**
   * 候補モーダルで選ばれた項目を新しいスロットに追加する。
   * スロット番号は現在の最大値 + 1（上限は 10）。
   */
  const handleAddSlot = useCallback(
    (candidate: AddCandidateItem) => {
      if (isAddDisabled) return;

      setCustomFields((prev) => {
        const nextSlot = prev.length + 1;
        return [
          ...prev,
          {
            slot: nextSlot,
            label: candidate.value,  // '' ならフリー入力扱い
            value: '',
          },
        ];
      });
    },
    [isAddDisabled],
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

      navigation.goBack(); // 保存後に前の画面に戻る
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '名刺の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }, [userId, name, company, logoUri, customFields, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* 1. ヘッダーエリア */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerSide}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            自分の名刺
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.headerSide, styles.saveButton]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.brand} size="small" />
            ) : (
              <Text style={styles.saveButtonText} numberOfLines={1}>
                保存
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* 2. 名刺プレビューエリア */}
          <View style={styles.section}>
            <CardPreview
              company={company}
              name={name}
              logoUrl={logoUri}
              customFields={customFields}
              mode="edit"
              maxHeight={cardMaxHeight}
            />
          </View>

          {/* 3. 編集タブエリア */}
          <View style={styles.section}>
            <EditTabs 
              tabs={TABS} 
              activeTab={activeTab} 
              onChange={handleTabChange} 
              onDeleteSlots={handleDeleteSlots}
              onAddSlot={handleAddSlot}
              addCandidates={addCandidates}
              isAddDisabled={isAddDisabled}
            />
          </View>

          {/* 4. 入力フォームエリア */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            {activeTab === 'company' && (
              <>
                <FormInput
                  label="会社名"
                  required
                  placeholder="株式会社サンプル"
                  value={company}
                  onChangeText={setCompany}
                  maxLength={COMPANY_MAX_LENGTH}
                />

                <Text style={styles.charCount}>
                  {company.length} / {COMPANY_MAX_LENGTH}
                </Text>
              </>
            )}

            {activeTab === 'name' && (
              <>
                <FormInput
                  label="氏名"
                  required
                  placeholder="山田 太郎"
                  value={name}
                  onChangeText={setName}
                  maxLength={NAME_MAX_LENGTH}
                />
                <Text style={styles.charCount}>
                  {name.length} / {NAME_MAX_LENGTH}
                </Text>

                <FormInput
                  label="フリガナ（任意）"
                  placeholder="ヤマダ タロウ"
                  value={customFields.find((f) => f.slot === FURIGANA_SLOT)?.value ?? ''}
                  onChangeText={(text) => updateSlot(FURIGANA_SLOT, { value: text })}
                  maxLength={NAME_MAX_LENGTH}
                />
                <Text style={styles.charCount}>
                  {(customFields.find((f) => f.slot === FURIGANA_SLOT)?.value ?? '').length} / {NAME_MAX_LENGTH}
                </Text>
              </>
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

              const usedLabels = new Set(
                customFields
                  .filter((f) => f.slot !== slot.slot && f.label !== '')
                  .map((f) => f.label)
              );

              // 現在選択されている候補を特定（free は label が空文字）
              const selectedCandidate = FIELD_CANDIDATES.find((c) =>
                c.isFree ? slot.label === '' && slot.value !== '' : c.value === slot.label
              );

              const currentMaxLength = selectedCandidate?.maxLength ?? 50;

              return (
                <View key={tab.key}>
                  {/* 候補ボタングリッド */}
                  <Text style={styles.candidateLabel}>項目を選択</Text>
                  <View style={styles.candidateGrid}>
                    {FIELD_CANDIDATES.map((candidate) => {
                      const isSelected = candidate.isFree
                        ? selectedCandidate?.isFree
                        : slot.label === candidate.value;

                      const isDisabled =
                        !candidate.isFree && usedLabels.has(candidate.value);

                      return (
                        <TouchableOpacity
                          key={candidate.label}
                          style={[
                            styles.candidateButton,
                            isSelected ? styles.candidateButtonActive : null,
                            isDisabled ? styles.candidateButtonDisabled : null,
                          ]}
                          onPress={() => {
                            if (isDisabled) return;
                            updateSlot(slot.slot, { label: candidate.value });
                          }}
                          activeOpacity={isDisabled ? 1 : 0.7}
                        >
                          <Text
                            style={[
                              styles.candidateButtonText,
                              isSelected ? styles.candidateButtonTextActive : null,
                              isDisabled ? styles.candidateButtonTextDisabled : null,
                            ]}
                          >
                            {candidate.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 値入力欄（候補が選ばれている場合のみ表示） */}
                  {(slot.label !== '' || selectedCandidate?.isFree) && (
                    <View>
                      <FormInput
                        label={slot.label !== '' ? slot.label : 'その他'}
                        placeholder="値を入力"
                        value={slot.value}
                        onChangeText={(text) => updateSlot(slot.slot, { value: text })}
                        maxLength={currentMaxLength}
                      />
                      <Text style={styles.charCount}>
                        {slot.value.length} / {currentMaxLength}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerSide: {
    width: 56,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brand,
    flexShrink: 0,
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
  charCount: {
    fontSize: 11,
    color: COLORS.subText,
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 8,
    paddingRight: 4,
  },
  candidateLabel: {
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: '500',
    marginBottom: 10,
  },
  candidateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  candidateButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    minWidth: 64,
    alignItems: 'center',
  },
  candidateButtonActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  candidateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  candidateButtonTextActive: {
    color: '#FFFFFF',
  },
  candidateButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  candidateButtonTextDisabled: {
    color: COLORS.subText,
  },
});