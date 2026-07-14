/**
 * src/features/my_card/components/EditTabs.tsx
 *
 * 編集タブエリア（追加・削除対応版）
 *
 * 機能：
 * - 固定タブ（社名・氏名・画像）は常に表示、選択・削除不可
 * - 要素タブは長押しで「選択モード」に入る
 * - 選択モード中：タップで複数選択・解除、削除ボタンで一括削除
 * - ＋ボタンタップ → 候補モーダルを表示して項目タイプを選択して追加
 * - 削除後はスロット番号を詰め直す（親へコールバック）
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MyCardTabDefinition, MyCardTabKey, FIELD_CANDIDATES } from '../types';

// ────────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────────

export interface AddCandidateItem {
  /** FIELD_CANDIDATES の value と対応 */
  label: string;
  value: string;
}

interface EditTabsProps {
  tabs: MyCardTabDefinition[];
  activeTab: MyCardTabKey;
  onChange: (tab: MyCardTabKey) => void;
  /** スロット番号を詰め直した新しい配列で親を更新する */
  onDeleteSlots: (slotNumbers: number[]) => void;
  /** 追加候補を選んだとき（どの候補を選んだか） */
  onAddSlot: (candidate: AddCandidateItem) => void;
  /** 追加できる候補一覧（すでに使用済みのものは除外して渡す） */
  addCandidates: AddCandidateItem[];
  /** これ以上追加できないとき true（スロット上限 10） */
  isAddDisabled: boolean;
}

// ────────────────────────────────────────────────
// 定数
// ────────────────────────────────────────────────

const COLORS = {
  brand: '#2563EB',
  brandLight: '#EFF6FF',
  border: '#D1D5DB',
  text: '#111827',
  subText: '#6B7280',
  textOnBrand: '#FFFFFF',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  bg: '#F5F6F8',
  cardBg: '#FFFFFF',
  selected: '#1D4ED8',
  selectedLight: '#DBEAFE',
  overlay: 'rgba(0,0,0,0.4)',
};

/** 固定タブのキー（選択・削除不可） */
const FIXED_KEYS: MyCardTabKey[] = ['company', 'name', 'image'];

// ────────────────────────────────────────────────
// コンポーネント
// ────────────────────────────────────────────────

export default function EditTabs({
  tabs,
  activeTab,
  onChange,
  onDeleteSlots,
  onAddSlot,
  addCandidates,
  isAddDisabled,
}: EditTabsProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // 選択モード時の振動アニメ用
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const startShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -3, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // 長押し → 選択モード開始
  const handleLongPress = useCallback(
    (slotNumber: number) => {
      if (FIXED_KEYS.includes(tabs.find((t) => t.slotNumber === slotNumber)?.key ?? ('' as MyCardTabKey))) return;
      setSelectionMode(true);
      setSelectedSlots([slotNumber]);
      startShake();
    },
    [tabs, startShake],
  );

  // 選択モード中のタップ：選択・解除トグル
  const handleSelectToggle = useCallback((slotNumber: number) => {
    setSelectedSlots((prev) =>
      prev.includes(slotNumber)
        ? prev.filter((s) => s !== slotNumber)
        : [...prev, slotNumber],
    );
  }, []);

  // 選択モードキャンセル
  const cancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedSlots([]);
  }, []);

  // 削除実行
  const handleDelete = useCallback(() => {
    if (selectedSlots.length === 0) return;
    onDeleteSlots(selectedSlots);
    cancelSelection();
  }, [selectedSlots, onDeleteSlots, cancelSelection]);

  // 候補選択して追加
  const handleAddCandidate = useCallback(
    (candidate: AddCandidateItem) => {
      onAddSlot(candidate);
      setShowAddModal(false);
    },
    [onAddSlot],
  );

  const slotTabs = tabs.filter((t) => t.slotNumber !== null);

  return (
    <>
      <View style={styles.wrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 固定タブ */}
          {tabs
            .filter((t) => FIXED_KEYS.includes(t.key))
            .map((tab) => {
              const isActive = tab.key === activeTab && !selectionMode;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    if (selectionMode) {
                      cancelSelection();
                      return;
                    }
                    onChange(tab.key);
                  }}
                  style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

          {/* 区切り */}
          {slotTabs.length > 0 && <View style={styles.divider} />}

          {/* 要素タブ（追加・削除対象） */}
          {slotTabs.map((tab) => {
            const slot = tab.slotNumber!;
            const isActive = tab.key === activeTab && !selectionMode;
            const isSelected = selectedSlots.includes(slot);

            return (
              <Animated.View
                key={tab.key}
                style={selectionMode ? { transform: [{ translateX: shakeAnim }] } : undefined}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (selectionMode) {
                      handleSelectToggle(slot);
                    } else {
                      onChange(tab.key);
                    }
                  }}
                  onLongPress={() => {
                    if (!selectionMode) handleLongPress(slot);
                  }}
                  delayLongPress={400}
                  style={[
                    styles.tab,
                    isActive && !selectionMode ? styles.tabActive : styles.tabInactive,
                    isSelected ? styles.tabSelected : null,
                  ]}
                  activeOpacity={0.8}
                >
                  {selectionMode && (
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && !selectionMode
                        ? styles.tabLabelActive
                        : isSelected
                        ? styles.tabLabelSelected
                        : styles.tabLabelInactive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* ＋ボタン */}
          {!selectionMode && (
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              disabled={isAddDisabled}
              style={[styles.addButton, isAddDisabled && styles.addButtonDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={20}
                color={isAddDisabled ? COLORS.subText : COLORS.brand}
              />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* 選択モード時：削除バー */}
        {selectionMode && (
          <View style={styles.selectionBar}>
            <TouchableOpacity onPress={cancelSelection} style={styles.selectionBarButton}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>

            <Text style={styles.selectionCount}>
              {selectedSlots.length}件選択中
            </Text>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={selectedSlots.length === 0}
              style={[
                styles.selectionBarButton,
                selectedSlots.length === 0 && styles.deleteButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.deleteText,
                  selectedSlots.length === 0 && styles.deleteTextDisabled,
                ]}
              >
                削除
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 追加候補モーダル */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>追加する項目を選択</Text>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {addCandidates.length === 0 ? (
                <Text style={styles.emptyText}>追加できる項目がありません</Text>
              ) : (
                addCandidates.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => handleAddCandidate(c)}
                    style={styles.modalItem}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemText}>{c.label}</Text>
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.brand} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>閉じる</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────
// スタイル
// ────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 64,
    gap: 4,
  },
  tabActive: {
    backgroundColor: COLORS.brand,
  },
  tabInactive: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabSelected: {
    backgroundColor: COLORS.selectedLight,
    borderWidth: 1,
    borderColor: COLORS.selected,
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
  tabLabelSelected: {
    color: COLORS.selected,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: COLORS.selected,
    borderColor: COLORS.selected,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  // 選択モードバー
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  selectionBarButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.subText,
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteTextDisabled: {
    color: COLORS.subText,
  },
  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.subText,
    textAlign: 'center',
    paddingVertical: 24,
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.subText,
  },
});