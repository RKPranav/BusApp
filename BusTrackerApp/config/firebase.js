// config/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQvuUW8h8_l6LvCzjiMF72IdhmiqZAjK8",
  authDomain: "busapp-01.firebaseapp.com",
  projectId: "busapp-01",
  storageBucket: "busapp-01.firebasestorage.app",
  messagingSenderId: "32178673637",
  appId: "1:32178673637:web:635c5bf0a76489507ac10c",
  measurementId: "G-JEQY444SW0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
