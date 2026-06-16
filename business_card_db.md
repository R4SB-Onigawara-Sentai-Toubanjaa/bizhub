# 名刺交換アプリ DB設計

## 1. profiles（ユーザー情報）

ユーザー自身のデジタル名刺情報を管理するテーブル。
ログイン認証情報は Supabase の `auth.users` に保存し、本テーブルではプロフィール情報のみ管理する。

| カラム名                | 型         | 制約                     | 説明         |
| ------------------- | --------- | ---------------------- | ---------- |
| id                  | UUID      | PK / FK(auth.users.id) | ユーザーID     |
| name                | TEXT      | NOT NULL               | 氏名         |
| company             | TEXT      | NULL                   | 所属         |
| department          | TEXT      | NULL                   | 部署         |
| position            | TEXT      | NULL                   | 役職         |
| phone_number        | TEXT      | NULL                   | 電話番号       |
| website             | TEXT      | NULL                   | Webサイト     |
| sns_link            | TEXT      | NULL                   | SNS        |
| profile_image_url   | TEXT      | NULL                   | アイコン       |
| exchange_identifier | TEXT      | UNIQUE                 | BLE/QR交換ID |
| created_at          | TIMESTAMP | NOT NULL               | 作成日時       |
| updated_at          | TIMESTAMP | NOT NULL               | 更新日時       |

### 型の説明

| 型         | 説明            |
| --------- | ------------- |
| UUID      | 一意な識別子を管理する型  |
| TEXT      | 可変長文字列を管理する型  |
| TIMESTAMP | 日時情報を管理する型    |
| NULL      | 値が未設定であることを許容 |

### 補足

* `id` は `auth.users.id` と紐づく
* `exchange_identifier` は BLE / QR交換時の識別子
* QRコードにはこのIDを埋め込む

---

## 2. business_cards（交換した名刺情報）

交換した相手の名刺情報を保存するテーブル。
交換時点の情報を保持するため、プロフィールのコピー（スナップショット）として保存する。

| カラム名              | 型         | 制約                         | 説明             |
| ----------------- | --------- | -------------------------- | -------------- |
| id                | UUID      | PK                         | 名刺ID           |
| owner_profile_id  | UUID      | FK(profiles.id) / NOT NULL | 名刺所有者          |
| profile_id        | UUID      | FK(profiles.id) / NULL     | 交換相手ユーザーID     |
| name              | TEXT      | NOT NULL                   | 氏名             |
| company           | TEXT      | NULL                       | 所属             |
| department        | TEXT      | NULL                       | 部署             |
| position          | TEXT      | NULL                       | 役職             |
| phone_number      | TEXT      | NULL                       | 電話番号           |
| website           | TEXT      | NULL                       | Webサイト         |
| sns_link          | TEXT      | NULL                       | SNS            |
| profile_image_url | TEXT      | NULL                       | アイコン           |
| exchange_method   | TEXT      | NOT NULL                   | 交換方法（BLE / QR） |
| created_at        | TIMESTAMP | NOT NULL                   | 保存日時           |
| updated_at        | TIMESTAMP | NOT NULL                   | 更新日時           |

### 型の説明

| 型         | 説明            |
| --------- | ------------- |
| UUID      | 名刺情報を一意に識別する型 |
| TEXT      | 名刺情報の文字列データ   |
| TIMESTAMP | 名刺保存日時を保持     |

### 補足

* `owner_profile_id`

  * 「誰が保持している名刺か」を管理
* `profile_id`

  * 相手がアプリ利用者の場合のみ紐づく
* 相手が退会しても名刺を保持できるよう `NULL` 許容
* 名刺情報は交換時点のスナップショットとして保存

---

## 3. card_exchanges（名刺管理テーブル）

名刺交換履歴を管理するテーブル。
「誰と」「いつ」「どの方法で交換したか」を記録する。

| カラム名             | 型         | 制約                               | 説明             |
| ---------------- | --------- | -------------------------------- | -------------- |
| id               | UUID      | PK                               | 交換履歴ID         |
| profile_id       | UUID      | FK(profiles.id) / NOT NULL       | ユーザーID         |
| business_card_id | UUID      | FK(business_cards.id) / NOT NULL | 名刺ID           |
| exchanged_at     | TIMESTAMP | NOT NULL                         | 交換日時           |
| exchange_method  | TEXT      | NOT NULL                         | 交換方法（BLE / QR） |
| memo             | TEXT      | NULL                             | メモ             |
| created_at       | TIMESTAMP | NOT NULL                         | 作成日時           |
| updated_at       | TIMESTAMP | NOT NULL                         | 更新日時           |

### 型の説明

| 型         | 説明            |
| --------- | ------------- |
| UUID      | 交換履歴を一意に管理する型 |
| TEXT      | メモや交換方式を保存する型 |
| TIMESTAMP | 名刺交換日時を保持する型  |

### 補足

* `exchanged_at`

  * 実際に交換した日時
* 同じ相手と複数回交換しても履歴保持可能
* `memo`

  * 「展示会で交換」「営業担当」など記録可能

---

## 4. テーブル関係

```text
auth.users
      │
      │ 1:1
      ▼
profiles
      │
      ├── 1:N ── business_cards
      │
      └── 1:N ── card_exchanges
                     │
                     └── N:1 business_cards
```

### 関係性

* **profiles : business_cards = 1 : N**

  * 1ユーザーは複数の名刺を持てる

* **profiles : card_exchanges = 1 : N**

  * 1ユーザーは複数回交換できる

* **business_cards : card_exchanges = 1 : N**

  * 同じ相手と複数回交換可能
