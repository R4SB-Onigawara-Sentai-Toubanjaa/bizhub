# Database Design

## 概要
本アプリは、BLE または QR コードを用いたデジタル名刺交換アプリである。  
DB設計では責務分離を重視し、以下の4テーブルで構成する。

- `users`：アプリ利用者管理
- `business_cards`：ユーザーの最新名刺管理
- `contacts`：名刺交換関係管理
- `business_card_versions`：名刺履歴管理

---

# 1. users（ユーザー管理）

## 役割
アプリ利用者そのものを管理する。  
認証は Supabase Auth を利用し、`auth.users.id` と同一IDを保持する。

| カラム名 | データ型 | 制約・属性 | 役割 |
|---|---|---|---|
| id | UUID | Primary Key / Foreign Key (`auth.users.id`) | ユーザーID |
| exchange_identifier | TEXT | UNIQUE | BLE / QR交換用識別子 |
| created_at | TIMESTAMPTZ | Default: now() | 登録日時 |

---

# 2. business_cards（最新名刺管理）

## 役割
ユーザーの最新の名刺情報を保持する。  
1ユーザーにつき1枚のみ保持する。

| カラム名 | データ型 | 制約・属性 | 役割 |
|---|---|---|---|
| id | UUID | Primary Key | 名刺ID |
| user_id | UUID | Foreign Key (`users.id`), UNIQUE | 名刺所有者 |
| name | TEXT | NOT NULL | 氏名 |
| company | TEXT | NULL | 会社名 |
| department | TEXT | NULL | 部署 |
| position | TEXT | NULL | 役職 |
| email | TEXT | NULL | メールアドレス |
| phone_number | TEXT | NULL | 電話番号 |
| logo_path | TEXT | NULL | 会社ロゴ画像保存パス |
| custom_fields | JSONB | Default: {} | カスタム項目 |
| created_at | TIMESTAMPTZ | Default: now() | 作成日時 |
| updated_at | TIMESTAMPTZ | Default: now() | 更新日時 |

---

## custom_fields(JSONB)

スロット固定型で保存する。

```json
{
  "1": {
    "label": "GitHub",
    "value": "https://github.com/example",
    "type": "url"
  },
  "2": null,
  "3": {
    "label": "趣味",
    "value": "釣り",
    "type": "text"
  }
}
```

### 説明
- キー = 名刺上の表示スロット
- `null` = 空スロット
- 項目追加時もレイアウト崩れを防ぐ

---

# 3. contacts（交換関係管理）

## 役割
誰が誰の名刺を所持しているかを管理する。  
交換イベントそのものを記録する。

| カラム名 | データ型 | 制約・属性 | 役割 |
|---|---|---|---|
| id | UUID | Primary Key | 交換ID |
| owner_id | UUID | Foreign Key (`users.id`), INDEX | 名刺を所持するユーザー |
| target_user_id | UUID | Foreign Key (`users.id`), INDEX | 交換相手 |
| exchange_count | INTEGER | Default: 1 | 交換回数 |
| first_exchanged_at | TIMESTAMPTZ | NOT NULL | 初回交換日時 |
| last_exchanged_at | TIMESTAMPTZ | NOT NULL | 最終交換日時 |
| latest_version_id | UUID | Foreign Key (`business_card_versions.id`) | 最新取得履歴 |

### 制約

```sql
UNIQUE(owner_id, target_user_id)
```

### 補足
同一相手との交換は1レコードで管理し、  
再交換時に `exchange_count` を増加させる。

---

# 4. business_card_versions（名刺履歴管理）

## 役割
名刺更新時の過去データを保存する。  
役職変更・部署変更・連絡先変更などに対応する。

| カラム名 | データ型 | 制約・属性 | 役割 |
|---|---|---|---|
| id | UUID | Primary Key | 履歴ID |
| business_card_id | UUID | Foreign Key (`business_cards.id`), INDEX | 元名刺 |
| version_no | INTEGER | NOT NULL | バージョン番号 |
| card_snapshot | JSONB | NOT NULL | 当時の名刺情報 |
| created_at | TIMESTAMPTZ | Default: now() | 履歴作成日時 |

---

## card_snapshot(JSONB)

```json
{
  "name": "田中 太郎",
  "company": "ABC株式会社",
  "department": "営業部",
  "position": "主任",
  "email": "tanaka@example.com",
  "custom_fields": {
    "1": {
      "label": "GitHub",
      "value": "https://github.com/example"
    }
  }
}
```

---

# ER図

```text
users
 ├── business_cards (1:1)
 ├── contacts.owner_id (1:N)
 └── contacts.target_user_id (1:N)

business_cards
 └── business_card_versions (1:N)

contacts
 └── latest_version_id → business_card_versions
```

---

# 責務分離

| テーブル | 責務 |
|---|---|
| users | ユーザー管理 |
| business_cards | 現在の名刺管理 |
| contacts | 名刺交換関係管理 |
| business_card_versions | 過去名刺履歴管理 |

---

# セキュリティ設計（RLS）

## users
- 参照：本人のみ or 最小限公開
- 更新：本人のみ

## business_cards
参照可能：
- 本人
- 交換済みユーザー

更新可能：
- 本人のみ

## contacts
参照可能：
- `owner_id = auth.uid()`

他人の名刺フォルダは閲覧不可。

## business_card_versions
参照可能：
- 本人
- 交換済み相手のみ

---

# ストレージ設計

画像は Supabase Storage を利用する。

対象:
- profile_image_path
- logo_path

制約:
- MIME: image/jpeg, image/png, image/webp
- 最大サイズ: 2MB
- 推奨リサイズ: 幅800px
- Private Bucket 推奨

---

# データフロー

1. ユーザー登録  
   → `users` 作成

2. 名刺作成  
   → `business_cards` 作成

3. BLE / QRで交換  
   → `contacts` 作成

4. 名刺更新  
   → 更新前データを `business_card_versions` に保存  
   → `business_cards` 更新

5. 再交換  
   → `exchange_count` 更新  
   → `latest_version_id` 更新