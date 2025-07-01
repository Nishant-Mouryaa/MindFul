const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const TEST_EMAIL = "nishantmourya2005@gmail.com"; // Change as needed
const STREAK_DAYS = 10; // How many consecutive days for the streak

async function getUserUidByEmail(email) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  if (snapshot.empty) throw new Error('User not found!');
  return snapshot.docs[0].id;
}

async function createStreakActivities(uid, days) {
  const activitiesRef = db.collection('activities');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today.getTime() - i * 86400000); // Go back i days
    // Set both timestamp and date fields for compatibility
    await activitiesRef.add({
      userId: uid,
      type: 'mood',
      moodValue: Math.floor(Math.random() * 10) + 1,
      timestamp: date,
      date: date
    });
  }
  console.log(`Created ${days} consecutive daily activities for user ${uid}`);
}

(async function main() {
  try {
    const uid = await getUserUidByEmail(TEST_EMAIL);
    await createStreakActivities(uid, STREAK_DAYS);
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
