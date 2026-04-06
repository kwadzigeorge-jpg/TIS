import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { usePOIStore } from '../store/poiStore';
import api from '../services/api';

const GREEN = '#1a6b3c';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

function buildMapHTML(coords, pois, origin, destination) {
  const lineCoords = coords.map(c => [c.lng, c.lat]);
  const poisJson = JSON.stringify(pois);
  const originJson = JSON.stringify(origin);
  const destJson = JSON.stringify(destination);

  return `<!DOCTYPE html>
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
    .poi-dot { width:18px; height:18px; background:#e85d04; border:2px solid #fff; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,.3); cursor:pointer; }
    .origin-dot { width:18px; height:18px; background:#1a6b3c; border:2px solid #fff; border-radius:50%; }
    .dest-dot { width:22px; height:22px; background:#d32f2f; border:2px solid #fff; border-radius:50%; }
    .mapboxgl-popup-content { border-radius:8px; padding:8px 12px; font-family:sans-serif; font-size:13px; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  mapboxgl.accessToken = '${MAPBOX_TOKEN}';
  const coords = ${JSON.stringify(lineCoords)};
  const pois = ${poisJson};
  const origin = ${originJson};
  const dest = ${destJson};

  const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    bounds,
    fitBoundsOptions: { padding: 50 },
  });

  map.on('load', () => {
    map.addSource('route', { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:coords } } });
    map.addLayer({ id:'route-line', type:'line', source:'route', paint:{ 'line-color':'#1a6b3c', 'line-width':4, 'line-opacity':0.9 } });

    // Origin marker
    const oEl = document.createElement('div'); oEl.className = 'origin-dot';
    new mapboxgl.Marker(oEl).setLngLat(coords[0]).setPopup(new mapboxgl.Popup({offset:12}).setHTML('<b>Start:</b> ' + origin.name)).addTo(map);

    // Destination marker
    const dEl = document.createElement('div'); dEl.className = 'dest-dot';
    new mapboxgl.Marker(dEl).setLngLat(coords[coords.length-1]).setPopup(new mapboxgl.Popup({offset:12}).setHTML('<b>End:</b> ' + dest.name)).addTo(map);

    // POI markers
    pois.forEach(poi => {
      const el = document.createElement('div'); el.className = 'poi-dot';
      const popup = new mapboxgl.Popup({offset:12,closeButton:false}).setHTML('<b>' + poi.name + '</b><br>⭐ ' + (poi.avg_rating||'—') + ' · ' + (poi.category_label||''));
      new mapboxgl.Marker(el).setLngLat([poi.lng, poi.lat]).setPopup(popup).addTo(map);
      el.addEventListener('click', () => {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type:'poi_tap', poi }));
      });
    });
  });
</script>
</body>
</html>`;
}

export default function RouteScreen({ navigation }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { pois, fetchAlongRoute } = usePOIStore();
  const webViewRef = useRef(null);

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) {
      return Alert.alert('Missing info', 'Please enter both origin and destination.');
    }
    Keyboard.dismiss();
    setIsSearching(true);
    setRouteData(null);
    try {
      const res = await api.get('/routes/directions', { params: { origin, destination } });
      const data = res.data;
      setRouteData(data);
      await fetchAlongRoute({ polyline: data.polyline, radiusKm: 5 });
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not find route. Try city names like "Accra" or "Kumasi".');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'poi_tap') {
        navigation.navigate('POIDetail', { poiId: msg.poi.id });
      }
    } catch {}
  };

  const mapHTML = routeData ? buildMapHTML(routeData.coords, pois, routeData.origin, routeData.destination) : null;

  return (
    <View style={styles.container}>
      {/* Input panel */}
      <View style={styles.inputPanel}>
        <View style={styles.inputRow}>
          <View style={styles.dotGreen} />
          <TextInput
            style={styles.input}
            placeholder="From (e.g. Accra)"
            value={origin}
            onChangeText={setOrigin}
            placeholderTextColor="#aaa"
            returnKeyType="next"
          />
        </View>
        <View style={styles.inputDivider} />
        <View style={styles.inputRow}>
          <View style={styles.dotRed} />
          <TextInput
            style={styles.input}
            placeholder="To (e.g. Kumasi)"
            value={destination}
            onChangeText={setDestination}
            placeholderTextColor="#aaa"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
          {isSearching
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.searchBtnText}>Find Route</Text>}
        </TouchableOpacity>
      </View>

      {/* Route info bar */}
      {routeData && (
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>📍 {routeData.distanceKm} km</Text>
          <Text style={styles.infoDot}>·</Text>
          <Text style={styles.infoText}>⏱ {routeData.durationMin} min</Text>
          <Text style={styles.infoDot}>·</Text>
          <Text style={styles.infoText}>🏛 {pois.length} attractions</Text>
        </View>
      )}

      {/* Map */}
      {mapHTML ? (
        <WebView
          ref={webViewRef}
          style={styles.map}
          source={{ html: mapHTML }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleWebViewMessage}
        />
      ) : (
        <View style={styles.emptyMap}>
          {isSearching ? (
            <ActivityIndicator color={GREEN} size="large" />
          ) : (
            <>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyText}>Enter a start and end point to plan your route</Text>
              <Text style={styles.emptyHint}>Try: Accra → Cape Coast</Text>
            </>
          )}
        </View>
      )}

      {/* POI list */}
      {pois.length > 0 && (
        <View style={styles.poiList}>
          <Text style={styles.poiListTitle}>{pois.length} attraction{pois.length !== 1 ? 's' : ''} along this route</Text>
          <FlatList
            data={pois}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.poiChip}
                onPress={() => navigation.navigate('POIDetail', { poiId: item.id })}
              >
                <Text style={styles.poiChipName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.poiChipSub}>⭐ {item.avg_rating ?? '—'}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },

  inputPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, elevation: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN, marginRight: 10 },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#d32f2f', marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#222', paddingVertical: 10 },
  inputDivider: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 22, marginVertical: 2 },
  searchBtn: {
    backgroundColor: GREEN, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 10,
  },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoText: { fontSize: 13, color: '#444' },
  infoDot: { marginHorizontal: 8, color: '#ccc' },

  map: { flex: 1 },

  emptyMap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: '#aaa' },

  poiList: { maxHeight: 110, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  poiListTitle: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  poiChip: {
    backgroundColor: '#f0f7f3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    marginRight: 8, minWidth: 120, maxWidth: 160,
  },
  poiChipName: { fontSize: 13, fontWeight: '600', color: '#222' },
  poiChipSub: { fontSize: 11, color: '#888', marginTop: 2 },
});
