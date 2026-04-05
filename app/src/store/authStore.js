import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await api.get('/users/me');
      set({ user: data, token });
    } catch {
      await AsyncStorage.removeItem('access_token');
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, tokens } = data;
      await AsyncStorage.setItem('access_token', tokens.access);
      await AsyncStorage.setItem('refresh_token', tokens.refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      set({ user, token: tokens.access, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
}));
