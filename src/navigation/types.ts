import { NavigatorScreenParams } from '@react-navigation/native';

// ▼ タブナビゲーター専用の型定義（下部メニュー用）
export type MainTabParamList = {
  HomeTab: undefined;         // 名刺ホーム画面（左）
  ContactListTab: undefined;  // 受取画面（中央）
  CameraTab: undefined;       // カメラ画面（右）
};

// ▼ アプリ全体のルートスタックの型定義
export type RootStackParamList = {
  // 未認証スタック
  Login: undefined;

  // 認証済みスタック
  Main: NavigatorScreenParams<MainTabParamList>; // ボトムタブ自体を1つの画面として扱う
  MyCardView: undefined;                         // タブ外：自分の名刺プレビュー
  MyCardEdit: undefined;                         // タブ外：自分の名刺編集
  ContactDetail: { contactId: string };          // タブ外：名刺詳細
};