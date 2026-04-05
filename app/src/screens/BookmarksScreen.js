import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';
import POICard from '../components/POICard';

export default function BookmarksScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/bookmarks')
      .then((res) => setBookmarks(res.data.bookmarks))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1a6b3c" size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Places</Text>
      {bookmarks.length === 0
        ? <Text style={styles.empty}>No bookmarks yet. Tap 🏷️ on any attraction to save it.</Text>
        : <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <POICard poi={item} onPress={() => navigation.navigate('POIDetail', { poiId: item.id })} />
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 16 },
  empty: { color: '#aaa', fontStyle: 'italic', marginTop: 40, textAlign: 'center' },
});
