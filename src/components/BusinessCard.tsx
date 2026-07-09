import React from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface BusinessCardProps {
  company: string;
  name: string;
  details: string[];
  logoUrl?: string | null;
  style?: StyleProp<ViewStyle>;
}

export function BusinessCard({
  company,
  name,
  details,
  logoUrl,
  style,
}: BusinessCardProps) {
  const filteredDetails = details
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 5);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.company} numberOfLines={1}>
          {company || "会社名未設定"}
        </Text>

        <View style={styles.logoCircle}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.logoFallback}>@</Text>
          )}
        </View>
      </View>

      <View style={styles.nameBlock}>
        <Text style={styles.name} numberOfLines={1}>
          {name || "氏名未設定"}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailBlock}>
        {filteredDetails.length > 0 ? (
          filteredDetails.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              style={styles.detailLine}
              numberOfLines={1}
            >
              {line}
            </Text>
          ))
        ) : (
          <Text style={styles.detailLine}>詳細情報なし</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#111827",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },
  company: {
    flex: 1,
    paddingRight: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: 40,
    lineHeight: 40,
    color: "#6B7280",
    fontWeight: "500",
  },
  nameBlock: {
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  name: {
    fontSize: 46,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#111827",
  },
  detailBlock: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    minHeight: 152,
  },
  detailLine: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 4,
  },
});
