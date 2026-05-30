import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0-4SYyDZWBdSuU-fObmuRhJKgQBkIgJs",
  authDomain: "beruangfullweb.firebaseapp.com",
  projectId: "beruangfullweb",
  storageBucket: "beruangfullweb.firebasestorage.app",
  messagingSenderId: "457802099058",
  appId: "1:457802099058:web:353fdc66f56883f3b195eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
