import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { BusinessCard } from "../../../components/BusinessCard";
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
      <BusinessCard
        company={contact.displayCompany}
        name={contact.displayName}
        logoUrl={contact.logoUrl}
        details={contact.contactLines.slice(0, 4)}  // 一覧は上位4件
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});