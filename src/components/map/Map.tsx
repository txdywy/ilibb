import React, { useEffect, useRef } from 'react';

interface MapProps {
  libraries: any[];
  onMarkerClick: (lib: any) => void;
  showHeatmap?: boolean;
}

const getEmojiForFacility = (f: string) => {
  if (!f) return '';
  const map: Record<string, string> = {
    '24h': '🌙', 'wi-fi': '📶', '自习室': '📖', '自习区': '📖', '咖啡厅': '☕',
    '少儿区': '🧸', '特色建筑': '🏛️', '教堂建筑': '⛪', '四合院': '⛩️', '古建': '⛩️',
    '餐厅': '🍴', '数字资源': '💻', '充电': '⚡', '电源插座': '🔌', '地铁直达': '🚇',
    '免预约': '🚶‍♂️', '隔音舱': '🤫', '免费饮水': '💧', '智能选座': '📱', '存包柜': '🛅'
  };
  return map[f.toLowerCase()] || '';
};

const Map: React.FC<MapProps> = ({ libraries = [], onMarkerClick, showHeatmap = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatmapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializingHeatmap = useRef(false);

  // 1. Initial Setup
  useEffect(() => {
    let retryCount = 0;
    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;
      // @ts-ignore
      const AMap = window.AMap;
      if (!AMap || !AMap.Map) {
        if (retryCount < 20) { retryCount++; setTimeout(initMap, 500); }
        return;
      }
      try {
        mapInstance.current = new AMap.Map(mapRef.current, {
          zoom: 11, center: [116.397428, 39.90923],
          mapStyle: 'amap://styles/dark', viewMode: '3D', pitch: 45,
        });
        AMap.plugin(['AMap.Geolocation'], () => {
          if (AMap.Geolocation && mapInstance.current) {
            mapInstance.current.addControl(new AMap.Geolocation({
              enableHighAccuracy: true, timeout: 10000, position: 'RB', offset: [20, 20], buttonPosition: 'RB'
            }));
          }
        });
      } catch (e) { console.error('AMap creation failed:', e); }
    };
    initMap();
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // 2. Markers
  useEffect(() => {
    if (!mapInstance.current) return;
    // @ts-ignore
    const AMap = window.AMap;
    if (!AMap) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    libraries.forEach((lib) => {
      if (!lib || !lib.lng || !lib.lat) return;
      const score = lib.score?.total || 0;
      let glowColor = 'var(--accent-color)';
      let scale = 1;
      if (score >= 85) { glowColor = '#ffd700'; scale = 1.3; }
      else if (score >= 80) { glowColor = '#00f2fe'; scale = 1.1; }
      else if (score >= 75) { glowColor = '#4facfe'; scale = 0.9; }
      else { glowColor = '#94a3b8'; scale = 0.7; }

      let emojisData = (lib.facilities || []).map((f: string) => ({
        emoji: getEmojiForFacility(f), name: f, desc: lib.score?.facility_details?.[f] || '提供高品质服务。'
      })).filter((e: any) => e.emoji);
      
      const emojiRegistry = new globalThis.Map<string, any>();
      emojisData.forEach((item: any) => { if (!emojiRegistry.has(item.emoji)) emojiRegistry.set(item.emoji, item); });
      const finalEmojis = Array.from(emojiRegistry.values()).slice(0, 3);
      
      const marker = new AMap.Marker({
        position: [Number(lib.lng), Number(lib.lat)],
        map: mapInstance.current,
        zIndex: score,
        content: `
          <div class="custom-marker-wrapper" style="--m-color: ${glowColor}; --m-scale: ${scale};">
            <div class="marker-emojis-container">
              ${finalEmojis.map(e => `
                <div class="map-emoji-item">
                  <span class="m-emoji">${e.emoji}</span>
                  <div class="map-emoji-tooltip">
                    <div class="m-tt-header"><span class="m-tt-emoji">${e.emoji}</span><span class="m-tt-title">${e.name}</span></div>
                    <p class="m-tt-desc">${e.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="amap-marker-glow"></div>
          </div>
        `,
        offset: new AMap.Pixel(-10, -10),
      });
      marker.on('click', () => onMarkerClick(lib));
      markersRef.current.push(marker);
    });
  }, [libraries, onMarkerClick]);

  // 3. Final Calibration for HeatMap Visibility
  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer || !mapInstance.current) return;
    // @ts-ignore
    const AMap = window.AMap;

    if (showHeatmap) {
      mapContainer.classList.add('heatmap-mode');
      
      const activate = () => {
        const hm = heatmapInstance.current;
        if (!hm || typeof hm.setDataSet !== 'function') return;

        // Visual Calibration: Standardize counts and data
        const data = libraries.filter(l => l.lng && l.lat).map(l => ({
          lng: Number(l.lng), lat: Number(l.lat), count: 100
        }));

        try {
          // AMap 2.0 HeatMap Hack: Re-attach and high zIndex
          hm.setDataSet({ data, max: 100 });
          hm.setMap(mapInstance.current);
          if (typeof hm.show === 'function') hm.show();
          console.log('[HeatMap] Visibility Boosted');
        } catch (e) {
          console.error('[HeatMap] Render error:', e);
        }
      };

      if (!heatmapInstance.current && !isInitializingHeatmap.current) {
        isInitializingHeatmap.current = true;
        AMap.plugin(['AMap.HeatMap'], () => {
          const HeatMapClass = AMap.HeatMap || AMap.Heatmap;
          if (HeatMapClass) {
            heatmapInstance.current = new HeatMapClass(mapInstance.current, {
              radius: 60, // Enormous radius
              opacity: [0, 1.0], // Full opacity
              zIndex: 3000, // Top of the world
              gradient: {
                0.2: 'blue',
                0.4: 'cyan',
                0.6: 'lime',
                0.8: 'yellow',
                1.0: 'red'
              }
            });
          }
          isInitializingHeatmap.current = false;
          activate();
        });
      } else {
        activate();
      }
    } else {
      mapContainer.classList.remove('heatmap-mode');
      if (heatmapInstance.current) {
        if (typeof heatmapInstance.current.hide === 'function') heatmapInstance.current.hide();
        if (typeof heatmapInstance.current.setMap === 'function') heatmapInstance.current.setMap(null);
      }
    }
  }, [showHeatmap, libraries]);

  return <div ref={mapRef} className="map-container-root" style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} />;
};

export default Map;
