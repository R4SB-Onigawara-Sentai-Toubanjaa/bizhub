/**
 * src/features/auth/components/AccountMenu.tsx
 *
 * 人物アイコンを押した際に表示する小さいドロップダウンメニュー。
 * - 名刺を見る（MyCardView へ遷移）
 * - サインアウト
 *
 * 詰め込みすぎないよう、項目は最小限（2つ）に留めている。
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccountMenuProps {
  visible: boolean;
  onClose: () => void;
  onViewCard: () => void;
  onSignOut: () => void;
}

const COLORS = {
  cardBg: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  border: '#D1D5DB',
  danger: '#DC2626',
};

export function AccountMenu({ visible, onClose, onViewCard, onSignOut }: AccountMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* メニュー外をタップしたら閉じる */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onClose();
              onViewCard();
            }}
          >
            <Ionicons name="card-outline" size={20} color={COLORS.text} style={styles.icon} />
            <Text style={styles.itemText}>名刺を見る</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onClose();
              onSignOut();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={styles.icon} />
            <Text style={[styles.itemText, styles.signOutText]}>サインアウト</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 180,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  signOutText: {
    color: COLORS.danger,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
});