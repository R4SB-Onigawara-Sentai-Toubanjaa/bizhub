/**
 * src/features/my_card/components/ImagePickerField.tsx
 *
 * 画像タブ用：ロゴ画像の選択・プレビュー・差し替え。
 * 端末内の画像を expo-image-picker で選択し、expo-image-manipulator で
 * リサイズ・圧縮してから親コンポーネントへ uri を渡す（アップロード自体は
 * api/myCardApi.ts の uploadLogoImage が担当）。
 */
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImagePickerFieldProps {
  imageUri: string | null;
  onChange: (localUri: string) => void;
  isUploading?: boolean;
}

const COLORS = {
  brand: '#2563EB',
  border: '#D1D5DB',
  text: '#111827',
  subText: '#6B7280',
  bg: '#F5F6F8',
};

const MAX_DIMENSION = 512;
const COMPRESS_QUALITY = 0.7;

export default function ImagePickerField({ imageUri, onChange, isUploading }: ImagePickerFieldProps) {
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('画像へのアクセスが許可されていません。設定から権限を許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: MAX_DIMENSION } }],
        { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
      onChange(manipulated.uri);
    } catch (e) {
      setError('画像の処理に失敗しました。別の画像をお試しください。');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>ロゴ画像（任意）</Text>

      <View style={styles.previewWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>未設定</Text>
          </View>
        )}
        {isUploading ? (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePick} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{imageUri ? '画像を差し替える' : '画像を選択する'}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 12,
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  previewWrap: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: COLORS.subText,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
});
