import { create } from 'zustand';
import api from '../services/api';

export const usePOIStore = create((set, get) => ({
  pois: [],
  activePOI: null,
  isLoading: false,
  error: null,

  fetchAlongRoute: async ({ polyline, radiusKm = 5, categories = [] }) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        polyline,
        radius_km: radiusKm,
        ...(categories.length && { categories: categories.join(',') }),
      });
      const { data } = await api.get(`/pois/along-route?${params}`);
      set({ pois: data.pois, isLoading: false });
      return data.pois;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  fetchNearby: async ({ lat, lng, radiusKm = 5 }) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/pois/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
      set({ pois: data.pois, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setActivePOI: (poi) => set({ activePOI: poi }),
  clearPOIs: () => set({ pois: [], activePOI: null }),
}));
