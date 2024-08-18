# TODOs
- navBarの画像と文字のずれを直す
- 登録ボタンの実装
- 一覧ボタンの実装

- defaultでスマホ画面サイズにする
- DB構築

# Rules
- FolderName, FileName, Variablesは全てcamelCaseで書く(Component名はPascalCaseで)
- 開発をするときは, develop branchからfeature-XXXのbranchを作成して、そこで開発をする.

# Caution
- package.jsonが更新されたら
  ```
  npm i
  ```
  でパッケージをインストール！（じゃないと動かないです）