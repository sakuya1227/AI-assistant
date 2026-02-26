概要

これは Next.js という Webアプリ開発用のフレームワークで作られたプロジェクトです。
create-next-app という公式ツールを使って、自動的に基本の設定が用意されています。

つまり
👉 すぐに開発を始められる状態のテンプレート です。

はじめに（開発を始める）
① 開発サーバーを起動する

まず、以下のコマンドを実行します。

npm run dev

●ターミナル①（PCサーバー）
C:\MyPWAApp\my-app\U21\another_model
venv312\Scripts\activate
uvicorn pc_server:app --host 0.0.0.0 --port 7860 --reload


●ターミナル②（Next.js開発サーバー）
C:\MyPWAApp\my-app\U21\ai-assistant
npm run dev



※ npm を使っていない場合は、次のどれかを使います。

yarn dev
pnpm dev
bun dev

💡 これは
👉 自分のパソコンの中でアプリを動かす準備 をするコマンドです。


動作確認
http://localhost:7860/
http://localhost:7860/api
http://localhost:7860/api/status
https://sakuyas1227--elyza-chat-api-fastapi-app.modal.run/



② ブラウザで確認する

次に、ブラウザで以下を開きます。

http://localhost:3000

すると、作成されたアプリの画面が表示されます。

公開URL
https://ai-assistant-two-wine.vercel.app/


③ 画面を編集してみる

次のファイルを開きます。

app/page.tsx

ここを編集すると、画面の内容が変わります。

しかも
👉 保存すると自動で画面が更新されます（リロード不要）。

これはとても便利な開発機能です。

④ フォントについて

このプロジェクトでは、
next/font という機能を使っています。

これは
👉 フォント（文字のデザイン）を自動で最適化してくれる仕組みです。

標準で、Vercel が作った Geist というフォントが使われています。

Next.js をもっと学びたい人へ

Next.js はとても多機能なので、公式の資料を使うのがおすすめです。

✔ 公式ドキュメント

Next.js の使い方や機能を詳しく学べます。

✔ チュートリアル

実際に手を動かしながら学べるので、初心者におすすめです。

また、ソースコードは
Next.js GitHub repository
で公開されています。

アプリを公開（デプロイ）する

作ったアプリは、インターネットに公開できます。

一番簡単な方法は
👉 Vercel を使うことです。

Next.js を作った会社のサービスなので、設定がとても簡単です。