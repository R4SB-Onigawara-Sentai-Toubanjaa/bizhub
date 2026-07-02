import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ContactItemData } from "../types";

interface Props {
  contact: ContactItemData;
}

// アプリ全体のナビゲーション型定義
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ContactListItem = ({ contact }: Props) => {
  const navigation = useNavigation<NavigationProp>();

  // 名刺詳細画面への遷移処理
  const handlePressDetail = () => {
    navigation.navigate("ContactDetail", { contactId: contact.id });
  };

  const initial = contact.displayName.charAt(0);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePressDetail}
      activeOpacity={0.7}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {contact.logoUrl ? (
              <Image
                source={{ uri: contact.logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>{initial}</Text>
              </View>
            )}
          </View>

          <View style={styles.companyBlock}>
            <Text style={styles.companyText} numberOfLines={1}>
              {contact.displayCompany}
            </Text>
            {contact.displayTitle ? (
              <Text style={styles.titleText} numberOfLines={1}>
                {contact.displayTitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.mainBlock}>
          <Text style={styles.nameText} numberOfLines={1}>
            {contact.displayName}
          </Text>
        </View>

        <View style={styles.footer}>
          {contact.contactLines.length > 0 ? (
            contact.contactLines.map((line) => (
              <Text
                key={`${contact.id}-${line}`}
                style={styles.detailText}
                numberOfLines={1}
              >
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.detailText}>連絡先情報なし</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 240,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 70,
    height: 36,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  logoFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  logoFallbackText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  companyBlock: {
    marginLeft: 12,
    flex: 1,
  },
  companyText: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  titleText: {
    marginTop: 2,
    fontSize: 12,
    color: "#4B5563",
  },
  mainBlock: {
    marginTop: 28,
  },
  nameText: {
    fontSize: 44,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1.5,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 22,
  },
  detailText: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
  },
});
