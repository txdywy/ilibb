import { useState, useEffect } from 'react';
import Map from './components/map/Map';
import './App.css';

const getEmojiForFacility = (f: string) => {
  const map: Record<string, string> = {
    '24h': '🌙',
    'wi-fi': '📶',
    '自习室': '📖',
    '自习区': '📖',
    '咖啡厅': '☕',
    '少儿区': '🧸',
    '特色建筑': '🏛️',
    '教堂建筑': '⛪',
    '四合院': '⛩️',
    '古建': '⛩️',
    '餐厅': '🍴',
    '数字资源': '💻',
    '充电': '⚡',
    '电源插座': '🔌',
    '地铁直达': '🚇',
    '免预约': '🚶‍♂️',
    '隔音舱': '🤫',
    '免费饮水': '💧',
    '智能选座': '📱',
    '存包柜': '🛅'
  };
  return map[f.toLowerCase()] || '✨';
};

function App() {
  const [libraries, setLibraries] = useState([]);
  const [selectedLib, setSelectedLib] = useState<any>(null);
  const [filterDistrict, setFilterDistrict] = useState<string>('全部');
  const [filterTag, setFilterTag] = useState<string>('全部');

  useEffect(() => {
    fetch('data/libraries.json')
      .then(res => res.json())
      .then(data => setLibraries(data))
      .catch(err => console.error('Failed to load libraries:', err));
  }, []);

  const districts = ['全部', ...Array.from(new Set(libraries.map((l: any) => l.district))).filter(Boolean)];
  const tags = ['全部', '24h', '自习室', 'Wi-Fi', '电源插座', '地铁直达', '免预约', '隔音舱'];
  
  const filteredLibraries = libraries.filter((l: any) => {
    const matchDistrict = filterDistrict === '全部' || l.district === filterDistrict;
    
    // For '24h', check both facilities array and opening_hours string
    let matchTag = true;
    if (filterTag !== '全部') {
      const hasFacility = l.facilities?.includes(filterTag);
      const is24HString = filterTag === '24h' && (l.opening_hours.includes('24小时') || l.facilities?.includes('24h'));
      matchTag = hasFacility || is24HString;
    }
    
    return matchDistrict && matchTag;
  });

  const handleNavigate = (lib: any) => {
    // Generate a universal URI for AMap web navigation
    const uri = `https://uri.amap.com/marker?position=${lib.lng},${lib.lat}&name=${encodeURIComponent(lib.name)}&coordinate=gaode&callnative=1`;
    window.open(uri, '_blank');
  };

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="logo-area">
          <h1>北京免费图书馆雷达</h1>
          <span className="live-tag">LIVE DATA</span>
        </div>
        <div className="header-filters">
          <div className="filter-group">
            <span className="filter-label">区域:</span>
            <div className="district-filters">
              {districts.map(d => (
                <button 
                  key={d} 
                  className={`filter-chip ${filterDistrict === d ? 'active' : ''}`}
                  onClick={() => setFilterDistrict(d as string)}
                >
                  {d as React.ReactNode}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">特色:</span>
            <div className="district-filters">
              {tags.map(t => (
                <button 
                  key={t} 
                  className={`filter-chip ${filterTag === t ? 'active special' : ''}`}
                  onClick={() => setFilterTag(t)}
                >
                  {t === '24h' ? '24小时' : t}
                </button>
              ))}
            </div>
          </div>
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
                <div key={f} className={`f-tag-wrapper ${f.toLowerCase() === '24h' ? 'special' : ''}`}>
                  <div className="f-tag-content">
                    <span className="f-emoji">{getEmojiForFacility(f)}</span>
                    <span className="f-name">{f}</span>
                  </div>
                  <div className="f-tooltip glass-card">
                    <div className="f-tt-header">
                      <span className="f-tt-emoji">{getEmojiForFacility(f)}</span>
                      <span className="f-tt-title">{f}</span>
                    </div>
                    <p className="f-tt-desc">{selectedLib.score?.facility_details?.[f] || '提供高品质的服务体验'}</p>
                  </div>
                </div>
              ))}
              {!selectedLib.facilities?.includes('24h') && selectedLib.opening_hours.includes('24小时') && (
                <div className="f-tag-wrapper special">
                  <div className="f-tag-content">
                    <span className="f-emoji">🌙</span>
                    <span className="f-name">24h</span>
                  </div>
                  <div className="f-tooltip glass-card">
                    <div className="f-tt-header">
                      <span className="f-tt-emoji">🌙</span>
                      <span className="f-tt-title">24h</span>
                    </div>
                    <p className="f-tt-desc">{selectedLib.score?.facility_details?.['24h'] || '全天候不打烊的深夜避风港。'}</p>
                  </div>
                </div>
              )}
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

            <div className="action-buttons">
              <button onClick={() => handleNavigate(selectedLib)} className="nav-btn">
                📍 一键导航
              </button>
              <a href={selectedLib.source_url} target="_blank" rel="noreferrer" className="source-btn">
                查看来源
              </a>
            </div>
          </div>
        )}
      </main>
      
      <div className="sidebar glass-card">
        <div className="sidebar-header">
          <h3>值得去排行榜</h3>
          <p>基于 AI 多维度评分推荐</p>
        </div>
        <ul className="rank-list">
          {filteredLibraries
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
