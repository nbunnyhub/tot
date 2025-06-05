// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// SENİN firebaseConfig BİLGİLERİN BURAYA
const firebaseConfig = {
  apiKey: "AIzaSyDSe_BoeS_ehpE0aJ1tGxqXJOsb90gycLU",
  authDomain: "the-offering-table.firebaseapp.com",
  databaseURL: "https://the-offering-table-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "the-offering-table",
  storageBucket: "the-offering-table.firebasestorage.app",
  messagingSenderId: "896832677575",
  appId: "1:896832677575:web:2c3aee9dda7e8c3690c0e2"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
