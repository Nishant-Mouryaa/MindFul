// scripts/populateDatabase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { config } from '../config/firebase';

const app = initializeApp(config);
const db = getFirestore(app);

async function populateDatabase() {
  // Add board
  const boardRef = doc(collection(db, 'boards'));
  await setDoc(boardRef, {
    name: "CBSE",
    createdAt: new Date()
  });

  // Add standard
  const standardRef = doc(collection(db, `boards/${boardRef.id}/standards`));
  await setDoc(standardRef, {
    name: "Class 10",
    createdAt: new Date()
  });

  // Continue with subjects, chapters, and tests...
    const subjectRef = doc(collection(db, `boards/${boardRef.id}/standards/${standardRef.id}/subjects`));
    await setDoc(subjectRef, {
        name: "Mathematics",
        createdAt: new Date()
        });

    const chapterRef = doc(collection(db, `boards/${boardRef.id}/standards/${standardRef.id}/subjects/${subjectRef.id}/chapters`));
    await setDoc(chapterRef, {
        name: "Algebra",
        createdAt: new Date()
    });

    const testRef = doc(collection(db, `boards/${boardRef.id}/standards/${standardRef.id}/subjects/${subjectRef.id}/chapters/${chapterRef.id}/tests`));
    await setDoc(testRef, {
        title: "Algebra Test",
        description: "Test on Algebra concepts",
        Duration: 30,
        questions: [], // Add questions here
        createdAt: new Date()
    });
}

populateDatabase().catch(console.error);