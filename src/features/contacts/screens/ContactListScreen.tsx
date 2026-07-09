import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthContext";
import { ContactListItem } from "../components/ContactListItem";
import { fetchContacts } from "../api/contactsApi";
import { ContactItemData, ContactSortOrder } from "../types";
import { BusinessCard } from "../../../components/BusinessCard";

export const ContactListScreen = () => {
  const { session } = useAuth();
  const ownerId = session?.user?.id;

  const [contacts, setContacts] = useState<ContactItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<ContactSortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactItemData | null>(null);

  const loadContacts = useCallback(async () => {
    if (!ownerId) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchContacts(ownerId, sortOrder);
      setContacts(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "名刺一覧の取得に失敗しました。";
      setErrorMessage(message);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, sortOrder]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const displayData = useMemo(() => {
    const filtered = contacts.filter((contact) => {
      const query = searchQuery.toLowerCase();
      const matchName = contact.snapshotName.toLowerCase().includes(query);
      const matchCompany =
        contact.snapshotCompany?.toLowerCase().includes(query) ?? false;

      return matchName || matchCompany;
    });

    return filtered;
  }, [contacts, searchQuery]);

  const toggleSortOrder = () => {
    setSortOrder((current) => (current === "desc" ? "asc" : "desc"));
  };

  const sortOrderLabel = sortOrder === "desc" ? "新しい順" : "古い順";

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>名刺を読み込み中です...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={26} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="氏名や会社名で検索..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={toggleSortOrder}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={30} color="#111827" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sortLabel}>並び順: {sortOrderLabel}</Text>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactListItem
            contact={item}
            onPress={() => setSelectedContact(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={loadContacts}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {errorMessage
                ? "データを取得できませんでした。下にある再読み込みをお試しください。"
                : "該当する名刺が見つかりません"}
            </Text>
            {errorMessage ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadContacts}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>再読み込み</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      <Modal
        visible={selectedContact !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedContact(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedContact(null)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {selectedContact ? (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setSelectedContact(null)}
                    style={styles.closeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>

                <BusinessCard
                  company={selectedContact.displayCompany}
                  name={selectedContact.displayName}
                  logoUrl={selectedContact.logoUrl}
                  details={[
                    selectedContact.displayTitle || "",
                    ...selectedContact.contactLines,
                  ]}
                  style={styles.expandedCard}
                />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    height: 54,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
  },
  filterButton: {
    width: 52,
    height: 52,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sortLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#4B5563",
    paddingLeft: 4,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 560,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  expandedCard: {
    width: "100%",
  },
});
