import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function POICard({ poi, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {poi.images?.[0]
        ? <Image source={{ uri: poi.images[0] }} style={styles.image} />
        : <View style={[styles.image, styles.imagePlaceholder]} />}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{poi.name}</Text>
        <Text style={styles.category}>{poi.category_label ?? poi.category}</Text>
        <View style={styles.footer}>
          <Text style={styles.rating}>⭐ {poi.avg_rating?.toFixed(1) ?? '–'}</Text>
          {poi.distance_from_route_m != null && (
            <Text style={styles.distance}>{(poi.distance_from_route_m / 1000).toFixed(1)} km</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#fff', marginRight: 12,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  image: { width: '100%', height: 100 },
  imagePlaceholder: { backgroundColor: '#c8e6c9' },
  body: { padding: 10 },
  name: { fontWeight: '700', fontSize: 13, color: '#111', marginBottom: 2 },
  category: { fontSize: 11, color: '#888', marginBottom: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  rating: { fontSize: 12, color: '#f4a261' },
  distance: { fontSize: 11, color: '#1a6b3c', fontWeight: '600' },
});
