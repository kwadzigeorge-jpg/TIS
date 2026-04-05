const db = require('../db');

let firebaseAdmin;

function getFirebase() {
  if (!firebaseAdmin) {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    firebaseAdmin = admin;
  }
  return firebaseAdmin;
}

async function sendPushNotification({ userId, poi, distanceM }) {
  const { rows } = await db.query('SELECT fcm_tokens FROM users WHERE id = $1', [userId]);
  const tokens = rows[0]?.fcm_tokens || [];
  if (!tokens.length) return;

  const distKm = (distanceM / 1000).toFixed(1);
  const message = {
    notification: {
      title: `Nearby: ${poi.name}`,
      body: `${distKm}km ahead · ⭐ ${poi.avg_rating} · ~${poi.avg_stop_time_mins} min visit`,
    },
    data: {
      poi_id: poi.id,
      type: 'approaching',
    },
    tokens,
  };

  try {
    const admin = getFirebase();
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Notifications sent: ${response.successCount}/${tokens.length}`);
  } catch (err) {
    console.error('FCM error:', err.message);
  }
}

async function registerFCMToken({ userId, token }) {
  await db.query(`
    UPDATE users
    SET fcm_tokens = array_append(
      array_remove(fcm_tokens, $2), $2
    )
    WHERE id = $1
  `, [userId, token]);
}

async function removeFCMToken({ userId, token }) {
  await db.query(`
    UPDATE users SET fcm_tokens = array_remove(fcm_tokens, $2) WHERE id = $1
  `, [userId, token]);
}

module.exports = { sendPushNotification, registerFCMToken, removeFCMToken };
