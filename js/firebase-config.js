import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCHspZbWrSZmeHJBqNWQyFPCCS_FOkb2qE",
  authDomain: "students-progress-tracke-b8200.firebaseapp.com",
  projectId: "students-progress-tracke-b8200",
  storageBucket: "students-progress-tracke-b8200.firebasestorage.app",
  messagingSenderId: "971832079191",
  appId: "1:971832079191:web:50986521d54f48f1740412"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
