import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  PixelRatio,
  Platform,
  Animated,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthContext";
import { AccountMenu } from "../../auth/components/AccountMenu";
import { generateQrToken } from "../api/qrToken";
import { RootStackParamList } from "../../../navigation/types";
import { useBLE } from "../hooks/useBLE";
import { processExchange } from "../api/exchangeCard";
import { fetchMyCard } from "../../my_card/api/myCardApi";
import { MyCardFormState } from "../../my_card/types";
import { BusinessCard } from "../../../components/BusinessCard";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// アイコン画像とそのピクセルサイズ(解像度)のリスト
const RESTART_ICONS = [
  { size: 38, source: require("./icon/icons8-restart.png") },
  { size: 50, source: require("./icon/icons8-restart2.png") },
  { size: 50, source: require("./icon/icons8-restart3.png") },
  { size: 75, source: require("./icon/icons8-restart4.png") },
  { size: 100, source: require("./icon/icons8-restart5.png") },
  { size: 100, source: require("./icon/icons8-restart6.png") },
  { size: 150, source: require("./icon/icons8-restart7.png") },
  { size: 150, source: require("./icon/icons8-restart8.png") },
  { size: 200, source: require("./icon/icons8-restart9.png") },
];

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { session, signOut } = useAuth();
  const { width, height } = useWindowDimensions();

  // 変更点1: 新しいフックの返り値を受け取る
  const {
    isInitialized,
    isExchanging,
    startExchange,
    stopExchange,
    error: bleError,
  } = useBLE();

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [myCard, setMyCard] = useState<MyCardFormState | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // 画面の解像度(PixelRatio)にあわせて80x80表示に最適なアイコンを選択
  const getResponsiveIcon = useCallback(() => {
    const pixelRatio = PixelRatio.get();
    const displaySize = 15; // 80x80固定
    const targetPixelSize = displaySize * pixelRatio;

    // 用意された画像群から必要解像度に最も近いものを選択
    let selectedIcon = RESTART_ICONS[0];
    let minDiff = Number.MAX_VALUE;

    for (const icon of RESTART_ICONS) {
      const diff = Math.abs(icon.size - targetPixelSize);
      if (diff < minDiff) {
        minDiff = diff;
        selectedIcon = icon;
      }
    }

    return { source: selectedIcon.source, displaySize };
  }, []);

  const { source: iconSource, displaySize: iconSize } = getResponsiveIcon();

  // 名刺データを取得
  const loadMyCard = useCallback(async () => {
    if (!session?.user.id) return;
    try {
      const card = await fetchMyCard(session.user.id);
      setMyCard(card);
    } catch (error: any) {
      console.error("名刺データ取得エラー:", error.message);
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadMyCard();
  }, [loadMyCard]);

  // カードをフリップするアニメーション
  const handleCardFlip = () => {
    setIsCardFlipped(!isCardFlipped);
    Animated.timing(flipAnimation, {
      toValue: isCardFlipped ? 0 : 180,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

  // アニメーション値をY軸回転に変換（表面・裏面それぞれ用）
  const frontRotateY = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backRotateY = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const fetchToken = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const { token, expiresAt } = await generateQrToken(session.user.id);
      setQrToken(token);
      setExpirationTime(new Date(expiresAt).getTime());
    } catch (error: any) {
      Alert.alert("エラー", "QRコードの生成に失敗しました: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    if (!expirationTime) return;

    let intervalId: ReturnType<typeof setInterval>;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        fetchToken();
      }
    };

    updateTimer();
    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [expirationTime, fetchToken]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("エラー", "サインアウトに失敗しました: " + error.message);
    }
  };

  const handleBluetoothPress = async () => {
    if (bleError) {
      Alert.alert("BLEエラー", bleError);
      return;
    }
    if (!isInitialized) {
      Alert.alert("準備中", "Bluetoothの初期化が完了していません。");
      return;
    }
    if (!qrToken) {
      Alert.alert("エラー", "送信するQRコード（トークン）が存在しません。");
      return;
    }

    if (isExchanging) {
      await stopExchange();
      return;
    }

    try {
      // 1. BLE通信の実行
      const peerToken = await startExchange(qrToken);

      // 2. 通信完了後、確認ダイアログを表示
      Alert.alert(
        "交換相手の確認",
        "相手の端末から名刺データを受信しました。\n連絡先に追加しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
          },
          {
            text: "追加する",
            onPress: async () => {
              if (!session?.user.id) return;
              try {
                setLoading(true);
                // 3. 既存の交換処理APIを実行
                await processExchange(session.user.id, peerToken);
                Alert.alert("追加完了", "連絡先に登録しました。");
              } catch (e: any) {
                Alert.alert("追加失敗", e.message);
              } finally {
                setLoading(false);
              }
            },
          },
        ],
      );
    } catch (error: any) {
      if (!error.message.includes("キャンセル")) {
        Alert.alert("通信エラー", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setIsMenuVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person-circle-outline" size={32} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <AccountMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onViewCard={() => navigation.navigate("MyCardView")}
        onSignOut={handleSignOut}
      />

      <View style={styles.headerRight}>
        {/* 変更点3: ボタンの表示と色を状態に応じて変更 */}
        <Button
          title={isExchanging ? "待機中(タップで停止)" : "Bluetooth交換"}
          color={isExchanging ? "#e53e3e" : "#2563EB"}
          onPress={handleBluetoothPress}
        />
      </View>

      <Text style={styles.title}>名刺QRコード</Text>

      {loading ? (
        <View style={styles.qrContainer}>
          <View style={styles.qrCodeBackground}>
            <ActivityIndicator size="large" />
          </View>
        </View>
      ) : qrToken ? (
        <View style={styles.qrContainer}>
          <View style={styles.qrCodeBackground}>
            <QRCode value={qrToken} size={200} />
            <View style={styles.tokenRowContainer}>
              <Text style={styles.tokenText}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </Text>
              <TouchableOpacity
                onPress={fetchToken}
                disabled={loading}
                style={[styles.refreshButton, loading && styles.disabledButton]}
                activeOpacity={0.7}
                hitSlop={{ top: 20, bottom: 12, left: 12, right: 12 }}
              >
                <Image
                  source={iconSource}
                  style={{
                    width: iconSize,
                    height: iconSize,
                    resizeMode: "contain",
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <View style={styles.qrCodeBackground}>
            <View style={styles.tokenRowContainer}>
              <Text style={styles.expiredText}>QRコードを取得できません</Text>
              <TouchableOpacity
                onPress={fetchToken}
                disabled={loading}
                style={[styles.refreshButton, loading && styles.disabledButton]}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Image
                  source={iconSource}
                  style={{
                    width: iconSize,
                    height: iconSize,
                    resizeMode: "contain",
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 名刺カード表示エリア */}
      {myCard && (
        <View style={styles.cardDisplayContainer}>
          <View style={styles.cardWrapper}>
            {/* 表面: 0deg -> 180deg */}
            <Animated.View
              style={[
                styles.cardFace,
                {
                  transform: [{ rotateY: frontRotateY }],
                  backfaceVisibility: "hidden",
                },
              ]}
              pointerEvents={isCardFlipped ? "none" : "auto"}
            >
              <BusinessCard
                company={myCard.company}
                name={myCard.name}
                details={myCard.customFields
                  .filter((field) => field.value.trim())
                  .map((field) => `${field.label}: ${field.value}`)}
                logoUrl={myCard.logoUrl}
                style={styles.businessCard}
              />
            </Animated.View>

            {/* 裏面: 180deg -> 360deg（最初から180度反転させておく） */}
            <Animated.View
              style={[
                styles.cardFace,
                styles.cardBackside,
                {
                  transform: [{ rotateY: backRotateY }],
                  backfaceVisibility: "hidden",
                },
              ]}
              pointerEvents={isCardFlipped ? "auto" : "none"}
            >
              <Text style={styles.backText}>名刺情報</Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={[
              styles.flipTrigger,
              isCardFlipped && styles.flipTriggerFlipped,
            ]}
            onPress={handleCardFlip}
            activeOpacity={0.7}
          >
            <Text style={styles.flipIcon}>Tap</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { position: "absolute", top: 50, left: 16 },
  headerRight: { position: "absolute", top: 50, right: 10 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  qrContainer: {
    alignItems: "center",
    marginVertical: 20,
    minHeight: 310,
    justifyContent: "center",
    marginTop: -10,
  },
  tokenRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    top: 15,
  },
  tokenText: { color: "#666", fontSize: 14, marginRight: 8 },
  timerText: { fontWeight: "bold", color: "#e53e3e" },
  expiredText: {
    color: "#e53e3e",
    fontWeight: "bold",
    fontSize: 10,
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 50,
    backgroundColor:
      Platform.OS === "ios" ? "transparent" : "rgba(0, 0, 0, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  cardDisplayContainer: {
    width: "90%",
    marginTop: 20,
    marginBottom: 20,
    position: "relative",
  },
  cardWrapper: {
  width: "100%",
  aspectRatio: 1.9,
  position: "relative", // 追加: 子(cardFace)を絶対配置で重ねるための基準
  },
  cardFace: {
    position: "absolute", // 追加: 表裏を完全に重ねる
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  businessCard: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  cardBackside: {
    flex: 1,
    backgroundColor: "#adadad",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#faf8f8",
  },
  flipTrigger: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  flipIcon: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  flipTriggerFlipped: {
    backgroundColor: "#969494",
  },
  qrCodeBackground: {
    width: 260,
    height: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    top: -20,
  },
});
