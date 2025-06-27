# DevPort CLI

複数のプロジェクト間での開発サーバーポートを管理するためのコマンドラインツールです。

## 概要

複数の開発プロジェクトを扱う際に、ポートの競合は一般的な問題です。DevPort CLIは、どのポートがどのプロジェクトで使用されているかを追跡・管理し、競合を避けて開発環境を整理するのに役立ちます。

## 機能

- 🚀 **簡単なポート登録**: プロジェクト名と説明でポートを登録
- 📋 **全ポート一覧表示**: プロジェクト全体で使用中のポートを表示
- 🔍 **ポート情報検索**: 特定のポートが何に使用されているかを素早く確認
- 💡 **スマートなポート提案**: 利用可能なポートの提案を取得
- 🗑️ **簡単な削除**: プロジェクトが非アクティブになった際のポート登録削除
- 🏠 **ローカルストレージ**: すべてのデータはホームディレクトリにローカル保存

## インストール

### npmでのグローバルインストール
```bash
npm install -g devport-cli
```

### ローカル開発環境
```bash
git clone https://github.com/YOUR_USERNAME/devport-cli.git
cd devport-cli
npm install
npm link
```

## 使用方法

### ポート登録を追加
```bash
devport add 3000 my-react-app
devport add 3001 my-api-server --description "Express.js APIサーバー"
```

### 登録済みポート一覧を表示
```bash
devport list
# または
devport ls
```

### 特定ポートの情報を検索
```bash
devport find 3000
```

### 利用可能ポートの提案を取得
```bash
devport suggest
devport suggest --start 4000
```

### ポート登録を削除
```bash
devport remove 3000
# または
devport rm 3000
```

### すべての登録をクリア
```bash
devport clear
```

### ヘルプを表示
```bash
devport --help
devport <command> --help
```

## コマンド一覧

| コマンド | エイリアス | 説明 |
|---------|------------|------|
| `add <port> <project>` | - | プロジェクト用のポートを登録 |
| `remove <port>` | `rm` | ポート登録を削除 |
| `list` | `ls` | 登録済みポート一覧を表示 |
| `find <port>` | - | 特定ポートの情報を検索 |
| `suggest` | - | 利用可能ポートを提案 |
| `clear` | - | すべてのポート登録をクリア |

## オプション

### addコマンド
- `-d, --description <desc>`: プロジェクトの説明を追加

### suggestコマンド
- `-s, --start <port>`: 提案の開始ポート番号（デフォルト: 3000）

## データ保存場所

DevPort CLIは、すべてのポート登録を以下の場所にローカル保存します：
- **macOS/Linux**: `~/.devport/ports.json`
- **Windows**: `%USERPROFILE%\.devport\ports.json`

## 使用例

### 日常的な開発作業
```bash
# 新しいReactプロジェクトを開始
devport add 3000 my-new-app --description "React開発サーバー"

# APIサーバー用のポートが必要
devport suggest --start 3001
# 戻り値: Suggested available port: 3001
devport add 3001 my-api

# ポート3000が何に使用されているかを確認
devport find 3000

# アクティブなプロジェクト全体を表示
devport list
```

### AI統合
```bash
# AIが使用する利用可能ポートを取得
AVAILABLE_PORT=$(devport suggest)
devport add $AVAILABLE_PORT "ai-generated-project" --description "AIによって自動生成"
```

### プロジェクトのクリーンアップ
```bash
# プロジェクト完了時にポートを削除
devport remove 3000

# 全てをクリア
devport clear
```

## 動作要件

- Node.js 14.0.0以上
- npm または yarn

## 貢献

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## サポート

問題が発生した場合や提案がある場合は、GitHub上で[issue](https://github.com/YOUR_USERNAME/devport-cli/issues)を開いてください。