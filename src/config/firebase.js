import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE ---
export const firebaseConfig = {
  apiKey: "AIzaSyDhjrf1s53_DRVny1YZdrE74DCbusTDuRw",
  authDomain: "pingpong-cf53f.firebaseapp.com",
  projectId: "pingpong-cf53f",
  storageBucket: "pingpong-cf53f.firebasestorage.app",
  messagingSenderId: "790997099362",
  appId: "1:790997099362:web:c4a3c19fe54ace4feb423b"
};

// --- CONFIGURAÇÕES DO GRUPO ---
export const ADMIN_EMAILS = ['santoslorrany250@gmail.com', 'yurikauanim@gmail.com', 'velosofrancivaldo5@gmail.com']; 

// --- CONFIGURAÇÃO PADRÃO (FALLBACK) ---
export const DEFAULT_CONFIG = {
  finePricePlayer: 5.00,
  finePriceOwner: 4.00,
  banThresholdPlayer: 1,
  banThresholdOwner: 3
};

// --- INICIALIZAÇÃO SEGURA DO FIREBASE ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  console.log("🔥 Banco de dados Offline ATIVADO com sucesso!");
} catch (e) {
  console.warn("⚠️ Firestore já estava iniciado ou erro no cache, usando modo padrão.");
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'pingpong-app';
export const getCollectionPath = (colName) => `artifacts/${appId}/public/data/${colName}`;
