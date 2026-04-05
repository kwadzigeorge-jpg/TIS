import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, Share, Alert,
} from 'react-native';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function POIDetailScreen({ route }) {
  const { poiId } = route.params;
  const [poi, setPoi] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      api.get(`/pois/${poiId}`),
      api.get(`/reviews/poi/${poiId}`),
    ]).then(([poiRes, reviewRes]) => {
      setPoi(poiRes.data);
      setReviews(reviewRes.data.reviews);
    }).finally(() => setLoading(false));
  }, [poiId]);

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/users/me/bookmarks/${poiId}`);
      } else {
        await api.post(`/users/me/bookmarks/${poiId}`);
      }
      setIsBookmarked(!isBookmarked);
    } catch {
      Alert.alert('Error', 'Could not update bookmark.');
    }
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out ${poi.name} on TIS! ${poi.description}`,
    });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1a6b3c" size="large" />;
  if (!poi) return <Text style={{ padding: 20 }}>POI not found.</Text>;

  return (
    <ScrollView style={styles.container}>
      {/* Hero image */}
      {poi.images?.[0] ? (
        <Image source={{ uri: poi.images[0] }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]} />
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{poi.name}</Text>
            <Text style={styles.meta}>
              {poi.category_label} · {poi.city}{poi.country_code ? `, ${poi.country_code}` : ''}
            </Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={toggleBookmark} style={styles.iconBtn}>
              <Text style={{ fontSize: 22 }}>{isBookmarked ? '🔖' : '🏷️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
              <Text style={{ fontSize: 22 }}>↗️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>⭐ {poi.avg_rating?.toFixed(1) ?? '–'} ({poi.review_count} reviews)</Text>
          <Text style={styles.stat}>⏱ ~{poi.avg_stop_time_mins} min</Text>
          {poi.entrance_fee && <Text style={styles.stat}>💰 {poi.currency} {poi.entrance_fee}</Text>}
        </View>

        {/* Description */}
        <Text style={styles.description}>{poi.description}</Text>

        {/* Reviews */}
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length === 0 && <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>}
        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{r.author_name}</Text>
              <Text style={styles.reviewRating}>{'⭐'.repeat(r.rating)}</Text>
            </View>
            <Text style={styles.reviewBody}>{r.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { width: '100%', height: 240 },
  heroPlaceholder: { backgroundColor: '#c8e6c9' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  meta: { color: '#888', marginTop: 4, fontSize: 14 },
  actions: { flexDirection: 'row' },
  iconBtn: { marginLeft: 12, padding: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  stat: { fontSize: 14, color: '#444', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  description: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 12 },
  noReviews: { color: '#aaa', fontStyle: 'italic', marginBottom: 16 },
  reviewCard: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewAuthor: { fontWeight: '600', color: '#222' },
  reviewRating: { fontSize: 12 },
  reviewBody: { color: '#444', fontSize: 14 },
});
