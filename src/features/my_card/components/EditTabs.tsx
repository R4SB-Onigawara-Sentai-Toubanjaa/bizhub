/**
 * src/features/my_card/components/EditTabs.tsx
 *
 * 編集タブエリア。横スクロール対応、選択中タブのみブランドカラー背景。
 */
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MyCardTabDefinition, MyCardTabKey } from '../types';

interface EditTabsProps {
  tabs: MyCardTabDefinition[];
  activeTab: MyCardTabKey;
  onChange: (tab: MyCardTabKey) => void;
}

const COLORS = {
  brand: '#2563EB',
  border: '#D1D5DB',
  text: '#111827',
  textOnBrand: '#FFFFFF',
};

export default function EditTabs({ tabs, activeTab, onChange }: EditTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.brand,
  },
  tabInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.textOnBrand,
  },
  tabLabelInactive: {
    color: COLORS.text,
  },
});
