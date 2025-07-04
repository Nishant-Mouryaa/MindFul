// sendPushNotifications.js
// Usage: node src/scripts/sendPushNotifications.js
// This script fetches all users from Firestore and sends a heartful notification to each user with a pushToken.

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  };
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  return response.json();
}

async function main() {
  const usersSnapshot = await db.collection('users').get();
  for (const docSnap of usersSnapshot.docs) {
    const user = docSnap.data();
    if (user.pushToken && user.displayName) {
      const title = `Hi ${user.displayName}! 💖`;
      const body = 'Here is a heartful message just for you. Have a wonderful day!';
      try {
        const result = await sendPushNotification(user.pushToken, title, body);
        console.log(`Notification sent to ${user.displayName}:`, result);
      } catch (err) {
        console.error(`Failed to send notification to ${user.displayName}:`, err);
      }
    }
  }
  console.log('All notifications sent.');
}

main().catch(console.error); 