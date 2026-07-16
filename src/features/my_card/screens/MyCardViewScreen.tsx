/**
 * src/features/my_card/screens/MyCardViewScreen.tsx
 *
 * 自分の名刺プレビュー画面（閲覧専用）。
 * アカウントメニュー「名刺を見る」から遷移する。
 * 画面内の「編集」ボタンから MyCardEditScreen へ遷移する。
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardPreview from '../components/CardPreview';
import { fetchMyCard } from '../api/myCardApi';
import { CustomFieldSlot, createInitialCustomFields } from '../types';
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

export const MyCardViewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const requestIdRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldSlot[]>(
    createInitialCustomFields(),
  );

  const loadCard = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const card = await fetchMyCard(userId);

      if (requestId !== requestIdRef.current) return;

      if (card) {
        setCompany(card.company);
        setName(card.name);
        setLogoUrl(card.logoUrl);
        setCustomFields(card.customFields);
      } else {
        setCompany('');
        setName('');
        setLogoUrl(null);
        setCustomFields(createInitialCustomFields());
      }
    } catch (e) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(
          e instanceof Error ? e.message : '名刺データの読み込みに失敗しました。',
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCard();
    });
    return unsubscribe;
  }, [navigation, loadCard]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ヘッダー */}
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
          onPress={() => navigation.navigate('MyCardEdit')}
          style={[styles.headerSide, styles.editButton]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editButtonText} numberOfLines={1}>
            編集
          </Text>
        </TouchableOpacity>
      </View>

      {/* 名刺エリア */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 上部：一覧リスト形式（上位4件） */}
        <View style={styles.editCardWrapper}>
          <CardPreview
            company={company}
            name={name}
            logoUrl={logoUrl}
            customFields={customFields}
            mode="list"          // edit → list に変更
            maxHeight={220}
          />
        </View>

        {/* 下部：全件表示 */}
        <CardPreview
          company={company}
          name={name}
          logoUrl={logoUrl}
          customFields={customFields}
          mode="preview"
        />

        {!company && !name ? (
          <Text style={styles.emptyText}>
            まだ名刺が作成されていません。右上の「編集」から登録してください。
          </Text>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

  editButton: {
    alignItems: 'flex-end',
  },

  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brand,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* 2つのコンポーネントの間隔を担保するためのスタイル */
  editCardWrapper: {
    marginBottom: 24,
  },

  emptyText: {
    marginTop: 20,
    fontSize: 13,
    color: COLORS.subText,
    textAlign: 'center',
  },

  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
  },
});