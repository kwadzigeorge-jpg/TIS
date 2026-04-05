import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { usePOIStore } from '../store/poiStore';
import { startGeofencing } from '../services/geofence.service';
import api from '../services/api';
import POICard from '../components/POICard';

export default function RouteScreen({ navigation }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routePolyline, setRoutePolyline] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { pois, fetchAlongRoute } = usePOIStore();

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) {
      return Alert.alert('Missing info', 'Please enter both origin and destination.');
    }

    setIsSearching(true);
    try {
      // Geocode via Mapbox (or replace with Google Directions API)
      const res = await api.get('/routes/directions', {
        params: { origin, destination },
      });

      const { polyline, coords } = res.data;
      setRoutePolyline(polyline);
      setRouteCoords(coords);

      const nearbyPOIs = await fetchAlongRoute({ polyline, radiusKm: 5 });
      await startGeofencing(nearbyPOIs);
    } catch (err) {
      Alert.alert('Error', 'Could not find route. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Input panel */}
      <View style={styles.inputPanel}>
        <TextInput
          style={styles.input}
          placeholder="From (e.g. Accra)"
          value={origin}
          onChangeText={setOrigin}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="To (e.g. Kumasi)"
          value={destination}
          onChangeText={setDestination}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
          {isSearching
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.searchBtnText}>Find Route</Text>}
        </TouchableOpacity>
      </View>

      {/* Map */}
      {routeCoords.length > 0 && (
        <MapView style={styles.map} provider={PROVIDER_GOOGLE}>
          <Polyline coordinates={routeCoords} strokeColor="#1a6b3c" strokeWidth={4} />
          {pois.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.lat, longitude: poi.lng }}
              title={poi.name}
              pinColor="#e85d04"
              onPress={() => navigation.navigate('POIDetail', { poiId: poi.id })}
            />
          ))}
        </MapView>
      )}

      {/* POI list */}
      {pois.length > 0 && (
        <View style={styles.poiList}>
          <Text style={styles.poiListTitle}>{pois.length} attractions along this route</Text>
          <FlatList
            data={pois}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <POICard
                poi={item}
                onPress={() => navigation.navigate('POIDetail', { poiId: item.id })}
              />
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  inputPanel: { padding: 16, backgroundColor: '#fff', elevation: 2 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, marginBottom: 10, color: '#222',
  },
  searchBtn: {
    backgroundColor: '#1a6b3c', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  map: { flex: 1 },
  poiList: { maxHeight: 220, backgroundColor: '#fff', padding: 12 },
  poiListTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
});
