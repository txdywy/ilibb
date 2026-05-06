import React, { useEffect, useRef } from 'react';

interface MapProps {
  libraries: any[];
  onMarkerClick: (lib: any) => void;
}

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
      // Create a fancy marker for AMap
      const marker = new AMap.Marker({
        position: [lib.lng, lib.lat],
        title: lib.name,
        map: mapInstance.current,
        // Optional: Custom content for glowing effect
        content: '<div class="amap-marker-glow"></div>',
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
