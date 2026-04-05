import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_NAME = 'TIS_BACKGROUND_LOCATION';
const NOTIFIED_KEY = 'tis_notified_pois';
const CACHED_POIS_KEY = 'tis_route_pois';
const TRIGGER_RADIUS_M = 2000;

// Configure foreground notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task definition — must be at module level
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) { console.error('[Geofence]', error); return; }
  const { locations } = data;
  const { latitude, longitude } = locations[0].coords;
  await checkAndNotify(latitude, longitude);
});

async function checkAndNotify(userLat, userLng) {
  const raw = await AsyncStorage.getItem(CACHED_POIS_KEY);
  if (!raw) return;
  const pois = JSON.parse(raw);

  const notifiedRaw = await AsyncStorage.getItem(NOTIFIED_KEY);
  const notified = new Set(notifiedRaw ? JSON.parse(notifiedRaw) : []);

  for (const poi of pois) {
    if (notified.has(poi.id)) continue;
    const dist = haversineDistance(userLat, userLng, poi.lat, poi.lng);
    if (dist <= TRIGGER_RADIUS_M) {
      await fireNotification(poi, dist);
      notified.add(poi.id);
    }
  }

  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified]));
}

async function fireNotification(poi, distM) {
  const distKm = (distM / 1000).toFixed(1);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Nearby: ${poi.name}`,
      body: `${distKm}km ahead · ⭐ ${poi.avg_rating ?? '–'} · ~${poi.avg_stop_time_mins ?? '?'} min visit`,
      data: { poi_id: poi.id },
    },
    trigger: null,
  });
}

export async function startGeofencing(pois) {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') throw new Error('Foreground location permission denied');

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') throw new Error('Background location permission denied');

  // Cache POIs for background task
  await AsyncStorage.setItem(CACHED_POIS_KEY, JSON.stringify(pois));
  await AsyncStorage.removeItem(NOTIFIED_KEY);

  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (!isRunning) {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 200,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'TIS is active',
        notificationBody: 'Watching for nearby tourist attractions…',
      },
    });
  }
}

export async function stopGeofencing() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (isRunning) await Location.stopLocationUpdatesAsync(TASK_NAME);
  await AsyncStorage.multiRemove([CACHED_POIS_KEY, NOTIFIED_KEY]);
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
