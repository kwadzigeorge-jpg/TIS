import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import api from '../services/api';

const GREEN = '#1a6b3c';

function BookmarkCard({ item, onPress, onRemove }) {
  const rating = item.avg_rating != null ? Number(item.avg_rating).toFixed(1) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Left accent */}
      <View style={styles.cardAccent} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardLocation}>📍 {item.city}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category_label ?? item.category}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.pillRow}>
            {rating && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>⭐ {rating}</Text>
              </View>
            )}
            {item.avg_stop_time_mins && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>⏱ ~{item.avg_stop_time_mins} min</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.removeBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏷️</Text>
      <Text style={styles.emptyTitle}>No saved places yet</Text>
      <Text style={styles.emptyDesc}>
        Tap the bookmark icon on any attraction to save it here for later.
      </Text>
    </View>
  );
}

export default function BookmarksScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/me/bookmarks');
      setBookmarks(res.data.bookmarks ?? []);
    } catch {
      Alert.alert('Error', 'Could not load saved places.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const removeBookmark = async (poiId, name) => {
    Alert.alert(
      'Remove bookmark',
      `Remove "${name}" from your saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/me/bookmarks/${poiId}`);
              setBookmarks(prev => prev.filter(b => b.id !== poiId));
            } catch {
              Alert.alert('Error', 'Could not remove bookmark.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={GREEN} size="large" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Places</Text>
        {bookmarks.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{bookmarks.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={bookmarks}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <BookmarkCard
            item={item}
            onPress={() => navigation.navigate('POIDetail', { poiId: item.id })}
            onRemove={() => removeBookmark(item.id, item.name)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={bookmarks.length === 0 ? { flex: 1 } : { paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  countBadge: {
    marginLeft: 10, backgroundColor: GREEN,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 12,
    overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardAccent: { width: 5, backgroundColor: GREEN },
  cardBody: { flex: 1, padding: 14 },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  cardLocation: { fontSize: 12, color: '#888' },

  categoryBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginLeft: 8,
  },
  categoryText: { fontSize: 10, color: GREEN, fontWeight: '700' },

  cardDesc: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: { backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, color: '#444' },

  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 18 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },
});
