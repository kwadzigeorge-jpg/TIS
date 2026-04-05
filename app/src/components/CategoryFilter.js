import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

const CATEGORIES = [
  { slug: 'landmark', label: 'Landmarks' },
  { slug: 'cultural', label: 'Cultural' },
  { slug: 'scenic', label: 'Scenic' },
  { slug: 'restaurant', label: 'Food' },
  { slug: 'beach', label: 'Beaches' },
  { slug: 'wildlife', label: 'Wildlife' },
  { slug: 'religious', label: 'Religious' },
  { slug: 'shopping', label: 'Shopping' },
];

export default function CategoryFilter({ selected, onChange }) {
  const toggle = (slug) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.inner}
    >
      {CATEGORIES.map((cat) => {
        const active = selected.includes(cat.slug);
        return (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => toggle(cat.slug)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 120, left: 0, right: 0 },
  inner: { paddingHorizontal: 16, gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd', marginRight: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  pillActive: { backgroundColor: '#1a6b3c', borderColor: '#1a6b3c' },
  label: { fontSize: 13, color: '#555', fontWeight: '500' },
  labelActive: { color: '#fff' },
});
