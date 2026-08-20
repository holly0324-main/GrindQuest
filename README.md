# GrindQuest PWA v0.16

スマホ縦持ち前提の探索・採集・生産・最大4人パーティ対応コマンドRPG PWA。

## v0.16 — Architecture Update

**ゲーム挙動を変えず、今後の大規模化に備えてES Modulesを機能単位へ再編したバージョン。**

詳しい依存方向・state所有権・変更ルールは [`ARCHITECTURE.md`](./ARCHITECTURE.md) を参照。

### 主要構造

```text
src/
├─ core/                 # 旧importパス互換ファサードのみ
├─ data/                 # 宣言的ゲームデータ
│  ├─ items/
│  ├─ monsters/
│  ├─ world/
│  ├─ crafting/
│  ├─ battle/
│  └─ inventory/
├─ game/                 # ゲームロジック本体
│  ├─ characters/
│  ├─ battle/
│  ├─ exploration/
│  ├─ inventory/
│  ├─ equipment/
│  ├─ crafting/
│  ├─ economy/
│  ├─ encyclopedia/
│  ├─ time/
│  ├─ condition/
│  ├─ state/
│  ├─ save/
│  ├─ items/
│  ├─ shared/
│  └─ idle/
└─ ui/
```

### 互換ファサード

既存コード・歴史テストを壊さないため、以下は残している。

- `src/core/game.js`
- `src/core/alchemy.js`
- `src/core/storage.js`
- `src/data/gameData.js`

ただし実装本体は置かない。新規コードは対応するdomain moduleを直接importする。

### README運用

主要ディレクトリにはそれぞれ `README.md` を設置。

各READMEは以下を記録する。

- `Document Version`
- `Architecture Baseline`
- 責務
- 公開API
- 所有state / data
- 依存関係
- 不変条件
- 拡張ポイント

責務・公開API・state所有権を変更した場合は、そのREADMEの `Document Version` を更新する。

## 現行ゲームシステム

- 最大4人パーティ / キャラ別Lv・EXP・APP・装備・作戦
- 複数敵戦闘 / 素早さ順 / 逃走 / 複数ドロップ
- 周辺マップ / ローカルフィールド / ダンジョン / シンボル / 復活ボス
- 採集・採掘・釣り・木こり / 品質 / 採集Lv
- 通常倉庫 / 生鮮倉庫 / 寿命 / 品質別スタック
- Rnレア度 / アイテム図鑑 / モンスター図鑑
- 鍛冶 / 中間素材 / 出来栄え / affix土台
- 釜グル手動調合 / 簡易調合 / 一括調合
- 50stepごとの朝 / 昼 / 夜
- IndexedDBセーブ / PWAオフラインキャッシュ

## セーブ互換

v0.14を進捗互換の基準としている。

- v0.14 / v0.15 → v0.16へ正規化して引継ぎ
- v0.13以前 → 進捗は新規化、設定のみ引継ぎ

## テスト

```bash
npm test
```

探索、キャンプ襲撃、v0.14/v0.15互換、v0.16アーキテクチャ境界、UI smokeを含む。

## ローカル起動

```bash
python -m http.server 8080
```

`http://localhost:8080/` を開く。
