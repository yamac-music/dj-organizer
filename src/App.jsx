import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

/**
 * "HH:MM" (例: "23:00") を 数値の「分」(0～1439)に変換する関数。
 * 例:
 *   "00:00" -> 0
 *   "23:00" -> 1380
 */
function parseHHMMtoMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m; // 例: "23:00" -> 23*60 + 0 = 1380
}

/**
 * 分(0～∞) を "HH:MM" 形式の文字列に変換する関数。
 * ここでは24時間を超えた場合にも (total % 1440) で切り、単純に "翌日" を 00:00～ として再表示します。
 * 必要に応じて「(翌日)xx:xx」のように表示を工夫してもOKです。
 */
function minutesToHHMM(total) {
  // 1440分 = 24時間
  const t = total % (24 * 60);
  const hh = String(Math.floor(t / 60)).padStart(2, '0');
  const mm = String(t % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function App() {
  // -----------------------------
  // (1) イベント全体の時刻管理
  // -----------------------------
  const [eventStartTime, setEventStartTime] = useState(''); // 入力フォーム用 (HH:MM)
  const [eventEndTime, setEventEndTime] = useState('');     // 入力フォーム用 (HH:MM)
  const [eventStartValue, setEventStartValue] = useState(null); // 分換算(数値)
  const [eventEndValue, setEventEndValue] = useState(null);     // 分換算(数値)
  const [eventFixed, setEventFixed] = useState(false); // イベント時刻を確定したかどうか

  // -----------------------------
  // (2) DJ一覧 (DnD対象)
  // -----------------------------
  const [djList, setDjList] = useState([]);

  // DJ登録フォーム用
  const [djName, setDjName] = useState('');      // DJ名
  const [startTime, setStartTime] = useState(''); // 例: "23:00"
  const [endTime, setEndTime] = useState('');     // 例: "01:30"
  const [inputMode, setInputMode] = useState('timeRange'); // "timeRange" or "duration"
  const [duration, setDuration] = useState('');   // 持ち時間(分)
  const [editingIndex, setEditingIndex] = useState(null); // 編集モード用: nullなら新規、数字なら編集中

  // -----------------------------
  // (3) CSV 関連
  // -----------------------------
  const fileInputRef = useRef(null);

  /* =========================================
   *  イベント時刻設定: イベントの開始/終了を決定
   * ========================================= */
  const handleSetEventTime = (e) => {
    e.preventDefault(); // form submitのデフォルト挙動を抑制
    if (!eventStartTime || !eventEndTime) return;

    // 入力された "HH:MM" を分換算
    let sVal = parseHHMMtoMinutes(eventStartTime);
    let eVal = parseHHMMtoMinutes(eventEndTime);

    // イベント終了が開始より小さい(=日跨ぎ)なら +1440
    if (eVal < sVal) {
      eVal += 24 * 60;
    }

    // state更新
    setEventStartValue(sVal);
    setEventEndValue(eVal);
    setEventFixed(true); // イベント時刻を確定

    // 要件次第: イベントを再設定する時はDJをリセットするなど
    setDjList([]);
  };

  // イベント時刻をリセットして再入力可能にする
  const handleResetEvent = () => {
    setEventFixed(false);
    setEventStartTime('');
    setEventEndTime('');
    setEventStartValue(null);
    setEventEndValue(null);
    setDjList([]);
  };

  /* =========================================
   *  DJ追加 or 更新
   * ========================================= */
  const handleSubmitDJ = (e) => {
    e.preventDefault();
    // イベントが未確定ならエラー
    if (eventStartValue == null || eventEndValue == null) {
      alert('まずイベント全体の開始/終了時刻を設定してください。');
      return;
    }

    // 入力方式が「duration (持ち時間)」なら、終了時刻を計算
    let computedEndTime = endTime;
    if (inputMode === 'duration') {
      // 入力された開始時刻にdurationを足す
      const durMins = Number(duration);
      const [h, m] = startTime.split(':').map(Number);
      const tempDate = new Date(1970, 0, 1, h, m);
      tempDate.setMinutes(tempDate.getMinutes() + durMins);
      computedEndTime = tempDate.toTimeString().slice(0, 5); // "HH:MM"
    }

    // 開始/終了を分換算
    let sVal = parseHHMMtoMinutes(startTime);
    let eVal = parseHHMMtoMinutes(computedEndTime);

    // イベント開始より小さい(=前の日付扱い)なら +1440
    if (sVal < eventStartValue) sVal += 24 * 60;
    if (eVal < eventStartValue) eVal += 24 * 60;

    // 入力がイベントの範囲を超えていないかチェック
    if (sVal < eventStartValue || sVal > eventEndValue) {
      alert('開始時刻がイベント範囲外です。');
      return;
    }
    if (eVal < eventStartValue || eVal > eventEndValue) {
      alert('終了時刻がイベント範囲外です。');
      return;
    }

    // プレイ時間 (分)
    const newDuration = eVal - sVal;
    if (newDuration <= 0) {
      alert('終了時刻は開始時刻より後に設定してください。');
      return;
    }

    // DJオブジェクトを作成
    const newDJ = {
      name: djName,
      startTime: startTime,     // 文字列表現 "HH:MM"
      endTime: computedEndTime, // 文字列表現 "HH:MM"
      startValue: sVal,         // 分換算
      endValue: eVal,           // 分換算
      duration: newDuration,    // 開始->終了までのプレイ時間(分)
    };

    if (editingIndex !== null) {
      // 編集モード
      const updatedList = [...djList];
      updatedList[editingIndex] = newDJ;
      // startValue順でソート
      updatedList.sort((a, b) => a.startValue - b.startValue);
      setDjList(updatedList);
      setEditingIndex(null);
    } else {
      // 新規追加
      const newList = [...djList, newDJ];
      // startValue順でソート
      newList.sort((a, b) => a.startValue - b.startValue);
      setDjList(newList);
    }

    // フォームリセット
    setDjName('');
    setStartTime('');
    setEndTime('');
    setDuration('');
  };

  // DJ編集モードに切り替え
  const handleEdit = (index) => {
    const dj = djList[index];
    setDjName(dj.name);
    setStartTime(dj.startTime);
    setEndTime(dj.endTime);
    setDuration(String(dj.duration));
    setInputMode('timeRange');
    setEditingIndex(index);
  };

  // DJ削除
  const handleDelete = (index) => {
    const updated = djList.filter((_, i) => i !== index);
    setDjList(updated);
  };

  /* =========================================
   *  (重要) DnD後にタイムテーブル再計算
   * =========================================
   * ドラッグ＆ドロップで順番を並び替えたら、
   * 先頭のDJをイベント開始時刻に固定し、そこから順に詰め直します。
   */
  const handleDragEnd = (result) => {
    if (!result.destination) return; // ドロップ先がない → 何もしない

    // 並び替え: 配列をコピーしてsplice
    const items = Array.from(djList);
    const [movedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, movedItem);

    // 並び替え後のリストをシーケンシャルに再計算
    // → 先頭DJはイベント開始。2番目以降は"前DJの終了"を開始時刻にする
    let currentStart = eventStartValue;
    for (let i = 0; i < items.length; i++) {
      const dj = items[i];
      // durationを使って開始/終了を上書き
      dj.startValue = currentStart;
      dj.endValue = currentStart + dj.duration;
      dj.startTime = minutesToHHMM(dj.startValue); // 文字列 "HH:MM" へ再変換
      dj.endTime = minutesToHHMM(dj.endValue);
      currentStart += dj.duration; // 次のDJの開始
    }

    // state反映
    setDjList(items);
  };

  /* =========================================
   *  CSV 出力 (DJ名,開始,終了)
   * ========================================= */
  const exportCSV = () => {
    const headers = ['DJ名', '開始時間', '終了時間'];
    const rows = djList.map((dj) => [dj.name, dj.startTime, dj.endTime].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dj_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* =========================================
   *  CSV 読み込み
   * ========================================= */
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter((line) => line.trim() !== '');
      if (lines.length <= 1) return;

      const newDJList = [];
      // 1行目はヘッダー → 2行目以降を処理
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 3) continue;

        const name = cols[0].trim();
        const sTime = cols[1].trim(); // "HH:MM"
        const eTime = cols[2].trim(); // "HH:MM"

        let sVal = parseHHMMtoMinutes(sTime);
        let eVal = parseHHMMtoMinutes(eTime);

        // イベント開始より小さければ +1440 (翌日扱い)
        if (eventStartValue != null && sVal < eventStartValue) {
          sVal += 24 * 60;
        }
        if (eventStartValue != null && eVal < eventStartValue) {
          eVal += 24 * 60;
        }
        const dur = eVal - sVal;

        newDJList.push({
          name,
          startTime: sTime,
          endTime: eTime,
          startValue: sVal,
          endValue: eVal,
          duration: dur,
        });
      }

      // ソート
      newDJList.sort((a, b) => a.startValue - b.startValue);
      setDjList(newDJList);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // =======================
  // JSX (画面描画部分)
  // =======================
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header text-center">
          <h2>DJイベント タイムスケジュール</h2>
        </div>
        <div className="card-body">
          {/* イベント時刻がまだ未確定の場合: イベントの開始/終了を入力 */}
          {!eventFixed ? (
            <>
              <h4 className="mb-3">イベント全体の開始 & 終了時刻</h4>
              <form onSubmit={handleSetEventTime}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">イベント開始 (HH:MM)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">イベント終了 (HH:MM)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  イベント時間を確定
                </button>
              </form>
            </>
          ) : (
            // イベント時刻が確定済みの場合: DJ登録フォーム & スケジュール表示
            <>
              <div className="d-flex justify-content-between align-items-center">
                <h4>
                  イベント時間: {eventStartTime} ～ {eventEndTime}
                </h4>
                <button className="btn btn-sm btn-secondary" onClick={handleResetEvent}>
                  イベント時刻をリセット
                </button>
              </div>
              <hr />

              {/* DJ登録フォーム */}
              <h5 className="mb-3">
                DJ 登録
                {editingIndex !== null && <span className="text-danger">（編集中）</span>}
              </h5>
              <form onSubmit={handleSubmitDJ}>
                <div className="mb-3">
                  <label className="form-label">DJ名</label>
                  <input
                    type="text"
                    className="form-control"
                    value={djName}
                    onChange={(e) => setDjName(e.target.value)}
                    required
                  />
                </div>

                {/* 入力方法: 開始・終了 or duration */}
                <div className="mb-3">
                  <label className="form-label">入力方法</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="inputMethod"
                        value="timeRange"
                        checked={inputMode === 'timeRange'}
                        onChange={(e) => setInputMode(e.target.value)}
                      />
                      <label className="form-check-label">開始・終了時間</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="inputMethod"
                        value="duration"
                        checked={inputMode === 'duration'}
                        onChange={(e) => setInputMode(e.target.value)}
                      />
                      <label className="form-check-label">持ち時間（分）</label>
                    </div>
                  </div>
                </div>

                {/* 時刻 or 持ち時間の入力 */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">開始時間</label>
                    <input
                      type="time"
                      className="form-control"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  {inputMode === 'timeRange' ? (
                    <div className="col-md-6">
                      <label className="form-label">終了時間</label>
                      <input
                        type="time"
                        className="form-control"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="col-md-6">
                      <label className="form-label">持ち時間（分）</label>
                      <input
                        type="number"
                        className="form-control"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        min="1"
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  {editingIndex !== null ? '更新' : 'DJ追加'}
                </button>
              </form>

              <hr />

              {/* DJ一覧 (ドラッグ＆ドロップ対応) */}
              <h5>DJスケジュール</h5>
              {djList.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <table className="table table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th>DJ名</th>
                        <th>開始</th>
                        <th>終了</th>
                        {/* 持ち時間（分）を表示する新しい列 */}
                        <th>持ち時間(分)</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <Droppable droppableId="djList">
                      {(provided) => (
                        <tbody ref={provided.innerRef} {...provided.droppableProps}>
                          {djList.map((dj, index) => (
                            <Draggable
                              key={`dj-${index}`}
                              draggableId={`dj-${index}`}
                              index={index}
                            >
                              {(provided) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <td>{dj.name}</td>
                                  <td>{dj.startTime}</td>
                                  <td>{dj.endTime}</td>
                                  {/* duration (分) を表示 */}
                                  <td>{dj.duration}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-warning me-2"
                                      onClick={() => handleEdit(index)}
                                    >
                                      編集
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleDelete(index)}
                                    >
                                      削除
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </tbody>
                      )}
                    </Droppable>
                  </table>
                </DragDropContext>
              ) : (
                <p className="text-center">まだDJは追加されていません。</p>
              )}

              {/* CSV 出力・読み込み */}
              <div className="d-flex justify-content-end mt-3 align-items-center">
                <button onClick={exportCSV} className="btn btn-success me-3">
                  CSV 出力
                </button>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  className="form-control-file"
                  style={{ width: 'auto' }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
