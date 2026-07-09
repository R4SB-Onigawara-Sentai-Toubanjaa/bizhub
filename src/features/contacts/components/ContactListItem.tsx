import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ContactItemData } from "../types";

interface Props {
  contact: ContactItemData;
  onPress: () => void;
}

export const ContactListItem = ({ contact, onPress }: Props) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.company} numberOfLines={1}>
            {contact.displayCompany}
          </Text>

          <View style={styles.logoBox}>
            {contact.logoUrl ? (
              <Image
                source={{ uri: contact.logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <Text style={styles.logoFallback}>@</Text>
            )}
          </View>
        </View>

        <View style={styles.nameArea}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.displayName}
          </Text>
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
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111827",
    overflow: "hidden",
    minHeight: 205,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  company: {
    flex: 1,
    paddingRight: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: 34,
    lineHeight: 34,
    color: "#6B7280",
    fontWeight: "600",
  },
  nameArea: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  name: {
    fontSize: 40,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1,
  },
});
