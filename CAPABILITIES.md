# CAPABILITIES — devport-cli

公開 CLI tool provider。複数プロジェクトの開発用ポートを一元管理する Node.js 製の
グローバル CLI `devport` を提供する。データはホームディレクトリにローカル保存。

- **consumers**: ELN 開発者全般（npm でグローバルインストールして利用）
- **依存**: `commander` + `chalk` のみ（ランタイム依存はこの 2 つだけ）
- **データ保存先**: `~/.devport/ports.json`（`lib/PortManager.js:7-8` で確証）
- **実行体**: `bin/devport.js`（`package.json` の `bin.devport`）

## 提供（実装済）

公開 CLI `devport`。サブコマンドは `bin/devport.js` の `.command()` 定義および
`lib/PortManager.js` の対応メソッドで裏取り済み（確証）。

| コマンド | エイリアス | 用途 | 裏取り |
|----------|-----------|------|--------|
| `add <port> <project>` | - | プロジェクトにポートを登録（`-d, --description`） | `bin/devport.js:16` / `PortManager.addPort` (`lib/PortManager.js:78`) |
| `remove <port>` | `rm` | ポート登録を削除 | `bin/devport.js:37` / `PortManager.removePort` (`lib/PortManager.js:98`) |
| `list` | `ls` | 登録済みポートを一覧 | `bin/devport.js:58` / `PortManager.listPorts` (`lib/PortManager.js:115`) |
| `find <port>` | - | 指定ポートの登録情報を確認 | `bin/devport.js:85` / `PortManager.findPort` (`lib/PortManager.js:125`) |
| `suggest` | - | 空きポートを提案（`-s, --start`、既定 3000） | `bin/devport.js:109` / `PortManager.suggestPort` (`lib/PortManager.js:130`) |
| `clear` | - | 全登録を消去 | `bin/devport.js:124` / `PortManager.clearAll` (`lib/PortManager.js:142`) |
| `kill <port>` | - | 指定ポートを使用中のプロセスを終了 | `bin/devport.js:137` / `PortManager.killProcess` (`lib/PortManager.js:149`) |
| `kill-project <project>` | - | プロジェクトに紐づく全ポートのプロセスを終了 | `bin/devport.js:157` / `PortManager.killByProject` (`lib/PortManager.js:191`) |
| `kill-all` | - | 登録済み全ポートのプロセスを終了 | `bin/devport.js:180` / `PortManager.killAll` (`lib/PortManager.js:242`) |
| `scan [directory]` | - | ディレクトリを走査しポートを自動検出・登録（`-d, --depth` / `--all` / `--dry-run`） | `bin/devport.js:208` / `PortManager.scanDirectory` (`lib/PortManager.js:286`) |

`scan` は `package.json` scripts・`.env`・`vite.config.*`・`next.config.*`・
`docker-compose.*`・`server.js`/`app.js`/`index.js`/`main.js` 等から
正規表現でポートを検出する（パターンは `lib/PortManager.js:12-47`）。

提供コマンド数: **10**（うちエイリアス 2: `rm` / `ls`）。

## 提供しない（範囲外）

- ランタイム / API / 常駐サービスは持たない（純粋な CLI ツール）。
- ポートの実使用状況の常時監視はしない。`find` / `list` は登録情報の参照であり、
  プロセスの実在確認は `kill` 系コマンド実行時のみ行う。

## ステータス

- バージョン: `1.3.0`（`package.json`）
- ライセンス: MIT
- Node: `>=14.0.0`（`engines`）
