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
import { View, Text, Image, StyleSheet } from 'react-native';
import { CustomFieldSlot } from '../types';

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

function SlotLine({ slot }: { slot: CustomFieldSlot }) {
  const hasLabel = slot.label.trim().length > 0;
  const hasValue = slot.value.trim().length > 0;

  if (!hasLabel && !hasValue) {
    return null; // 両方空のスロットは非表示
  }

  return (
    <View style={styles.slotRow}>
      {hasLabel ? <Text style={styles.slotLabel}>{slot.label}</Text> : null}
      <Text style={styles.slotValue} numberOfLines={2} ellipsizeMode="tail">{hasValue ? slot.value : ''}</Text>
    </View>
  );
}

export default function CardPreview({ company, name, logoUrl, customFields }: CardPreviewProps) {
  // 要素1〜5（役職・ローマ字氏名・電話・メール・URL）のみプレビューに表示
  const visibleSlots = customFields.filter((f) => f.slot >= 1 && f.slot <= 5);

  return (
    <View style={styles.cardShadowWrap}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.topTextArea}>
            <Text
              style={styles.company}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {company || '会社名'}
            </Text>
          </View>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : null}
        </View>

        <View style={styles.nameArea}>
          <Text
            style={styles.name}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {name || '氏名'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.contactArea}>
          {visibleSlots.map((slot) => (
            <SlotLine key={slot.slot} slot={slot} />
          ))}
        </View>
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
    height: 220,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topTextArea: {
    flex: 1,
    paddingRight: 8,
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
  nameArea: {
    marginTop: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  contactArea: {
    gap: 4,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotLabel: {
    fontSize: 12,
    color: COLORS.subText,
    marginRight: 6,
    minWidth: 72,
  },
  slotValue: {
    fontSize: 13,
    color: COLORS.text,
    flexShrink: 1,
  },
});
