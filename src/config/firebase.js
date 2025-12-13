import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, get, update, remove } from 'firebase/database';

// PRODUCTION MODE - Use Firebase Realtime Database
export const DEMO_MODE = false;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARr5onKl0bgR-0Ui9Mk87zZMnx76kiPqo",
    authDomain: "mnr-container-system.firebaseapp.com",
    databaseURL: "https://mnr-container-system-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mnr-container-system",
    storageBucket: "mnr-container-system.firebasestorage.app",
    messagingSenderId: "85083661142",
    appId: "1:85083661142:web:4d8d2a9b4efe1c4a64acf7",
    measurementId: "G-2TFWNGB9JZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Export Firebase database utilities
export { ref, onValue, set, push, get, update, remove };
