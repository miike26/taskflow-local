import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANTE: Substitua os valores abaixo pelas credenciais do seu projeto no Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBEEpG1CTvebbJshEK-PT54-DOuhm6bTEs",
  authDomain: "taskflow-app-9a064.firebaseapp.com",
  projectId: "taskflow-app-9a064",
  storageBucket: "taskflow-app-9a064.firebasestorage.app",
  messagingSenderId: "886897580334",
  appId: "1:886897580334:web:f61c99e93333f4976802bf"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias de autenticação e banco de dados para usar no app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);