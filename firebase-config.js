import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBBxoWODxEVasA8fZmPECXW9nYNzWb1rsk",
  authDomain: "josvexa.firebaseapp.com",
  databaseURL: "https://josvexa-default-rtdb.firebaseio.com",
  projectId: "josvexa",
  storageBucket: "josvexa.firebasestorage.app",
  messagingSenderId: "39054488898",
  appId: "1:39054488898:web:7f2b596d285661fcfb04db",
  measurementId: "G-XJZB5V5T0L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
