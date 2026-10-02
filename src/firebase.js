import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsYot4TV9Z68A7NDEP-2xlZLSHd4KIBIE",
  authDomain: "juniorgig-5f71d.firebaseapp.com",
  projectId: "juniorgig-5f71d",
  storageBucket: "juniorgig-5f71d.firebasestorage.app",
  messagingSenderId: "887684264706",
  appId: "1:887684264706:web:cd1aed15f3e4a6c28e4c1b",
  measurementId: "G-DNCB8PJ31V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);