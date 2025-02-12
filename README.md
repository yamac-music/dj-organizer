# DJ Organizer

[**→ デモページ (GitHub Pages)**](https://yamac-music.github.io/dj-organizer/)

DJ イベントのタイムスケジュールを簡単に作成・管理できる Web アプリです。  
イベントの開始/終了時刻を設定後、DJ を登録していくと、自動的にスケジュールが整理されます。  
さらに、ドラッグ＆ドロップで並び替えが可能。日を跨ぐイベント（例: 23:00～翌 05:00）でも、  
きちんと時刻の管理ができるようになっています。

---

## 特徴

- **イベント開始・終了時刻の設定**  
  - 例: 23:00～05:00（翌日）など、日を跨ぐ場合にも対応。
- **DJ 登録フォーム**  
  - 「開始・終了時刻」を入力するか、「持ち時間（分）」を指定して自動計算。  
  - 開始時刻が前日の時刻を下回るときは翌日として内部で 24h を補正。
- **ドラッグ＆ドロップ**  
  - テーブル行をドラッグすることで並び替えが可能。  
  - 並び替え後は時刻が自動的に再計算され、連続的なスケジュールを維持。
- **CSV 入出力**  
  - スケジュールを CSV で出力し、再度読み込んで復元できる。
