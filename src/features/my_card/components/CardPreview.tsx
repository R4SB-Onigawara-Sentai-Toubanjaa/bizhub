import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BusinessCard } from '../../../components/BusinessCard';
import { CustomFieldSlot, FURIGANA_SLOT } from '../types';

interface CardPreviewProps {
  company: string;
  name: string;
  logoUrl: string | null;
  customFields: CustomFieldSlot[];
  mode?: 'edit' | 'preview' | 'list';
  maxHeight?: number;
}

/** 全フィールドをラベル付きで返す */
function toDetailLines(customFields: CustomFieldSlot[]): string[] {
  return customFields
    .filter((f) => f.slot !== FURIGANA_SLOT && f.value.trim().length > 0)
    .sort((a, b) => a.slot - b.slot)
    .map((f) => (f.label.trim() ? `${f.label}  ${f.value}` : f.value));
}

/** 上位4件のみ */
function toTopLines(customFields: CustomFieldSlot[]): string[] {
  return toDetailLines(customFields).slice(0, 4);
}

export default function CardPreview({
  company,
  name,
  logoUrl,
  customFields,
  mode = 'edit',
  maxHeight,
}: CardPreviewProps) {

  // ── list モード: 上位4件・スクロールなし（MyCardViewScreen 上部用） ──
  if (mode === 'list') {
    return (
      <View style={styles.shadowWrap}>
        <BusinessCard
          company={company}
          name={name}
          logoUrl={logoUrl}
          details={toTopLines(customFields)}
        />
      </View>
    );
  }

  // ── edit モード: 全件・内部スクロールあり（MyCardEditScreen 用） ──
  if (mode === 'edit') {
    return (
      <View style={[styles.shadowWrap, { maxHeight: maxHeight ?? 320 }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <BusinessCard
            company={company}
            name={name}
            logoUrl={logoUrl}
            details={toDetailLines(customFields)}
          />
        </ScrollView>
      </View>
    );
  }

  // ── preview モード: 全件・スクロールなし（MyCardViewScreen 下部用） ──
  return (
    <View style={styles.shadowWrap}>
      <BusinessCard
        company={company}
        name={name}
        logoUrl={logoUrl}
        details={toDetailLines(customFields)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  scroll: {
    borderRadius: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
});