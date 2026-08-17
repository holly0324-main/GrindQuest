# GrindQuest PWA

スマホ縦持ちを主役にした、ローグライト放置コマンド戦闘ダンジョングラインドRPGの初期版です。

## 今入っているもの

- スマホ前提UI（下部固定ナビ / safe-area対応 / 片手操作）
- DQライクな1対1コマンド戦闘
  - こうげき
  - 火炎斬り
  - ホイミ
  - ぼうぎょ
  - 薬草
- 3ダンジョン / 11敵 / ボス戦
- EXP・レベルアップ・ゴールド
- 素材ドロップ
- 鍛冶レシピ / 武器・防具作成
- 装備変更
- 放置探索（経過時間から復帰時に計算、8時間上限）
- IndexedDBセーブ + localStorageフォールバック
- セーブJSONのExport / Import
- Web App Manifest + Service Worker
- オフライン用App Shellキャッシュ

## ローカルで起動

Service Workerを使うため、`file://` 直開きではなくHTTPサーバーで開いてください。

```bash
python -m http.server 8080
```

その後 `http://localhost:8080/` を開きます。

## GitHub Pages

このリポジトリはビルド不要の静的構成です。

1. GitHubにリポジトリを作成して、この中身をpush
2. `Settings` → `Pages`
3. `Build and deployment` を `Deploy from a branch`
4. `main` / `/(root)` を選択

プロジェクトページ (`https://USER.github.io/REPO/`) でも動くよう、URLは相対パスで統一しています。

## データ追加

敵・ダンジョン・素材・装備・レシピは `src/data/gameData.js` に集約しています。
ゲームロジックは `src/core/`、画面は `src/ui/` に分離しています。

次段階では `gameData.js` を `data/enemies/*.json` 等へ分割し、データファイル追加だけで登録できるローダーへ移行する想定です。

## 画像差し替え

現状は絵文字を仮スプライトとして使用しています。将来はAssetRegistryを追加して、敵ID → `assets/enemies/*.webp` を対応させる想定です。ゲームロジック側に画像パスを持たせない方針です。
