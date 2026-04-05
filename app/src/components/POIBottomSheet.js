import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import POICard from './POICard';

export default function POIBottomSheet({ pois, onPressPOI }) {
  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <Text style={styles.label}>{pois.length} nearby attractions</Text>
      <FlatList
        data={pois}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <POICard poi={item} onPress={() => onPressPOI(item)} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingBottom: 20,
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#ddd',
    borderRadius: 2, alignSelf: 'center', marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', paddingHorizontal: 16, marginBottom: 10 },
  list: { paddingHorizontal: 16 },
});
