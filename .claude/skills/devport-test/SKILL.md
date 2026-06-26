---
name: devport-test
description: devport-cli のローカル検証手順。jest ユニットテストの実行と、bin/devport.js を直接叩いた手動スモークの定型手順。devport-cli のコード/テストを変更したとき、または CLI の挙動を実機確認したいときに使う。
---

# devport-cli ローカル検証

`devport-cli` の変更を確認するときの定型手順。確証済みの実在コマンドのみ。

## ユニットテスト（jest）

```bash
cd /Users/masa/dev/eln/devport-cli
npm test            # = jest（package.json scripts.test）
```

- テスト本体: `lib/PortManager.test.js`。`PortManager` の各メソッド
  （addPort / removePort / listPorts / findPort / suggestPort / clearAll /
  killProcess / killByProject / killAll）を `describe` ブロックで網羅。
- 単一 describe だけ流すなら `npx jest -t "<describe 名>"`。

## bin 手動スモーク

`bin/devport.js` を `node` で直接実行して挙動を確認する。
**実データ `~/.devport/ports.json` を汚さないため、`HOME` を差し替えて隔離する**
（保存先は `os.homedir()/.devport/ports.json` = `lib/PortManager.js:7-8`）。

```bash
cd /Users/masa/dev/eln/devport-cli
TMPHOME=$(mktemp -d)
HOME="$TMPHOME" node bin/devport.js add 3000 demo -d "smoke test"
HOME="$TMPHOME" node bin/devport.js list
HOME="$TMPHOME" node bin/devport.js suggest --start 3000
HOME="$TMPHOME" node bin/devport.js find 3000
HOME="$TMPHOME" node bin/devport.js remove 3000
rm -rf "$TMPHOME"
```

- `kill` / `kill-project` / `kill-all` は実プロセスを終了させる破壊的操作。
  スモークでは実在しないポートに対してのみ実行するか、ドライに避ける。
- `scan` は `--dry-run` を付ければ登録せず検出結果だけ確認できる
  （`HOME="$TMPHOME" node bin/devport.js scan . --dry-run`）。

## lint

```bash
cd /Users/masa/dev/eln/devport-cli
npx eslint .        # 設定は .eslintrc.js（eslint:recommended ベース）
```

## 注意

- グローバルインストール版を使う場合は別途 `npm link` が必要だが、
  検証は上記の `node bin/devport.js` 直叩きで十分（link 不要）。
- 依存は commander + chalk のみ。追加依存を入れない。
