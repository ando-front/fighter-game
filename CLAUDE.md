# Fighter Game — 開発ルール

- 外部ライブラリ・ビルドツールの追加は禁止。必要だと思ったら実装前に必ず質問する
- 1回の指示で1つの機能だけ実装する。頼まれていない機能を先回りして作らない
- 既存のファイル構成を勝手に変えない。新しいファイルを作る前に提案する
- 実装後は必ず「動作確認の手順」と「確認すべき数値」を出力する
- 数値パラメータ（重力・速度・ダメージ等）は必ず src/config.js に定数として集約する
- コードには日本語のコメントを入れる。小学生が読んで分かる言葉で書く
- 1ファイル300行を超えそうになったら、分割案を提案してから分割する

## 実行環境

Raspberry Pi と Mac mini の **両方で同じように動く**こと。
どちらか片方でしか動かないコード（OS依存の書き方）は入れない。

- Raspberry Pi 4 (Raspberry Pi OS 64bit)、Chromiumで動かす
- Mac mini (Apple Silicon / macOS)、Chrome か Safari で動かす
- ビルドツール禁止。npm、webpack、vite、TypeScript 使用禁止
- 素のHTML + CSS + JavaScript (ES Modules) のみ。外部ライブラリ一切なし
- python3 -m http.server 8000 で起動、http://localhost:8000 で遊べること
  （どちらの機械でも このコマンドは同じ）
- file:// で直接 index.html を開くのは禁止。ES Modules が読みこめないため
  必ず http:// 経由で開く

### Mac mini で動かすときの注意
- ポート 8000 は別のアプリ（algo-trade-bot の uvicorn）が使用中。
  ゲームは **8001番** を使う
- `python3` は anaconda のものが先に見つかるが、これは macOS の
  ファイアウォールで「外からの接続」が許可されていない。
  LAN の他の機械（iPhone など）から見るときは
  許可済みの **`/usr/bin/python3`** を明示して起動する
- LAN の他の機械からは `http://192.168.1.217:8001` で開く

### 起動コマンドまとめ
```
# Raspberry Pi (192.168.1.219)
cd ~/fighter-game && python3 -m http.server 8000

# Mac mini (192.168.1.217)
cd ~/GitHub/fighter-game && /usr/bin/python3 -m http.server 8001 --bind 0.0.0.0
```
