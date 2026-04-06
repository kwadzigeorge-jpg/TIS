import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const GHANA_CENTER = [-1.0232, 7.9465];

const mapHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet"/>
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:100vw; height:100vh; overflow:hidden; }
    #map { width:100%; height:100%; }
    .poi-marker {
      width:22px; height:22px;
      background:#1a6b3c;
      border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
      transition:transform 0.15s;
    }
    .poi-marker:active { transform:scale(1.3); }
    .mapboxgl-popup-content { border-radius:10px; padding:10px 14px; font-family:sans-serif; }
    .mapboxgl-popup-content h4 { margin:0 0 4px; font-size:14px; color:#1a6b3c; }
    .mapboxgl-popup-content p { margin:0; font-size:12px; color:#666; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  mapboxgl.accessToken = '${MAPBOX_TOKEN}';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: ${JSON.stringify(GHANA_CENTER)},
    zoom: 6.5
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass:false }), 'top-right');
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions:{ enableHighAccuracy:true },
    trackUserLocation:true,
    showUserHeading:true
  }), 'top-right');

  const markers = [];

  window.addPOIs = function(pois) {
    markers.forEach(m => m.remove());
    markers.length = 0;
    pois.forEach(poi => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      const popup = new mapboxgl.Popup({ offset:14, closeButton:false })
        .setHTML('<h4>' + poi.name + '</h4><p>⭐ ' + (poi.avg_rating||'—') + ' · ' + (poi.category_label||'') + '</p>');
      const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.lng, poi.lat])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener('click', () => {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type:'poi_tap', poi }));
      });
      markers.push(marker);
    });
  };

  window.flyToUser = function(lat, lng) {
    map.flyTo({ center:[lng, lat], zoom:13, speed:1.2 });
  };

  map.on('load', () => {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type:'map_ready' }));
  });
</script>
</body>
</html>`;

export default function MapboxMap({ pois = [], userLocation, onPressPOI, style }) {
  const webViewRef = useRef(null);

  useEffect(() => {
    if (!webViewRef.current || !pois.length) return;
    webViewRef.current.injectJavaScript(`window.addPOIs(${JSON.stringify(pois)}); true;`);
  }, [pois]);

  useEffect(() => {
    if (!webViewRef.current || !userLocation) return;
    webViewRef.current.injectJavaScript(
      `window.flyToUser(${userLocation.latitude}, ${userLocation.longitude}); true;`
    );
  }, [userLocation]);

  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'poi_tap' && onPressPOI) onPressPOI(msg.poi);
      if (msg.type === 'map_ready' && webViewRef.current && pois.length) {
        webViewRef.current.injectJavaScript(`window.addPOIs(${JSON.stringify(pois)}); true;`);
      }
    } catch {}
  };

  return (
    <WebView
      ref={webViewRef}
      style={[styles.map, style]}
      source={{ html: mapHTML }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      onMessage={handleMessage}
      startInLoadingState={false}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
