import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Switch, Modal, Pressable,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const GREEN = '#1a6b3c';
const LIGHT = '#f5f9f6';

function Avatar({ user, size = 88 }) {
  const initials = (user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({ label, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ddd', true: GREEN }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, loadUser } = useAuthStore();

  const [editModal, setEditModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const [notifNearby, setNotifNearby] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    setSaving(true);
    try {
      await api.patch('/users/me', { name: name.trim() });
      await loadUser();
      setEditModal(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) return Alert.alert('Error', 'Fill in all fields');
    if (newPw.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters');
    if (newPw !== confirmPw) return Alert.alert('Error', 'Passwords do not match');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPw, new_password: newPw });
      setPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Avatar user={user} size={88} />
        <Text style={styles.name}>{user?.name ?? 'Traveller'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {joinedDate && <Text style={styles.joined}>Member since {joinedDate}</Text>}
        <TouchableOpacity style={styles.editBtn} onPress={() => { setName(user?.name ?? ''); setEditModal(true); }}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{user?.bookmarks_count ?? 0}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{user?.reviews_count ?? 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{user?.routes_count ?? 0}</Text>
          <Text style={styles.statLabel}>Routes</Text>
        </View>
      </View>

      {/* Account */}
      <SectionHeader title="ACCOUNT" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuRow} onPress={() => { setName(user?.name ?? ''); setEditModal(true); }}>
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuLabel}>Edit Name</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuRow} onPress={() => setPwModal(true)}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuLabel}>Change Password</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <SectionHeader title="NOTIFICATIONS" />
      <View style={styles.card}>
        <SettingRow label="Nearby attractions" value={notifNearby} onValueChange={setNotifNearby} />
        <View style={styles.divider} />
        <SettingRow label="App updates & tips" value={notifUpdates} onValueChange={setNotifUpdates} />
      </View>

      {/* Preferences */}
      <SectionHeader title="PREFERENCES" />
      <View style={styles.card}>
        <SettingRow label="Dark mode (coming soon)" value={darkMode} onValueChange={setDarkMode} />
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>TIS v1.0.0</Text>

      {/* Edit Name Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="Current password"
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="New password (min 6 chars)"
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Confirm new password"
              secureTextEntry
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => { setPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={changePassword} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Update</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT },
  content: { paddingBottom: 40 },

  headerCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  avatarCircle: {
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  email: { color: '#888', marginTop: 4, fontSize: 14 },
  joined: { color: '#bbb', fontSize: 12, marginTop: 4 },
  editBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 7,
  },
  editBtnText: { color: GREEN, fontWeight: '600', fontSize: 14 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingVertical: 18,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: GREEN },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#eee' },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 6,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuIcon: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#222' },
  menuArrow: { fontSize: 20, color: '#ccc' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: { flex: 1, fontSize: 15, color: '#222' },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#e53935',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#e53935', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 28,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
  },
  modalBtns: { flexDirection: 'row', marginTop: 20, gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 15 },
  saveBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
