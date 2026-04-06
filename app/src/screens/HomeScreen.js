import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { usePOIStore } from '../store/poiStore';
import POIBottomSheet from '../components/POIBottomSheet';
import CategoryFilter from '../components/CategoryFilter';
import MapboxMap from '../components/MapboxMap';

export default function HomeScreen({ navigation }) {
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
      <MapboxMap
        pois={pois}
        userLocation={userLocation}
        onPressPOI={handleMarkerPress}
        style={StyleSheet.absoluteFill}
      />

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
