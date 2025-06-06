// duplicateTextbook.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Path to your service account key

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Optional: include your database URL if required, e.g.:
  // databaseURL: "https://<your-project-id>.firebaseio.com"
});

const db = admin.firestore();

// Function to duplicate a textbook document
async function duplicateDocument(existingDocId) {
  try {
    // Reference the source document in the "textbooks" collection
    const sourceRef = db.collection('textbook').doc(existingDocId);
    const sourceDoc = await sourceRef.get();

    if (!sourceDoc.exists) {
      console.error("Document with ID", existingDocId, "does not exist.");
      return;
    }

    // Get the data of the document
    let data = sourceDoc.data();

    // Optionally modify the data, e.g., append "(Copy)" to the title
    data.title = data.title + " (Copy)";

    // Create a new document in the textbooks collection with the cloned data
    const newDocRef = await db.collection('textbook').add(data);
    console.log("Document duplicated successfully with new ID:", newDocRef.id);
  } catch (error) {
    console.error("Error duplicating document:", error);
  }
}

// Retrieve the document ID from command-line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node duplicateTextbook.js <existingDocId>");
  process.exit(1);
}

duplicateDocument(args[0]).then(() => {
  console.log("Duplication process completed.");
  process.exit(0);
});
