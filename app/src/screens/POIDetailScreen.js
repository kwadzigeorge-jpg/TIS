import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share, Alert, Modal, Pressable,
  TextInput, Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const GREEN = '#1a6b3c';
const { width: SCREEN_W } = Dimensions.get('window');
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

function StarRating({ rating, size = 24, interactive = false, onRate }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => interactive && onRate?.(i)} disabled={!interactive}>
          <Text style={{ fontSize: size, color: i <= rating ? '#f4a261' : '#ddd' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MiniMap({ lat, lng, name }) {
  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet"/>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
    <style>*{margin:0;padding:0}body,#map{width:100vw;height:100vh}</style>
  </head><body><div id="map"></div><script>
    mapboxgl.accessToken='${MAPBOX_TOKEN}';
    const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[${lng},${lat}],zoom:13,interactive:false});
    new mapboxgl.Marker({color:'${GREEN}'}).setLngLat([${lng},${lat}]).addTo(map);
  </script></body></html>`;
  return (
    <WebView
      source={{ html }}
      style={styles.miniMap}
      scrollEnabled={false}
      javaScriptEnabled
    />
  );
}

function CategoryBadge({ label }) {
  return <View style={styles.badge}><Text style={styles.badgeText}>{label}</Text></View>;
}

function ReviewCard({ review }) {
  const stars = Math.round(Number(review.rating));
  const date = new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{(review.author_name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewAuthor}>{review.author_name}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <StarRating rating={stars} size={14} />
      </View>
      {review.body ? <Text style={styles.reviewBody}>{review.body}</Text> : null}
    </View>
  );
}

export default function POIDetailScreen({ route, navigation }) {
  const { poiId } = route.params;
  const [poi, setPoi] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const load = useCallback(async () => {
    try {
      const [poiRes, reviewRes, bookmarkRes] = await Promise.all([
        api.get(`/pois/${poiId}`),
        api.get(`/reviews/poi/${poiId}`),
        user ? api.get('/users/me/bookmarks').catch(() => ({ data: { bookmarks: [] } })) : Promise.resolve({ data: { bookmarks: [] } }),
      ]);
      setPoi(poiRes.data);
      setReviews(reviewRes.data.reviews ?? []);
      const bookmarks = bookmarkRes.data?.bookmarks ?? [];
      setIsBookmarked(bookmarks.some(b => b.id === poiId));
    } catch (err) {
      Alert.alert('Error', 'Could not load place details.');
    } finally {
      setLoading(false);
    }
  }, [poiId]);

  useEffect(() => { load(); }, [load]);

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/users/me/bookmarks/${poiId}`);
      } else {
        await api.post(`/users/me/bookmarks/${poiId}`);
      }
      setIsBookmarked(v => !v);
    } catch {
      Alert.alert('Error', 'Could not update bookmark.');
    }
  };

  const handleShare = () => {
    Share.share({ message: `Check out ${poi.name} in ${poi.city}, Ghana! 🇬🇭\n${poi.description}` });
  };

  const submitReview = async () => {
    if (myRating === 0) return Alert.alert('Rate it', 'Please select a star rating.');
    setSubmitting(true);
    try {
      await api.post(`/reviews/poi/${poiId}`, { rating: myRating, body: myReview.trim() });
      setReviewModal(false);
      setMyRating(0);
      setMyReview('');
      const reviewRes = await api.get(`/reviews/poi/${poiId}`);
      setReviews(reviewRes.data.reviews ?? []);
      const poiRes = await api.get(`/pois/${poiId}`);
      setPoi(poiRes.data);
      Alert.alert('Thanks!', 'Your review has been submitted.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={GREEN} size="large" />;
  if (!poi) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Place not found.</Text></View>;

  const avgRating = poi.avg_rating != null ? Number(poi.avg_rating) : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero map */}
        <View style={styles.heroContainer}>
          <MiniMap lat={poi.lat} lng={poi.lng} name={poi.name} />
          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.heroBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.heroBtn} onPress={toggleBookmark}>
                <Text style={{ fontSize: 18 }}>{isBookmarked ? '🔖' : '🏷️'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.heroBtn, { marginLeft: 8 }]} onPress={handleShare}>
                <Text style={{ fontSize: 18 }}>↗️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Name & category */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{poi.name}</Text>
              <Text style={styles.location}>📍 {poi.city}{poi.country_code ? `, ${poi.country_code}` : ''}</Text>
            </View>
            <CategoryBadge label={poi.category_label ?? poi.category} />
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <StarRating rating={Math.round(avgRating ?? 0)} size={18} />
              <Text style={styles.statSub}>{avgRating != null ? avgRating.toFixed(1) : '–'} ({poi.review_count ?? 0} reviews)</Text>
            </View>
            {poi.avg_stop_time_mins && (
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>⏱ ~{poi.avg_stop_time_mins} min</Text>
              </View>
            )}
            {poi.entrance_fee != null && poi.entrance_fee > 0 && (
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>💰 {poi.currency ?? 'GHS'} {poi.entrance_fee}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={styles.description}>{poi.description}</Text>

          {/* Write a review button */}
          {user && (
            <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewModal(true)}>
              <Text style={styles.reviewBtnText}>✍️  Write a Review</Text>
            </TouchableOpacity>
          )}

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0
            ? <Text style={styles.noReviews}>No reviews yet — be the first to review this place!</Text>
            : reviews.map(r => <ReviewCard key={r.id} review={r} />)
          }

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Review {poi.name}</Text>
            <Text style={styles.modalSub}>Tap a star to rate</Text>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <StarRating rating={myRating} size={36} interactive onRate={setMyRating} />
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              value={myReview}
              onChangeText={setMyReview}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => { setReviewModal(false); setMyRating(0); setMyReview(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitText}>Submit</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  heroContainer: { width: '100%', height: 240, position: 'relative' },
  miniMap: { width: '100%', height: 240 },
  heroTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 12, paddingTop: 48,
  },
  heroBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  heroBtnText: { fontSize: 22, color: '#111', lineHeight: 26 },

  content: { padding: 18 },

  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#111', lineHeight: 28 },
  location: { color: '#888', fontSize: 13, marginTop: 3 },

  badge: { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8, marginTop: 4 },
  badgeText: { color: GREEN, fontSize: 11, fontWeight: '700' },

  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox: { marginRight: 4 },
  statSub: { fontSize: 11, color: '#888', marginTop: 2 },
  statPill: { backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statPillText: { fontSize: 12, color: '#444' },

  description: { fontSize: 15, color: '#333', lineHeight: 23, marginBottom: 20 },

  reviewBtn: {
    backgroundColor: GREEN, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', marginBottom: 24,
  },
  reviewBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 14 },
  noReviews: { color: '#aaa', fontStyle: 'italic', marginBottom: 16 },

  reviewCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reviewAuthor: { fontWeight: '600', color: '#222', fontSize: 14 },
  reviewDate: { color: '#aaa', fontSize: 11 },
  reviewBody: { color: '#444', fontSize: 14, lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 44 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  modalSub: { color: '#999', fontSize: 13, textAlign: 'center', marginTop: 4 },
  reviewInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#333', minHeight: 90, marginTop: 4,
  },
  modalBtns: { flexDirection: 'row', marginTop: 16, gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: '#666', fontSize: 15 },
  submitBtn: { flex: 1, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
