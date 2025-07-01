"use strict";

const admin = require("firebase-admin");
const path = require("path");

// 1. Initialize the app with service account credentials.
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Utility: Recursively deletes all docs in a given collection.
async function deleteCollection(collectionRef, batchSize = 100) {
  const snapshot = await collectionRef.limit(batchSize).get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // If we still have docs left in the collection, repeat until empty.
  if (snapshot.size >= batchSize) {
    return deleteCollection(collectionRef, batchSize);
  }
}

// 1. Clear Entire Database by Deleting All Collections
async function clearDatabase() {
  console.log("Listing top-level collections...");
  const collections = await db.listCollections();

  for (const collection of collections) {
    console.log(`Deleting all docs in collection: ${collection.id}`);
    await deleteCollection(collection);
  }
  console.log("All collections cleared.");
}

// 2. Re-create Collections (by writing at least one doc)
async function createCollections() {
  console.log("Creating placeholder docs in new collections...");

  // USERS
  await db.collection("users").doc("placeholder_user").set({
    displayName: "Placeholder User",
    email: "placeholder@example.com",
    role: "student",
  });

  // ACTIVITIES
  await db.collection("activities").doc("placeholder_activity").set({
    userId: "placeholder_user",
    type: "journal",
    timestamp: new Date(),
  });

  // MOOD ENTRIES
  await db.collection("moodEntries").doc("placeholder_mood").set({
    userId: "placeholder_user",
    rating: 5,
    date: new Date(),
  });

  // JOURNALS
  await db.collection("journals").doc("placeholder_journal").set({
    userId: "placeholder_user",
    text: "Hello Journal!",
    timestamp: new Date(),
  });

  // CBT RECORDS
  await db.collection("cbtRecords").doc("placeholder_cbt").set({
    userId: "placeholder_user",
    answers: ["example answer"],
    timestamp: new Date(),
  });

  // GROUNDING SESSIONS
  await db.collection("groundingSessions").doc("placeholder_grounding").set({
    userId: "placeholder_user",
    details: "Some grounding details",
    timestamp: new Date(),
  });

  // SUBJECTS
  await db.collection("subjects").doc("placeholder_subject").set({
    name: "Placeholder Subject",
    icon: "placeholder.png",
    order: 1,
  });

  // CHAPTERS
  await db.collection("chapters").doc("placeholder_chapter").set({
    subjectId: "placeholder_subject",
    name: "Placeholder Chapter",
    order: 1,
  });

  // NOTES
  await db.collection("notes").doc("placeholder_note").set({
    userId: "placeholder_user",
    subjectId: "placeholder_subject",
    chapterId: "placeholder_chapter",
    content: "Note content here",
    createdAt: new Date(),
  });

  // TESTS
  await db.collection("tests").doc("placeholder_test").set({
    subjectId: "placeholder_subject",
    chapterId: "placeholder_chapter",
    questions: ["What is 2+2?"],
    createdBy: "admin",
    createdAt: new Date(),
  });

  // PDFS
  await db.collection("pdfs").doc("placeholder_pdf").set({
    subjectId: "placeholder_subject",
    chapterId: "placeholder_chapter",
    fileUrl: "https://example.com/placeholder.pdf",
    title: "Placeholder PDF",
    uploadedBy: "admin",
    uploadedAt: new Date(),
  });

  // WELLNESS TIPS
  await db.collection("wellnessTips").doc("placeholder_tip").set({
    text: "Drink water and take deep breaths.",
    author: "System",
    date: new Date(),
  });

  // EMERGENCY RESOURCES
  await db.collection("emergencyResources").doc("placeholder_resource").set({
    name: "Placeholder Helpline",
    phone: "123-456-7890",
    url: "https://placeholder.org",
    description: "A placeholder emergency resource.",
  });

  console.log("Placeholder docs created. Your new collections are set up!");
}

// Main Function
(async function main() {
  try {
    console.log("WARNING: This will delete ALL existing data in Firestore!");
    // Optional: Add a prompt or environment variable check so the user must confirm.

    await clearDatabase();
    await createCollections();

    console.log("Firestore reset complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error resetting Firestore:", err);
    process.exit(1);
  }
})();
