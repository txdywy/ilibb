import React, { useEffect, useRef } from 'react';

interface MapProps {
  libraries: any[];
  onMarkerClick: (lib: any) => void;
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
    '充电': '⚡'
  };
  return map[f.toLowerCase()] || '';
};

const Map: React.FC<MapProps> = ({ libraries, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // @ts-ignore
    const AMap = window.AMap;
    if (!AMap) {
      console.error('AMap is not loaded');
      return;
    }

    mapInstance.current = new AMap.Map(mapRef.current, {
      zoom: 11,
      center: [116.397428, 39.90923],
      mapStyle: 'amap://styles/dark', // Cool dark mode
      viewMode: '3D',
      pitch: 45, // 3D Tilt
    });

    // Load Geolocation Plugin
    AMap.plugin('AMap.Geolocation', function() {
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true, // Set to true to use high accuracy
        timeout: 10000,           // Timeout in milliseconds
        position: 'RB',           // Position of the control (Right Bottom)
        offset: [20, 20],         // Offset from the position
        zoomToAccuracy: true,     // Zoom map to accuracy area
        buttonPosition: 'RB'
      });
      mapInstance.current.addControl(geolocation);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !libraries.length) return;

    // @ts-ignore
    const AMap = window.AMap;
    mapInstance.current.clearMap();

    libraries.forEach((lib) => {
      // Calculate visual intensity based on score
      const score = lib.score?.total || 0;
      let glowColor = 'var(--accent-color)'; // Default cyan
      let glowSize = '10px';
      let scale = 1;
      let zIndex = 100;

      if (score >= 85) {
        glowColor = '#ffd700'; // Gold for top tier
        glowSize = '20px';
        scale = 1.3;
        zIndex = 105;
      } else if (score >= 80) {
        glowColor = '#00f2fe'; // Bright cyan for high tier
        glowSize = '15px';
        scale = 1.1;
        zIndex = 104;
      } else if (score >= 75) {
        glowColor = '#4facfe'; // Muted cyan for mid tier
        glowSize = '8px';
        scale = 0.9;
        zIndex = 103;
      } else {
        glowColor = '#94a3b8'; // Grayish for others
        glowSize = '4px';
        scale = 0.7;
        zIndex = 102;
      }

      // Generate emojis for facilities
      let emojis: string[] = [];
      if (lib.facilities) {
        emojis = lib.facilities.map((f: string) => getEmojiForFacility(f)).filter(Boolean);
      }
      if (lib.opening_hours?.includes('24小时') && !emojis.includes('🌙')) {
        emojis.unshift('🌙'); // 24H gets priority
      }
      // Limit to max 3 emojis to not clutter the map
      emojis = [...new Set(emojis)].slice(0, 3);
      const emojiHtml = emojis.length > 0 ? `<div class="marker-emojis">${emojis.join('')}</div>` : '';

      // Create a fancy marker for AMap
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

      marker.on('click', () => {
        onMarkerClick(lib);
      });
    });
  }, [libraries, onMarkerClick]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default Map;
