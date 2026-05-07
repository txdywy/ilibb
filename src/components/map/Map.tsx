import React, { useEffect, useRef } from 'react';

interface MapProps {
  libraries: any[];
  onMarkerClick: (lib: any) => void;
  showHeatmap?: boolean;
}

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
  return map[f.toLowerCase()] || '';
};

const Map: React.FC<MapProps> = ({ libraries, onMarkerClick, showHeatmap = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatmapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 1. Map & Plugins Initialization
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 15;

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
        console.log('Initializing AMap...');
        mapInstance.current = new AMap.Map(mapRef.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
          mapStyle: 'amap://styles/dark', 
          viewMode: '3D',
          pitch: 45,
        });

        // Initialize Geolocation control
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

        // Initialize Heatmap instance but keep hidden
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
          console.log('Heatmap plugin initialized');
        } else {
          // Fallback if plugin not preloaded
          AMap.plugin(['AMap.Heatmap'], () => {
            heatmapInstance.current = new AMap.Heatmap(mapInstance.current, {
              radius: 25,
              opacity: [0, 0.8]
            });
          });
        }
      } catch (e) {
        console.error('AMap Error:', e);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        console.log('Destroying map instance');
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // 2. Render Markers (Dependency: libraries only)
  useEffect(() => {
    if (!mapInstance.current) return;
    
    // @ts-ignore
    const AMap = window.AMap;
    if (!AMap) return;

    // Accurate cleaning of markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    console.log(`Rendering ${libraries.length} markers`);

    libraries.forEach((lib) => {
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
      if (lib.facilities) {
        emojisData = lib.facilities.map((f: string) => ({
          emoji: getEmojiForFacility(f),
          name: f,
          desc: lib.score?.facility_details?.[f] || '提供高品质的阅读与自习服务。'
        })).filter((e: any) => e.emoji);
      }
      if (lib.opening_hours?.includes('24小时') && !emojisData.find((e: any) => e.emoji === '🌙')) {
        emojisData.unshift({ emoji: '🌙', name: '24h', desc: '全天候不打烊的深夜避风港。' });
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
        position: [lib.lng, lib.lat],
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

  // 3. Heatmap & Opacity Control (Pure Reactive)
  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) return;

    if (showHeatmap) {
      mapContainer.classList.add('heatmap-mode');
      if (heatmapInstance.current && libraries.length > 0) {
        try {
          const heatmapData = libraries.map(lib => ({
            lng: Number(lib.lng),
            lat: Number(lib.lat),
            count: Number(lib.score?.total || 70)
          }));
          heatmapInstance.current.setDataSet({ data: heatmapData, max: 100 });
          heatmapInstance.current.show();
          console.log('Heatmap display successful');
        } catch (err) {
          console.error('Heatmap DataSet error:', err);
        }
      }
    } else {
      mapContainer.classList.remove('heatmap-mode');
      if (heatmapInstance.current) {
        heatmapInstance.current.hide();
      }
    }
  }, [showHeatmap, libraries]);

  return <div ref={mapRef} className="map-container-root" style={{ width: '100%', height: '100%' }} />;
};

export default Map;
