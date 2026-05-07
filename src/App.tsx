import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { type MapRef } from './components/map/Map';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip as ReTooltip, Cell
} from 'recharts';
import './App.css';

const getEmojiForFacility = (f: string) => {
  if (!f) return '✨';
  const map: Record<string, string> = {
    '24h': '🌙', 'wi-fi': '📶', '自习室': '📖', '自习区': '📖', '咖啡厅': '☕',
    '少儿区': '🧸', '特色建筑': '🏛️', '教堂建筑': '⛪', '四合院': '⛩️', '古建': '⛩️',
    '餐厅': '🍴', '数字资源': '💻', '充电': '⚡', '电源插座': '🔌', '地铁直达': '🚇',
    '免预约': '🚶‍♂️', '隔音舱': '🤫', '免费饮水': '💧', '智能选座': '📱', '存包柜': '🛅'
  };
  return map[f.toLowerCase()] || '✨';
};

function App() {
  const [libraries, setLibraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLib, setSelectedLib] = useState<any>(null);
  const [filterDistrict, setFilterDistrict] = useState<string>('全部');
  const [filterTag, setFilterTag] = useState<string>('全部');
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('data/libraries.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setLibraries(data);
        else setError('数据格式不正确');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const districts = useMemo(() => {
    if (!Array.isArray(libraries)) return ['全部'];
    const set = new Set(libraries.map((l: any) => l?.district).filter(Boolean));
    return ['全部', ...Array.from(set)];
  }, [libraries]);

  const tags = ['全部', '24h', '自习室', 'Wi-Fi', '电源插座', '地铁直达', '免预约', '隔音舱'];
  
  const filteredLibraries = useMemo(() => {
    if (!Array.isArray(libraries)) return [];
    return libraries.filter((l: any) => {
      if (!l) return false;
      const matchDistrict = filterDistrict === '全部' || l.district === filterDistrict;
      let matchTag = true;
      if (filterTag !== '全部') {
        const hasFacility = Array.isArray(l.facilities) && l.facilities.some((f: string) => f && f.toLowerCase() === filterTag.toLowerCase());
        const is24HString = filterTag === '24h' && (l.opening_hours?.includes('24小时') || (Array.isArray(l.facilities) && l.facilities.includes('24h')));
        matchTag = hasFacility || is24HString;
      }
      return matchDistrict && matchTag;
    });
  }, [libraries, filterDistrict, filterTag]);

  // Fuzzy search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return libraries.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.district.toLowerCase().includes(q) ||
      l.address.toLowerCase().includes(q) ||
      (l.facilities && l.facilities.some((f: string) => f.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [libraries, searchQuery]);

  const districtStats = useMemo(() => {
    const stats: Record<string, number> = {};
    if (Array.isArray(libraries)) {
      libraries.forEach((l: any) => {
        if (l?.district) stats[l.district] = (stats[l.district] || 0) + 1;
      });
    }
    return Object.entries(stats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [libraries]);

  const radarData = useMemo(() => {
    if (!selectedLib || !selectedLib.score?.details) return [];
    const d = selectedLib.score.details;
    return [
      { subject: '免费度', A: d.free_credibility || 0, fullMark: 100 },
      { subject: '时间', A: d.opening_hours || 0, fullMark: 100 },
      { subject: '交通', A: d.accessibility || 0, fullMark: 100 },
      { subject: '环境', A: d.environment || 0, fullMark: 100 },
      { subject: '周边', A: d.surrounding || 0, fullMark: 100 },
      { subject: '设施', A: d.facilities || 0, fullMark: 100 },
    ];
  }, [selectedLib]);

  const handleSelectLib = (lib: any) => {
    setSelectedLib(lib);
    setShowSearch(false);
    setSearchQuery('');
    if (mapRef.current && lib.lng && lib.lat) {
      mapRef.current.flyTo(lib.lng, lib.lat);
    }
  };

  const handleNavigate = (lib: any) => {
    if (!lib) return;
    const uri = `https://uri.amap.com/marker?position=${lib.lng},${lib.lat}&name=${encodeURIComponent(lib.name)}&coordinate=gaode&callnative=1`;
    window.open(uri, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>正在拉取北京图书馆实时数据...</p>
      </div>
    );
  }

  if (error && libraries.length === 0) {
    return (
      <div className="loading-screen error">
        <div style={{ fontSize: '40px' }}>📁</div>
        <p>数据加载失败: {error}</p>
        <button onClick={() => window.location.reload()} className="filter-chip active">重试</button>
      </div>
    );
  }

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
                  key={String(d)} 
                  className={`filter-chip ${filterDistrict === d ? 'active' : ''}`}
                  onClick={() => setFilterDistrict(String(d))}
                >
                  {String(d)}
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

        <div className="header-actions">
          <button className="search-trigger" onClick={() => setShowSearch(true)}>
            🔍 <span className="k-hint">⌘K</span>
          </button>
          <button 
            className={`visual-toggle ${showHeatmap ? 'active' : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            {showHeatmap ? '🔥' : '📊'}
          </button>
        </div>
      </header>
      
      {showSearch && (
        <div className="search-overlay glass-card" onClick={(e) => e.target === e.currentTarget && setShowSearch(false)}>
          <div className="search-modal glass-card">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="搜索场馆名称、区域或特色 (如: 24h, 插座)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="search-results">
              {searchResults.map(lib => (
                <div key={lib.id} className="search-item" onClick={() => handleSelectLib(lib)}>
                  <div className="search-item-main">
                    <span className="search-item-name">{lib.name}</span>
                    <span className="search-item-district">{lib.district}</span>
                  </div>
                  <div className="search-item-tags">
                    {lib.facilities?.slice(0, 2).map((f: string) => (
                      <span key={f} className="mini-tag">{getEmojiForFacility(f)}</span>
                    ))}
                  </div>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="no-results">未找到匹配的场馆</div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="map-wrapper">
          <Map ref={mapRef} libraries={filteredLibraries} onMarkerClick={setSelectedLib} showHeatmap={showHeatmap} />
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

            <div className="radar-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar
                    name={selectedLib.name}
                    dataKey="A"
                    stroke="var(--accent-color)"
                    fill="var(--accent-color)"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <p className="recommendation">
              “{selectedLib.score?.recommendation || '暂无推荐理由'}”
            </p>

            <div className="facility-tags">
              {Array.isArray(selectedLib.facilities) && selectedLib.facilities.map((f: string) => (
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

            <div className="action-buttons">
              <button onClick={() => handleNavigate(selectedLib)} className="nav-btn">
                📍 一键导航
              </button>
              <a href={selectedLib.source_url} target="_blank" rel="noreferrer" className="source-btn">
                来源
              </a>
            </div>
          </div>
        )}
      </main>
      
      <div className="sidebar glass-card">
        <div className="sidebar-header">
          <h3>数据洞察</h3>
          <p>资源分布与评分榜单</p>
        </div>
        
        <div className="stats-chart-wrapper">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={districtStats.slice(0, 5)}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <ReTooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#00f2fe' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {districtStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#00f2fe' : '#1e293b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="stats-label">各区资源密度排行</div>
        </div>

        <ul className="rank-list">
          {[...filteredLibraries]
            .sort((a: any, b: any) => (b.score?.total || 0) - (a.score?.total || 0))
            .slice(0, 15)
            .map((lib: any, index) => (
              <li key={lib.id} className={selectedLib?.id === lib.id ? 'active' : ''} onClick={() => handleSelectLib(lib)}>
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
