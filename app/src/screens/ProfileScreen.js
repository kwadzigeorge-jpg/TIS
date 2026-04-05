import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {user?.avatar_url
          ? <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{user?.name?.[0] ?? '?'}</Text></View>}
        <Text style={styles.name}>{user?.name ?? 'Traveller'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#1a6b3c', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  email: { color: '#888', marginTop: 4 },
  logoutBtn: {
    marginTop: 'auto', borderWidth: 1, borderColor: '#e53935',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: '#e53935', fontSize: 16, fontWeight: '600' },
});
