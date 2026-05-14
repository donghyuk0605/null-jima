import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD0VxqRkFczHPXrUbHX5tQh817u6HpkVnk',
  authDomain: 'null-jima.firebaseapp.com',
  projectId: 'null-jima',
  storageBucket: 'null-jima.firebasestorage.app',
  messagingSenderId: '538909356664',
  appId: '1:538909356664:web:215f1146dedc0853b4f38d',
  measurementId: 'G-0BDBMB4SDL',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
