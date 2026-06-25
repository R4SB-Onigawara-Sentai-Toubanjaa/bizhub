/**
 * src/features/my_card/components/FormInput.tsx
 *
 * 編集タブ内で使用する汎用テキスト入力欄。
 * - ラベルを上部に表示
 * - フォーカス時のみ青色ボーダー
 * - 高さ統一
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
}

const COLORS = {
  border: '#D1D5DB',
  borderFocus: '#2563EB',
  text: '#111827',
  subText: '#6B7280',
};

export default function FormInput({ label, required, style, ...inputProps }: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setIsFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          inputProps.onBlur?.(e);
        }}
        placeholderTextColor={COLORS.subText}
        style={[
          styles.input,
          isFocused ? styles.inputFocused : null,
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 6,
    fontWeight: '500',
  },
  required: {
    color: '#2563EB',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: COLORS.borderFocus,
    borderWidth: 1.5,
  },
});
