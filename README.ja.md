# Mythoclastia - ファンタジーワールドジェネレーター

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/aigc3yehe/Mythoclastia/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)

<img src="src/imgs/icon.png" alt="ゲームロゴ" width="150px" height="auto">

[English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

Mythoclastiaは、ユーザーがユニークなファンタジー世界、チームメンバーを作成し、戦術的な戦闘に参加できるインタラクティブなファンタジーワールドジェネレーターです。このアプリケーションは、AIを活用したテキストと画像生成を使用して、没入感のあるゲーム体験を創造します。

## 🌟 特徴

- **世界生成**：ユニークな設定、地理、紛争を持つ豊かなファンタジー世界の作成
- **チームメンバー**：異なる種族、能力、バックストーリーを持つチームメンバーの生成とカスタマイズ
- **戦闘システム**：手続き的に生成された敵との戦術的なターンベースの戦闘に参加
- **美しいビジュアル**：AIが生成する世界、キャラクター、敵の画像
- **ゲーム状態の保存**：あなたの進行状況を保存して冒険を続けることができる

## 🚀 はじめに

### 必要条件

- Node.js（v14.0.0以上）
- npm（v6.0.0以上）
- OpenAI APIキー（テキスト生成用）
- 画像生成トークン（オプション、画像生成用）

### インストール

1. リポジトリをクローンする：
   ```
   git clone https://github.com/aigc3yehe/Mythoclastia.git
   cd Mythoclastia
   ```

2. 依存関係をインストールする：
   ```
   npm install
   ```

3. 開発サーバーを起動する：
   ```
   npm start
   ```

4. ブラウザを開き、`http://localhost:3000`にアクセスする

## 🎮 遊び方

1. **スタート画面**：プロンプトを入力してファンタジー世界を生成する
2. **ロード段階**：AIがあなたの世界とチームメンバーを生成するのを待つ
   > **注意**：世界の生成には時間がかかることがあります。処理時間が3分以内であれば正常です。
3. **メインゲーム**：あなたの世界を探索し、チームメンバーを閲覧する
4. **バトルモード**：戦術的なターンベースの戦闘に参加する
   - 各チームメンバーのスキルを選択する
   - 様々なタイプの敵と戦う
   - 難易度が増す複数のラウンドを進行する

## 🔑 APIキー

このアプリケーションは、テキスト生成機能にはOpenAI APIキーが必要で、視覚要素にはオプションで画像生成トークンが必要です。

### APIキーの設定

1. **OpenAI APIキー**（必須）：
   - OpenAI APIキーは自分で用意する必要があります
   - [OpenAI](https://platform.openai.com/)でアカウントを作成する
   - ダッシュボードからAPIキーを生成する
   - ゲーム内の管理ターミナルの設定タブにこのキーを入力する

2. **画像生成トークン**（オプション）：
   - 画像生成機能は[misato.ai](https://misato.ai)の技術と計算資源によって提供されています
   - 画像生成機能を使用するにはYeHeに連絡してトークンを取得してください
   - 提供されない場合、生成された画像の代わりにASCIIアートが表示される
   - 管理ターミナルの設定タブにこのトークンを入力する

### APIキーのセキュリティに関する注意

- APIキーはブラウザのlocalStorageに保存される
- キーは各APIプロバイダー以外のサーバーには送信されない
- APIキーは常にプライベートかつ安全に保つこと

## 📚 プロジェクト構造

```
src/
├── components/      # UIコンポーネント
├── contexts/        # Reactコンテキストプロバイダー
├── hooks/           # カスタムReactフック
├── services/        # 外部サービス統合
├── utils/           # ユーティリティ関数
└── App.js           # メインアプリケーションコンポーネント
```

## 🤝 貢献

貢献は大歓迎です！お気軽にプルリクエストを提出してください。

1. リポジトリをフォークする
2. 機能ブランチを作成する（`git checkout -b feature/amazing-feature`）
3. 変更をコミットする（`git commit -m '素晴らしい機能を追加'`）
4. ブランチにプッシュする（`git push origin feature/amazing-feature`）
5. プルリクエストを開く

行動規範と貢献方法については[CONTRIBUTING.md](CONTRIBUTING.md)をお読みください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🙏 謝辞

- テキスト生成APIを提供してくれた[OpenAI](https://openai.com/)
- 画像生成技術と計算パワーを提供してくれた[misato.ai](https://misato.ai)
- Twitterで[Misato Virtuals](https://twitter.com/Misato_Virtuals)をフォローしてください
- UIフレームワークを提供してくれた[React](https://reactjs.org/)
- このプロジェクトの改善にご協力いただいたすべての貢献者の皆様 