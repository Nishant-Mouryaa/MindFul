const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const TEST_EMAIL = "nishantmourya2005@gmail.com";
const DAYS = 14; // How many days of data to generate

async function getUserUidByEmail(email) {
  // You must have the user in your 'users' collection with their email
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  if (snapshot.empty) throw new Error('User not found!');
  return snapshot.docs[0].id;
}

async function createSampleDataForUser(uid) {
  const moodEntriesRef = db.collection('moodEntries');
  const activitiesRef = db.collection('activities');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < DAYS; i++) {
    const date = new Date(today.getTime() - i * 86400000); // Go back i days
    const mood = Math.floor(Math.random() * 10) + 1; // Mood 1-10

    // Mood Entry
    await moodEntriesRef.add({
      userId: uid,
      rating: mood,
      date: date,
      timestamp: date
    });

    // Activity (type: 'mood')
    await activitiesRef.add({
      userId: uid,
      type: 'mood',
      moodValue: mood,
      timestamp: date
    });

    // Optionally, add a journal or other activity for variety
    if (i % 3 === 0) {
      await activitiesRef.add({
        userId: uid,
        type: 'journal',
        timestamp: date
      });
    }
  }
  console.log(`Sample data created for user ${uid} (${DAYS} days)`);
}

(async function main() {
  try {
    const uid = await getUserUidByEmail(TEST_EMAIL);
    await createSampleDataForUser(uid);
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();