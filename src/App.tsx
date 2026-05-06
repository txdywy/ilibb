import { useState, useEffect } from 'react';
import Map from './components/map/Map';
import './App.css';

function App() {
  const [libraries, setLibraries] = useState([]);
  const [selectedLib, setSelectedLib] = useState<any>(null);
  const [filterDistrict, setFilterDistrict] = useState<string>('全部');

  useEffect(() => {
    fetch('data/libraries.json')
      .then(res => res.json())
      .then(data => setLibraries(data))
      .catch(err => console.error('Failed to load libraries:', err));
  }, []);

  const districts = ['全部', ...Array.from(new Set(libraries.map((l: any) => l.district))).filter(Boolean)];
  
  const filteredLibraries = libraries.filter((l: any) => 
    filterDistrict === '全部' || l.district === filterDistrict
  );

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="logo-area">
          <h1>北京免费图书馆雷达</h1>
          <span className="live-tag">LIVE DATA</span>
        </div>
        <div className="district-filters">
          {districts.map(d => (
            <button 
              key={d} 
              className={`filter-chip ${filterDistrict === d ? 'active' : ''}`}
              onClick={() => setFilterDistrict(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </header>
      
      <main className="main-content">
        <div className="map-wrapper">
          <Map libraries={filteredLibraries} onMarkerClick={setSelectedLib} />
        </div>
        
        {selectedLib && (
          <div className="detail-panel glass-card">
            <button className="close-btn" onClick={() => setSelectedLib(null)}>×</button>
            <div className="district-tag">{selectedLib.district}</div>
            <h2>{selectedLib.name}</h2>
            
            <div className="score-section">
              <div className="score-value">{selectedLib.score?.total || 'N/A'}</div>
              <div className="score-label">AI 综合评分</div>
            </div>

            <p className="recommendation">
              “{selectedLib.score?.recommendation || '暂无推荐理由'}”
            </p>

            <div className="facility-tags">
              {selectedLib.facilities?.map((f: string) => (
                <span key={f} className="f-tag">{f}</span>
              ))}
              {selectedLib.opening_hours.includes('24小时') && <span className="f-tag special">24H</span>}
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>地址</label>
                <div>{selectedLib.address}</div>
              </div>
              <div className="info-item">
                <label>开放时间</label>
                <div>{selectedLib.opening_hours}</div>
              </div>
            </div>

            <div className="evidence-box">
              <label>免费证据</label>
              <p>{selectedLib.evidence_text}</p>
            </div>

            <a href={selectedLib.source_url} target="_blank" rel="noreferrer" className="source-btn">
              查看数据来源
            </a>
          </div>
        )}
      </main>
      
      <div className="sidebar glass-card">
        <div className="sidebar-header">
          <h3>值得去排行榜</h3>
          <p>基于 AI 多维度评分推荐</p>
        </div>
        <ul className="rank-list">
          {libraries
            .sort((a: any, b: any) => (b.score?.total || 0) - (a.score?.total || 0))
            .slice(0, 15)
            .map((lib: any, index) => (
              <li key={lib.id} className={selectedLib?.id === lib.id ? 'active' : ''} onClick={() => setSelectedLib(lib)}>
                <span className={`rank-num n${index + 1}`}>{index + 1}</span>
                <div className="rank-info">
                  <span className="rank-name">{lib.name}</span>
                  <span className="rank-district">{lib.district}</span>
                </div>
                <span className="rank-score">{lib.score?.total || '-'}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
