/**
 * src/features/my_card/components/CardPreview.tsx
 *
 * 名刺プレビューエリア。
 * - 実際の名刺に近い比率（91mm x 55mm 相当 ≒ 1.65:1）
 * - 白背景 + 薄いシャドウ、角丸控えめ
 * - 氏名を最も強調、会社名・役職は上部、連絡先は下部に整理
 * - 項目名・入力値が両方空のスロットは非表示（位置は詰めない＝重なりが出ないよう
 *   非表示スロットは高さ0としてレンダリングしない）
 */
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { CustomFieldSlot, FURIGANA_SLOT } from '../types';
import {Ionicons} from '@expo/vector-icons';

interface CardPreviewProps {
  company: string;
  name: string;
  logoUrl: string | null;
  // 要素1〜5に割り当てた固定意味の項目（DBは custom_fields のまま、UI側の表示用）
  customFields: CustomFieldSlot[];
}

const COLORS = {
  cardBg: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  border: '#D1D5DB',
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  '役職名': 'briefcase-outline',
  'TEL': 'call-outline',
  'mail': 'mail-outline',
  '郵便番号': 'mail-open-outline',
  '住所': 'home-outline',
  '会社URL': 'globe-outline',
  'SNSアカウント': 'share-social-outline',
  '営業時間': 'time-outline',
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons
        name={ICONS[label] ?? 'document-text-outline'}
        size={18}
        color="#2563EB"
        style={styles.infoIcon}
      />

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label || 'その他'}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function CardPreview({ company, name, logoUrl, customFields }: CardPreviewProps) {
  // フリガナ（スロット0）を取得
  const furigana = customFields.find((f) => f.slot === FURIGANA_SLOT)?.value ?? '';

  // 値が入っているスロットを全件表示（スロット0のフリガナは除く）
  const visibleSlots = customFields
  .filter(
    (f) =>
      f.slot !== FURIGANA_SLOT &&
      f.value.trim().length > 0
  )
  .sort((a, b) => a.slot - b.slot);

  return (
    <View style={styles.cardShadowWrap}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.company}>
              {company || '会社名'}
            </Text>

            <Text style={styles.name}>
              {name || '氏名'}
            </Text>

            {!!furigana && (
              <Text style={styles.furigana}>
                {furigana}
              </Text>
            )}
          </View>

          {logoUrl && (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.divider} />

        <ScrollView
          style={styles.contactArea}
          showsVerticalScrollIndicator={false}
        >
          {visibleSlots.map((slot) => (
            <InfoItem
              key={slot.slot}
              label={slot.label}
              value={slot.value}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadowWrap: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    aspectRatio: 1.65,
    padding: 20,
    justifyContent: 'flex-start',
    height: 320,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subText,
  },
  logo: {
    width: 40,
    height: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  furigana: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  contactArea: {
    gap: 5,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotLabel: {
    fontSize: 11,
    color: COLORS.subText,
    marginRight: 6,
    minWidth: 72,
  },
  slotValue: {
    fontSize: 11,
    color: COLORS.text,
    flexShrink: 1,
  },
});