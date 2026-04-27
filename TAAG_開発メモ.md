# TAAG サイト構築 開発メモ
最終更新: 2026-04-27（定期自動更新: 前回更新以降、新規セッション・ファイル変更なしのため内容維持・日付のみ更新）

## ★コードレビュー報告ポリシー（恒久ルール）
本プロジェクト内でClaudeがコードを生成・修正した際は、回答末尾に必ず以下を報告すること。
セッションをまたいでも常に有効。

1. **外部URL・CDNからの読み込み**: `<script src>`, `<link href>`, `@import`, webfont, 画像CDN等を全て列挙
2. **外部通信**: `fetch()`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon` 等があれば送信先と内容を説明
3. **該当なしの場合**: 「外部通信・外部読み込みなし」と明記

理由: ユーザー（直美）はコードレビューの細部知識が十分でないため、見落としを防ぎつつ意図しない外部依存・トラッキング・CMS移行時の隠れ依存を可視化するため。

## ★マルチデバイス対応ポリシー（恒久ルール）
サイト用のコードを書く際は、PCブラウザだけでなく**モバイル端末からのアクセスも常に意識する**こと。

具体的には：
- `<meta name="viewport" content="width=device-width,initial-scale=1">` を必ず入れる
- レイアウトはレスポンシブ前提で設計（固定幅px multiplyでなく、%, vw, vh, clamp(), min/max を活用）
- タッチ操作を考慮（hover依存のUIを避ける、タップ領域は最低44×44px目安）
- フォントサイズはモバイルで読める下限を確保（本文14px以上推奨）
- アニメーション・SVGはモバイルでも軽快に動くか配慮（重い filter, requestAnimationFrame の負荷など）
- 横スクロール発生に注意（`overflow-x:hidden` を最上位に入れる、要素幅を100vw超にしない）
- 実機検証が難しい場合でもDevToolsのレスポンシブモードで複数サイズを想定すること


## 概要
武田建築設計事務所（t-2ag.com）のウェブサイトリニューアル。
現在フロンティア社のSaaS型CMSで運用中。エントランスアニメーション等の独自演出を追加構築中。

## 会社情報（最新）
- 会社名: 株式会社 武田建築設計事務所（TAAG = Takeda And Architect Group）
- 代表: 武田 嘉仁
- 所在地: 〒186-0004 東京都国立市中 1-16-33-2F
- 電話: **050-5482-3773**（2026-04-27現在）※旧番号 042-505-5752 は実物名刺写真に記載されているが現在は使用していない
- 公開用メール: info@t-2ag.com（mockup等の公開素材では個人メールではなくこれを使用）
- ※モックアップ等を Public リポジトリに置く際は、個人連絡先（武田氏個人メール、私用携帯番号）を記載しないこと

## CMS環境
- プラットフォーム: フロンティア社 SaaS型CMS
- URL: https://t-2ag.com/
- 管理画面: https://t-2ag.com/admin/
- 制約: サーバーへの直接ファイル配置は不可
- 実装方法: 管理画面の「HTML埋め込みパーツ」または「独自JS/CSS」設定欄を使用
- 埋め込み依頼の流れ: ソースをフロンティアに渡す → 対応可否判定・見積算出
- サーバー移管: 契約・技術仕様上不可（静的HTMLデータの引き渡しは可能、有償）
- 管理画面メニュー（確認済み）: 左メニューに「埋め込みパーツ」「設定」あり
- 管理画面URL例: `/admin/newpages/`、`/admin/settings/common-sidenavi/`

### マニュアル読了で判明した重要事項
- 「埋め込みパーツ」≠ HTML埋め込み欄。実体は定型コンテンツブロック（企業情報・ギャラリー・スタッフ・FAQ・ビフォーアフター・お問い合わせ・お気に入り）で、構造は変更不可
- **ページ単位の「上級者設定」**（マニュアルp.12 / ブログ記事 p.69）に以下が存在 ★最重要
  - 独自CSS（ページ単位）
  - 独自JS（ページ単位）
  - 独自<head>タグ内容（ページ単位）
- ページ単位の「拡張設定」でヘッダー / ロゴ / ナビ / MV / フッターを個別に非表示可（p.10, p.68）
- サイト全体の設定: `設定>独自CSS`（p.99）, `設定>独自<head>タグ`（p.100, head内+</body>直前）
- 高度な設定（p.111）: <header>, <div id="sidebar">, <footer> 内のHTMLタグを直接編集可能
- リダイレクト設定（p.110）: 301/302リダイレクト可能
- 画像ファイル: 「画像ファイル>新規追加」（p.73）からメディアにアップロード→URL参照可
- ※実UI上の容量上限・JS実行制限は要実機検証

## ファイル構成
```
TAAGサイト構築/
├── images/                     — サイト用写真素材
│   ├── 001_0770.jpg 〜 015_0950.jpg  — 建築写真15枚（003_0773.jpgをトップ背景に使用中）
│   ├── trim_007_0855.jpg       — 007をトリミング加工した版
│   └── yoshihito2.png          — プロフィール写真
├── ourworks_photos/            — OUR WORKS用施工例写真（2026-04-10追加）
│   ├── AR ANNEX/               — 商業・オフィス（Web&PreviewとHighResolutionの2セット）
│   ├── LeMon/                  — オフィス・ワークスペース（63枚）
│   ├── 新丸子東1丁目計画/      — 集合住宅（25枚）
│   ├── 東京西徳洲会病院 1F薬局改修工事/ — 医療施設改修（25枚＋竣工写真PDF）
│   ├── 森邸/                   — 個人住宅（24枚）
│   └── 長沢1丁目pj/            — 商業施設（採用15カット＋不採用25枚）
├── src/                        — ソース・オブ・トゥルース（CSS/JS/HTML分離構成）★CMS移行向け
│   ├── css/
│   │   ├── entrance.css        — エントランスページ用CSS
│   │   └── ourworks.css        — OUR WORKSページ用CSS（2026-04-13追加）
│   ├── js/
│   │   └── entrance.js         — エントランスページ用JS
│   ├── entrance.html           — エントランスページHTML（CSS/JS外部参照版）
│   ├── ourworks.html           — OUR WORKSページHTML（2026-04-13追加、グリッドカードレイアウト）
│   ├── mockup_concept_layouts.html — コンセプト画面レイアウト検討用モックアップ（2026-04-10）
│   ├── mockup_concept_window.html  — コンセプト画面「窓」UI検討用モックアップ（2026-04-10）
│   ├── mockup_mobile_compare.html  — モバイル表示比較用モックアップ（2026-04-10）
│   ├── mockup_entrance_variants.html  — エントランス案6種の比較インデックス（2026-04-27追加）
│   ├── mockup_entrance_01_process.html — ①BUILDING PROCESS（基礎→骨組み→屋根→外装→灯）
│   ├── mockup_entrance_02_unfold.html  — ②PLAN→ELEVATION→AXONOMETRIC（2D→3D展開）
│   ├── mockup_entrance_03_sketch.html  — ③HAND SKETCH（手描きスケッチ風、feTurbulence）
│   ├── mockup_entrance_04_daycycle.html — ④A DAY IN ARCHITECTURE（朝→昼→夕→夜）
│   ├── mockup_entrance_05_terrain.html — ⑤FROM THE LAND（等高線→敷地→建築）
│   └── mockup_entrance_06_card.html    — ⑥A CARD HANDED TO YOU（名刺差し出し／ユーザー案）
├── taag_april_entrance.html    — 4月版エントランス（桜）モノリシック旧版・参照用
├── taag_april_entrance_trim.html — 4月版（トリミング写真カバー）※モバイル調整未適用
├── taag_entrance_may.html      — 5月版エントランス（鯉のぼり＋緑樹）
├── about.html                  — About Usページ
├── TAAG_施工例リスト.xlsx      — 施工例リスト（2026-04-13追加、全13案件＝掲載中6件＋準備中7件）
├── .gitattributes              — Git属性設定（改行コード等）
├── .gitignore                  — Git追跡除外設定（マニュアル・スクショを公開対象外に）
├── CLAUDE.md                   — Claude向けプロジェクト起動指示（開発メモの読み込み指示等）
├── 3.1_manual_210602.pdf       — フロンティアCMSマニュアル（※.gitignoreで除外、GitHub非公開）
├── Screenshot_20260407-140557.png — 管理画面スクリーンショット（※.gitignoreで除外、GitHub非公開）
└── TAAG_開発メモ.md            — 本ファイル
```
※モノリシック版HTMLファイル（taag_april_entrance.html等）は画像をBase64埋め込み済み（IMGESフォルダはローカル管理用）
※`src/` 配下はCSS/JS/HTML分離構成で、CMS上級者設定への貼り付けやGitHub Pages配信に適した形式
※`ourworks_photos/` はGitHub非公開にするか要確認（容量大・個人情報含む可能性）

## 設計方針

### エントランスページ
- 建築図面風のSVGアニメーション（stroke-dasharray/dashoffsetによる線描画）
- 季節ごとにモチーフを変更（4月:桜、5月:鯉のぼり、将来的に12ヶ月対応予定）
- 棒人間が歩いてドアに入る→トップページへ遷移するインタラクション
- viewBox幅804px（モバイル対応のため960pxから縮小、PC/モバイル共通）

### ページ遷移フロー
```
エントランス → (ドアをクリック) → トップページ → ABOUT US → トップページ → エントランス
```
- `?top=1` URLパラメータでトップページ直接表示（サブページからの戻り時）
- `<head>`内の`document.write`でCSS注入し、エントランスの一瞬表示を防止
- `goBack()`で`topDirect`スタイルを削除し、エントランスへ正常復帰

### SVG座標系
- viewBox: `0 0 804 700`
- メインコンテンツは`translate(222,0)`グループ内
- 図面枠: x=10, width=784
- TAKEDA欄: x=10〜200
- グリッド: A(26px)+B(52px)×3ブロック、2行（x=200〜434）
- 方位: cx=469
- 建物名欄: x=504〜624
- 縮尺欄: x=624〜724（区切りx=659）
- 図番: x=759
- 建築図面縮尺: 330px = 4,550mm → 1px ≈ 13.79mm

### 棒人間アニメーション
- START_OFFSET = 100（建物と重ならない位置）
- 描画完了後3.2s + 0.5s 遅延で歩行開始（startAnim delay 3700ms）
- requestAnimationFrameベースの歩行サイクル

### 鯉のぼり（5月版）
- 武田菱の真上、x=105に絶対配置（translateグループの外）
- scale(1.5)で拡大
- 真鯉(黒) y=145、緋鯉(赤) y=189、子鯉(青) y=227
- 筒状の胴＋V字切れ込みの尾
- ポール寸法線: x=80, "5,000"

### フォント
- ロゴ: Shippori Mincho B1（serif）
- ナビ/UI: Montserrat（sans-serif）
- 日本語本文: Noto Sans JP
- 図面テキスト: Share Tech Mono（monospace）

## トップページ
- 背景: 003_0773.jpg（建築写真）、brightness(0.8)
- タグライン: slideInBounceアニメーション（フォント: 'MS Gothic','Hiragino Kaku Gothic ProN','Yu Gothic', sans-serif）
- ナビゲーション: ABOUT US → about.html

## コンセプト画面（2026-04-10開発）
- `src/mockup_concept_layouts.html` / `mockup_concept_window.html` で検討済み
- 背景色: PC版 `#dddad6`（スマホ版 `#e8e6e3`）
- レイアウト: テキスト左寄せ（`.concept-body-left`）、画像窓右寄せ（`margin-left: auto`）
- 「朝の光が…」テキストとフォトウィンドウを左右に明確分離
- 署名（`.concept-signature`）は `margin-top: 48px` で下に配置
- コンセプト画面の縦サイズ = トップ画面と同じ `100dvh`（`display: flex; justify-content: center`）
- ドットナビは画像窓と同じ右揃え

## OUR WORKSページ（2026-04-10着手、2026-04-13実装開始）
- 施工例6物件の写真を `ourworks_photos/` に整理済み（各フォルダに5枚程度を選定予定）
- 参照デザイン: https://www.acra-a.com/works/（グリッドカードレイアウト）
- レイアウト方針: 大きな写真カード＋物件名＋カテゴリのグリッド表示
- **2026-04-13: `src/ourworks.html` と `src/css/ourworks.css` を新規作成**（グリッドカードレイアウトのベース実装）
- トップページ（entrance.html）の以下2箇所から `ourworks.html` にリンク接続済み：
  - コンセプト画面下部の「VIEW OUR WORKS →」ボタン
  - 上部ナビの「WORKS / 実績紹介」

### 施工例リスト（TAAG_施工例リスト.xlsx、2026-04-13作成）
- マスターDB（`TAAG_案件管理台帳.xlsx`、親フォルダ ClaudeWorkArea 直下）のコード体系に連動した施工例リスト
- 全13案件を掲載：**掲載中6件**（サイトに写真掲載済み）＋**準備中7件**
- 書式はマスターDBと統一（Yu Gothic・罫線・ストライプ・ヘッダーダークブラウン）
- 掲載中6件はサイト掲載名・概要文・写真情報を引き継ぎ済み

### マスターDB連携上の確定事項（2026-04-13）
- 案件コード体系：`TAAG-{種別コード}-{受注年}-{連番}`（種別 R=住宅, C=商業, O=オフィス, M=医療, S=工場 など）
- 受注年不明時は竣工年で代用
- コード修正（5件）実施済み：
  - TAAG-C-2024-001 → TAAG-C-2023-003（長沢1丁目、受注年2023に合わせ）
  - TAAG-O-2024-001 → TAAG-M-2023-001（LeMonクリニック、種別O→M修正）
  - TAAG-R-2024-001 → TAAG-R-2018-001（新丸子東1丁目、受注年2018に合わせ）
  - TAAG-R-2024-002 → TAAG-R-2024-001（森邸、連番繰り上げ）
  - TAAG-C-2024-002 → TAAG-C-2024-001（下北沢駅前、連番繰り上げ）
- 案件ステータスドロップダウン：「受注 / 進行中 / 竣工 / 中途終了 / キャンセル」の5択（2026-04-13「中途終了」追加）

### 施工例一覧（確定）
| 物件名 | 種別 | 概要 | 写真フォルダ |
|---|---|---|---|
| 長沢1丁目pj | 商業施設 | 水辺のカフェ・ウォータースポーツ施設。コンテナ風モダン建築 | 採用15カット/ |
| AR ANNEX | 商業・オフィス | モダンガラスファサードの店舗ビル。ミニマルオフィス内装 | Web&Preview/ |
| LeMon | オフィス・ワークスペース | すりガラス＋木枠パーティション、ビオフィリックデザイン | LeMon/ |
| 新丸子東1丁目計画 | 集合住宅 | ダークブリック外装、曲線コーナー、ロフト付き住戸 | 新丸子東1丁目計画/ |
| 東京西徳洲会病院 1F薬局改修工事 | 医療施設改修 | 木目調カウンター、スカイライト天井の薬局 | 東京西徳洲会病院.../ |
| 森邸 | 個人住宅 | 狭小地モダン住宅。白い金属サイディング、打ちっぱなし内装 | 森邸/ |

## About Usページ
- ヘッダー/ナビ固定
- プロフィール: 2カラムグリッド（写真+テキスト）
- 経歴タイムライン
- 「武田建築設計事務所」クリック → taag_april_entrance.html?top=1
- 「← BACK TO TOP」 → taag_april_entrance.html?top=1
- ※経歴の年号に19XXダミーデータあり（要更新）

## 開発フロー方針
- コーディング作業（HTML/CSS/JS編集・テスト）: Claude Code を使用
- フロンティア管理画面の確認・操作: Cowork のブラウザ連携を使用
- 文脈共有: 本開発メモをツール間の引き継ぎ用ハブとして使用
- 開発メモは scheduled-task により自動更新（毎日0時、`taag-dev-memo-update`）
- `CLAUDE.md` をフォルダ直下に配置し、新規セッション開始時の起動指示として機能させる

### ソースコード管理方針（2026-04-07検討）
- `src/` フォルダにCSS/JS/HTML分離構成のソース・オブ・トゥルースを配置
- モノリシック版（taag_april_entrance.html等）は参照用として残す

### 社長との共有・動作確認方法（2026-04-09確立）
GitHub Pages を採用。セットアップ完了済み。

- **GitHubリポジトリ**: https://github.com/morisawat2ag-source/taag-site （Public）
- **GitHub Pages URL**: https://morisawat2ag-source.github.io/taag-site/
- **エントランスページ確認URL**: https://morisawat2ag-source.github.io/taag-site/src/entrance.html
- **ツール**: GitHub Desktop（GUI操作、コマンドライン不要）

| フェーズ | 方法 | 目的 |
|---|---|---|
| 開発中のスマホ確認 | GitHub Pages URL | CSS/JS/画像の相対パスが正しく動作 |
| 社長への随時共有 | 同上のURLをLINE等で送信 | URL固定なのでpush後は常に最新版が見える |
| 仕様確定後の最終確認 | フロンティアCMS | 本番環境での挙動確認 |

更新の日常フロー:
1. ローカルでファイル編集
2. GitHub Desktop で「Commit to main」（変更メモを添えて）
3. 「Push origin」をクリック → 数分でGitHub Pages に反映

注意事項:
- `.gitignore` で `3.1_manual_210602.pdf`（フロンティアマニュアル）と `Screenshot_*.png` を除外済み
- Publicリポジトリのため、パスワード・APIキー・個人情報を含むファイルはコミットしないこと
- クラウドストレージ（Google Drive, BOX等）のプレビュー機能ではCSS/JS/画像の相対パスが動作しない → 必ずウェブサーバー経由（GitHub Pages等）で確認すること

## フロンティアCMS実装方針（2026-04-07確定）

### 採用方針: 専用エントランスページ方式
1. **新規ページ `/entrance/` を作成**
   - 拡張設定: ヘッダー/ロゴ/ナビ/MV/フッター 全て非表示 → 全画面キャンバス確保
   - 上級者設定>独自CSS: bodyリセット、SVGスタイル
   - 上級者設定>独自<head>タグ: Google Fontsなど
   - 上級者設定>独自JS: SVG描画/棒人間アニメ/ドアクリック遷移ロジック
   - パーツエリアは空（または「外部HTML」パーツでSVGコンテナのみ）
2. **TOPページ (/) は通常のフロンティア構築**（写真背景・タグライン・ナビ）
3. **About Us は新規ページ**として通常パーツで構築
4. **遷移制御**: sessionStorage で「初回エントランス、再訪はTOP直行」を実現
   - URL パラメータ `?top=1` 方式を廃止し CMS の URL 構造に依存しない設計へ
5. **画像**: メディアにアップロードしてURL参照（Base64埋め込みは廃止）

### 容量・JS実行可否の検証ポイント
- 上級者設定の各欄に文字数上限があるか（マニュアル明示なし→実機検証）
- 独自JSが実際にブラウザで実行されるか
- 不可なら：SVGを「外部HTML」パーツに分割 or 画像化フォールバック or フロンティア有償依頼

## エントランス別パターン検討（2026-04-27）
現行（建築図面＋棒人間）に加え、もうワンパターンの方向性を比較検討中。
6つのモックアップを `src/mockup_entrance_0X_*.html` に格納、`src/mockup_entrance_variants.html` から一覧。

| # | コード名 | 方向性 | 備考 |
|---|---|---|---|
| 01 | BUILDING PROCESS | 基礎→骨組み→屋根→外装→灯 | 建築事務所らしさ正攻法 |
| 02 | 2D→3D UNFOLD | 平面図→立面図→アクソメ | 図面言語の延長、既存トーン継承 |
| 03 | HAND SKETCH | 手描きスケッチ風（揺らぎ線） | feTurbulence、Klee One、親近感 |
| 04 | A DAY IN ARCHITECTURE | 朝→昼→夕→夜の時間経過 | 暗背景、感情に訴える |
| 05 | FROM THE LAND | 等高線→敷地→建築 | コンセプチュアル、敷地読み |
| 06 | A CARD HANDED TO YOU | 名刺差し出し（ユーザー案） | 3D perspective、パーソナル |

検討ポイント：
- 採用案決定後、本実装（CSS/JS分離、season切替対応、CMS貼付け前提）に展開
- 既存の「クリックでトップへ」UXは維持
- 季節バリエーション運用との整合（モチーフ差し替え可能か）

## 未対応事項
- [ ] エントランス別パターン6案から採用案を選定 → 本実装へ展開（2026-04-27着手）
- [ ] taag_april_entrance_trim.html へのモバイル調整（viewBox 804、translate 222、グリッド変更）
- [ ] 12ヶ月自動切替版の実装
- [ ] about.html 経歴の19XXプレースホルダー更新
- [ ] /entrance/ ページ新規作成 → 拡張設定で全chrome非表示
- [ ] 上級者設定（独自CSS/JS/<head>）の容量上限・JS実行可否を実機検証
- [ ] taag_april_entrance.html を「CSS/JS/HTML」3ブロックに分解→上級者設定欄に貼り付け
- [ ] sessionStorage ベースの遷移制御に書き換え（?top=1 廃止）
- [ ] 画像（003_0773.jpg, yoshihito2.png）を「画像ファイル>新規追加」でアップロード→URL差し替え
- [ ] フロンティアへソースを提示し、組み込みの対応可否・見積依頼
- [ ] ブラウザ連携時のタブグループ運用手順整理（管理画面タブをClaudeのタブグループに含める必要あり）
- [x] Git本体のインストール → GitHub Pages セットアップ（2026-04-09完了）
- [ ] src/entrance.html のスマホ最適化（レスポンシブ対応：メディアクエリ、フォントサイズ、SVGスケーリング等）
- [x] OUR WORKSページ（ourworks.html）の実装着手（2026-04-13、ベースレイアウト作成）
- [ ] OUR WORKSページに各物件5枚程度の写真を反映（写真選定は進行中）
- [ ] ourworks_photos/ の .gitignore 追加要否の確認（容量・個人情報の観点）
- [ ] コンセプト画面（concept セクション）をsrc/配下のHTMLに統合
- [ ] mockup_concept_*.html の内容を本番ファイルに反映・整理後削除
- [x] トップページ「VIEW OUR WORKS →」と上部ナビ「WORKS」から ourworks.html へのリンク接続（2026-04-13完了）
- [ ] ourworks.html の準備中7件の掲載方針決定（プレースホルダ表示か非表示か）
- [ ] キャッシュバスター（entrance.css?v=15, entrance.js?v=15）の運用ルール整備

## 技術的な注意点
- 各HTMLファイルは約400KB（SVGデータが大きい）
- CSS/JS/SVG全てを1ファイルに内包する構造
- `?top=1`による状態管理は、フロンティアCMSのURL構造と整合させる必要あり
- `document.write`による`<head>`内CSS注入は、CMSの埋め込みパーツで使えるか要確認
