import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { usePOIStore } from '../store/poiStore';
import POIBottomSheet from '../components/POIBottomSheet';
import CategoryFilter from '../components/CategoryFilter';

const GHANA_REGION = { latitude: 7.9465, longitude: -1.0232, latitudeDelta: 4, longitudeDelta: 4 };

export default function HomeScreen({ navigation }) {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { pois, isLoading, fetchNearby, setActivePOI } = usePOIStore();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      fetchNearby({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const handleMarkerPress = (poi) => {
    setActivePOI(poi);
    navigation.navigate('POIDetail', { poiId: poi.id });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={GHANA_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={{ latitude: poi.lat, longitude: poi.lng }}
            title={poi.name}
            description={`⭐ ${poi.avg_rating} · ${poi.category_label}`}
            onPress={() => handleMarkerPress(poi)}
            pinColor="#1a6b3c"
          />
        ))}
      </MapView>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Route')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchPlaceholder}>Where to? Plan your route...</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <CategoryFilter
        selected={selectedCategories}
        onChange={setSelectedCategories}
      />

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#1a6b3c" size="large" />
        </View>
      )}

      {/* POI bottom sheet */}
      {pois.length > 0 && <POIBottomSheet pois={pois} onPressPOI={handleMarkerPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  searchPlaceholder: { color: '#999', fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
