/**
 * src/features/my_card/components/CardPreview.tsx
 *
 * 編集画面・プレビュー画面の共通名刺コンポーネント。
 *
 * mode="edit"
 *   - maxHeight で高さを制限（キーボード対応）
 *   - 名刺内部をスクロール可能
 *
 * mode="preview"
 *   - コンテンツ量に応じて縦に伸びる（aspectRatio なし）
 *   - スクロールは呼び出し元画面が担う
 */
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomFieldSlot, FURIGANA_SLOT } from '../types';

interface CardPreviewProps {
  company: string;
  name: string;
  logoUrl: string | null;
  customFields: CustomFieldSlot[];
  mode?: 'edit' | 'preview';
  maxHeight?: number;
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons
        name={ICONS[label] ?? 'document-text-outline'}
        size={18}
        color="#2563EB"
        style={styles.infoIcon}
      />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label || 'その他'}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function CardPreview({
  company,
  name,
  logoUrl,
  customFields,
  mode = 'edit',
  maxHeight,
}: CardPreviewProps) {
  const furigana =
    customFields.find((f) => f.slot === FURIGANA_SLOT)?.value ?? '';

  const visibleSlots = customFields
    .filter((f) => f.slot !== FURIGANA_SLOT && f.value.trim().length > 0)
    .sort((a, b) => a.slot - b.slot);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.company}>{company || '会社名'}</Text>
          <Text style={styles.name}>{name || '氏名'}</Text>
          {!!furigana && <Text style={styles.furigana}>{furigana}</Text>}
        </View>
        {!!logoUrl && (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>
      <View style={styles.divider} />
    </>
  );

  const renderFields = () =>
    visibleSlots.map((slot) => (
      <InfoItem key={slot.slot} label={slot.label} value={slot.value} />
    ));

  // ── edit モード ──────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <View style={styles.shadowWrap}>
        <View
          style={[
            styles.card,
            { minHeight: 180, maxHeight: maxHeight ?? undefined },
          ]}
        >
          {renderHeader()}
          <ScrollView
            style={styles.editScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.editScrollContent}>{renderFields()}</View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── preview モード ────────────────────────────────────────
  // コンテンツ量に応じて自然に縦伸びする。スクロールは呼び出し元画面が担う。
  return (
    <View style={styles.shadowWrap}>
      <View style={styles.card}>
        {renderHeader()}
        <View>{renderFields()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  card: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 20,
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

  company: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subText,
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

  logo: {
    width: 40,
    height: 40,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  editScroll: {
    flex: 1,
  },
  editScrollContent: {
    paddingBottom: 8,
  },

  infoItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.subText,
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
});