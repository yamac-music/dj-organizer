import React, { useState, useRef } from 'react';

function App() {
  // イベント設定
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');

  // DJ登録用の状態
  const [djList, setDjList] = useState([]);
  const [djName, setDjName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [order, setOrder] = useState('');
  const [duration, setDuration] = useState('');
  // 入力方式（"timeRange"：開始・終了時間 / "duration"：持ち時間入力）
  const [inputMode, setInputMode] = useState('timeRange');
  // 編集モード用（nullの場合は新規追加、indexが入っている場合は編集中）
  const [editingIndex, setEditingIndex] = useState(null);

  // CSVファイル読み込み用のref
  const fileInputRef = useRef(null);

  // DJ追加または更新処理
  const handleSubmit = (e) => {
    e.preventDefault();

    // 入力方式に応じた終了時刻の決定
    let computedEndTime = '';
    if (inputMode === 'duration') {
      const durationMinutes = Number(duration);
      const [hours, minutes] = startTime.split(':').map(Number);
      let date = new Date(1970, 0, 1, hours, minutes);
      date.setMinutes(date.getMinutes() + durationMinutes);
      computedEndTime = date.toTimeString().slice(0, 5); // "HH:MM"形式
    } else {
      computedEndTime = endTime;
    }

    const newDJ = {
      name: djName,
      startTime: startTime,
      endTime: computedEndTime,
      order: parseInt(order, 10),
    };

    if (editingIndex !== null) {
      // 編集モード：既存のDJ情報を更新
      const updatedDJList = [...djList];
      updatedDJList[editingIndex] = newDJ;
      updatedDJList.sort((a, b) => a.order - b.order);
      setDjList(updatedDJList);
      setEditingIndex(null);
    } else {
      // 新規追加の場合
      const newList = [...djList, newDJ].sort((a, b) => a.order - b.order);
      setDjList(newList);
    }

    // フォームのリセット
    setDjName('');
    setStartTime('');
    setEndTime('');
    setOrder('');
    setDuration('');
  };

  // 編集モードへの切り替え
  const handleEdit = (index) => {
    const dj = djList[index];
    setDjName(dj.name);
    setStartTime(dj.startTime);
    setEndTime(dj.endTime);
    setOrder(dj.order.toString());
    // 編集時は「開始・終了時間」方式で表示（持ち時間は再計算できないため）
    setInputMode('timeRange');
    setEditingIndex(index);
  };

  // 削除処理
  const handleDelete = (index) => {
    const updatedDJList = djList.filter((_, i) => i !== index);
    setDjList(updatedDJList);
  };

  // CSV出力処理
  const exportCSV = () => {
    const headers = ['DJ名', '開始時間', '終了時間', '順番'];
    const rows = djList.map(dj => [dj.name, dj.startTime, dj.endTime, dj.order].join(','));
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

  // CSV読み込み処理
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const newDJList = [];
      // 1行目はヘッダーと仮定
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length < 4) continue;
        const [name, start, end, orderStr] = columns;
        newDJList.push({
          name: name.trim(),
          startTime: start.trim(),
          endTime: end.trim(),
          order: parseInt(orderStr.trim(), 10),
        });
      }
      newDJList.sort((a, b) => a.order - b.order);
      setDjList(newDJList);
    };
    reader.readAsText(file);
    // 同じファイルを再度読み込めるようにリセット
    e.target.value = '';
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header text-center">
          <h1>DJ オーガナイザー</h1>
        </div>
        <div className="card-body">
          {/* イベント設定 */}
          <h5 className="mb-3">イベント設定</h5>
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">イベント開始時間</label>
              <input 
                type="time" 
                className="form-control" 
                value={eventStart} 
                onChange={(e) => setEventStart(e.target.value)} 
                required
                step="60" 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">イベント終了時間</label>
              <input 
                type="time" 
                className="form-control" 
                value={eventEnd} 
                onChange={(e) => setEventEnd(e.target.value)} 
                required
                step="60" 
              />
            </div>
          </div>

          {/* DJ登録フォーム */}
          <h5 className="mb-3">DJ 登録 {editingIndex !== null && <span className="text-danger">(編集中)</span>}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">DJ名</label>
                <input
                  type="text"
                  className="form-control"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">順番</label>
                <input
                  type="number"
                  className="form-control"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 入力方法選択 */}
            <div className="mb-3">
              <label className="form-label">入力方法</label>
              <div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="inputMethod"
                    id="timeRange"
                    value="timeRange"
                    checked={inputMode === 'timeRange'}
                    onChange={(e) => setInputMode(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="timeRange">
                    開始・終了時間
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="inputMethod"
                    id="duration"
                    value="duration"
                    checked={inputMode === 'duration'}
                    onChange={(e) => setInputMode(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="duration">
                    持ち時間（分）
                  </label>
                </div>
              </div>
            </div>

            {/* 入力項目（開始時間は共通、方式に応じて終了時間または持ち時間を表示） */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">開始時間</label>
                <input
                  type="time"
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  step="60"
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
                    step="60"
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

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary">
                {editingIndex !== null ? '更新' : 'DJ追加'}
              </button>
            </div>
          </form>

          <hr />

          {/* スケジュール一覧 */}
          <h2 className="mt-4">スケジュール一覧</h2>
          {djList.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-light">
                  <tr>
                    <th>順番</th>
                    <th>DJ名</th>
                    <th>開始時間</th>
                    <th>終了時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {djList.map((dj, index) => (
                    <tr key={index}>
                      <td>{dj.order}</td>
                      <td>{dj.name}</td>
                      <td>{dj.startTime}</td>
                      <td>{dj.endTime}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center">まだ DJ は追加されていません。</p>
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
        </div>
      </div>
    </div>
  );
}

export default App;
