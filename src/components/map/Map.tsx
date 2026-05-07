import React, { useEffect, useRef } from 'react';

interface MapProps {
  libraries: any[];
  onMarkerClick: (lib: any) => void;
  showHeatmap?: boolean;
}

const getEmojiForFacility = (f: string) => {
  if (!f) return '';
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
  return map[f.toLowerCase()] || '';
};

const Map: React.FC<MapProps> = ({ libraries = [], onMarkerClick, showHeatmap = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatmapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20;

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;

      // @ts-ignore
      const AMap = window.AMap;
      if (!AMap || !AMap.Map) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initMap, 500); 
        }
        return;
      }

      try {
        mapInstance.current = new AMap.Map(mapRef.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
          mapStyle: 'amap://styles/dark', 
          viewMode: '3D',
          pitch: 45,
        });

        if (AMap.Geolocation) {
          const geolocation = new AMap.Geolocation({
            enableHighAccuracy: true,
            timeout: 10000,
            position: 'RB',
            offset: [20, 20],
            zoomToAccuracy: true,
            buttonPosition: 'RB'
          });
          mapInstance.current.addControl(geolocation);
        }

        if (AMap.Heatmap) {
          heatmapInstance.current = new AMap.Heatmap(mapInstance.current, {
            radius: 25,
            opacity: [0, 0.8],
            gradient: {
              0.5: 'blue',
              0.65: 'rgb(117,211,248)',
              0.7: 'rgb(0,255,0)',
              0.9: '#ffea00',
              1.0: '#ff0000'
            }
          });
        }
      } catch (e) {
        console.error('AMap creation failed:', e);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    
    // @ts-ignore
    const AMap = window.AMap;
    if (!AMap) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (!Array.isArray(libraries)) return;

    libraries.forEach((lib) => {
      if (!lib || !lib.lng || !lib.lat) return;

      const score = lib.score?.total || 0;
      let glowColor = 'var(--accent-color)';
      let glowSize = '10px';
      let scale = 1;
      let zIndex = 100;

      if (score >= 85) { glowColor = '#ffd700'; glowSize = '20px'; scale = 1.3; zIndex = 105; }
      else if (score >= 80) { glowColor = '#00f2fe'; glowSize = '15px'; scale = 1.1; zIndex = 104; }
      else if (score >= 75) { glowColor = '#4facfe'; glowSize = '8px'; scale = 0.9; zIndex = 103; }
      else { glowColor = '#94a3b8'; glowSize = '4px'; scale = 0.7; zIndex = 102; }

      let emojisData: {emoji: string, name: string, desc: string}[] = [];
      if (Array.isArray(lib.facilities)) {
        emojisData = lib.facilities.map((f: string) => ({
          emoji: getEmojiForFacility(f),
          name: f,
          desc: lib.score?.facility_details?.[f] || '提供高品质服务。'
        })).filter((e: any) => e.emoji);
      }
      
      const emojiRegistry = new globalThis.Map<string, {emoji: string, name: string, desc: string}>();
      emojisData.forEach(item => { if (!emojiRegistry.has(item.emoji)) emojiRegistry.set(item.emoji, item); });
      emojisData = Array.from(emojiRegistry.values()).slice(0, 3);
      
      const emojiHtml = emojisData.length > 0 ? `
        <div class="marker-emojis-container">
          ${emojisData.map(e => `
            <div class="map-emoji-item">
              <span class="m-emoji">${e.emoji}</span>
              <div class="map-emoji-tooltip">
                <div class="m-tt-header"><span class="m-tt-emoji">${e.emoji}</span><span class="m-tt-title">${e.name}</span></div>
                <p class="m-tt-desc">${e.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '';

      const marker = new AMap.Marker({
        position: [Number(lib.lng), Number(lib.lat)],
        title: lib.name,
        map: mapInstance.current,
        zIndex: zIndex,
        content: `
          <div class="custom-marker-wrapper" style="--m-color: ${glowColor}; --m-glow: ${glowSize}; --m-scale: ${scale};">
            ${emojiHtml}
            <div class="amap-marker-glow"></div>
          </div>
        `,
        offset: new AMap.Pixel(-10, -10),
      });

      marker.on('click', () => onMarkerClick(lib));
      markersRef.current.push(marker);
    });
  }, [libraries, onMarkerClick]);

  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer || !heatmapInstance.current) return;

    if (showHeatmap) {
      mapContainer.classList.add('heatmap-mode');
      if (Array.isArray(libraries) && libraries.length > 0) {
        try {
          const heatmapData = libraries.filter(l => l && l.lng && l.lat).map(lib => ({
            lng: Number(lib.lng),
            lat: Number(lib.lat),
            count: Number(lib.score?.total || 70)
          }));
          heatmapInstance.current.setDataSet({ data: heatmapData, max: 100 });
          heatmapInstance.current.show();
        } catch (err) {
          console.error('Heatmap error:', err);
        }
      }
    } else {
      mapContainer.classList.remove('heatmap-mode');
      heatmapInstance.current.hide();
    }
  }, [showHeatmap, libraries]);

  return <div ref={mapRef} className="map-container-root" style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} />;
};

export default Map;
