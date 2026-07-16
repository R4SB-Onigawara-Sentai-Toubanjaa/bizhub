import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

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
  const visibleDetails = details
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.company} numberOfLines={1}>
            {company || '会社名'}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {name || '氏名'}
          </Text>
        </View>
        <View style={styles.logoBox}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.logoFallback}>@</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {visibleDetails.length > 0 ? (
      <View style={styles.fields}>
        {visibleDetails.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.fieldLine}>
            {line}
          </Text>
        ))}
      </View>
    ) : (
      <View style={styles.fields}>
        <Text style={styles.emptyLine}>詳細情報なし</Text>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  company: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  fields: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 6,
  },
  fieldLine: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  emptyLine: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});