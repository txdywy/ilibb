import { useState, useEffect } from 'react';
import Map from './components/map/Map';
import './App.css';

function App() {
  const [libraries, setLibraries] = useState([]);
  const [selectedLib, setSelectedLib] = useState<any>(null);

  useEffect(() => {
    // The data folder inside public/ is served at the root path /data/
    fetch('data/libraries.json')
      .then(res => res.json())
      .then(data => setLibraries(data))
      .catch(err => console.error('Failed to load libraries:', err));
  }, []);

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1>北京免费图书馆地图</h1>
      </header>
      
      <main className="main-content">
        <div className="map-wrapper">
          <Map libraries={libraries} onMarkerClick={setSelectedLib} />
        </div>
        
        {selectedLib && (
          <div className="detail-panel glass-card">
            <button className="close-btn" onClick={() => setSelectedLib(null)}>×</button>
            <h2>{selectedLib.name}</h2>
            <div className="score-badge">
              AI 评分: {selectedLib.score?.total || 'N/A'}
            </div>
            <p className="recommendation">
              {selectedLib.score?.recommendation || '暂无推荐理由'}
            </p>
            <div className="info-item">
              <strong>地址:</strong> {selectedLib.address}
            </div>
            <div className="info-item">
              <strong>开放时间:</strong> {selectedLib.opening_hours}
            </div>
            <div className="info-item">
              <strong>免费证据:</strong> 
              <p className="evidence">{selectedLib.evidence_text}</p>
            </div>
            <a href={selectedLib.source_url} target="_blank" rel="noreferrer" className="source-link">
              查看数据来源
            </a>
          </div>
        )}
      </main>
      
      <div className="sidebar glass-card">
        <h3>排行榜 (Top 10)</h3>
        <ul className="rank-list">
          {libraries
            .sort((a: any, b: any) => (b.score?.total || 0) - (a.score?.total || 0))
            .slice(0, 10)
            .map((lib: any, index) => (
              <li key={lib.id} onClick={() => setSelectedLib(lib)}>
                <span className="rank-num">{index + 1}</span>
                <span className="rank-name">{lib.name}</span>
                <span className="rank-score">{lib.score?.total || '-'}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
