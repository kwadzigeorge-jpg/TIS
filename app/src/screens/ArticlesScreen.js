import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function ArticlesScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/articles').then((res) => setArticles(res.data.articles)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1a6b3c" size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Guides</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            {item.cover_image && <Image source={{ uri: item.cover_image }} style={styles.cover} />}
            <View style={styles.cardBody}>
              <Text style={styles.articleTitle}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
              <Text style={styles.author}>By {item.author_name}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No guides yet. Check back soon!</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', paddingHorizontal: 16, marginBottom: 16 },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8f8f8', elevation: 2 },
  cover: { width: '100%', height: 180 },
  cardBody: { padding: 14 },
  articleTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 6 },
  excerpt: { color: '#666', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  author: { color: '#1a6b3c', fontSize: 13, fontWeight: '600' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 60, fontStyle: 'italic' },
});
