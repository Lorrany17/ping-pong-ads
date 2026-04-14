import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  orderBy, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch,
  deleteField 
} from 'firebase/firestore';
import { 
  Trophy, 
  PlusCircle, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  LogOut, 
  LogIn, 
  Gavel, 
  History, 
  UserPlus, 
  Trash2, 
  Check, 
  Save, 
  Edit2, 
  RefreshCw, 
  Camera, 
  Eye, 
  EyeOff, 
  Banknote, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  MinusCircle, 
  Search, 
  Minus, 
  Plus, 
  TrendingUp, 
  Zap, 
  Calendar, 
  Clock,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDhjrf1s53_DRVny1YZdrE74DCbusTDuRw",
  authDomain: "pingpong-cf53f.firebaseapp.com",
  projectId: "pingpong-cf53f",
  storageBucket: "pingpong-cf53f.firebasestorage.app",
  messagingSenderId: "790997099362",
  appId: "1:790997099362:web:c4a3c19fe54ace4feb423b"
};

// --- CONFIGURAÇÕES DO GRUPO ---
const ADMIN_EMAILS = ['santoslorrany250@gmail.com', 'yurikauanim@gmail.com', 'velosofrancivaldo5@gmail.com']; 

// --- CONFIGURAÇÃO PADRÃO (FALLBACK) ---
const DEFAULT_CONFIG = {
  finePricePlayer: 5.00,
  finePriceOwner: 4.00,
  banThresholdPlayer: 1,
  banThresholdOwner: 3
};

// --- INICIALIZAÇÃO SEGURA DO FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let db;
try {
  // Tenta iniciar com suporte Offline (Cache)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  console.log("🔥 Banco de dados Offline ATIVADO com sucesso!");
} catch (e) {
  // Se der erro (ex: já foi iniciado pelo React), pega a instância normal
  console.warn("⚠️ Firestore já estava iniciado ou erro no cache, usando modo padrão.");
  db = getFirestore(app);
};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pingpong-app';

const getCollectionPath = (colName) => `artifacts/${appId}/public/data/${colName}`;

const AVATARS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💧','💦','☔️','☂️','🌊','🌫'];

const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

// --- HELPERS DE TEMPORADA ---
const getCurrentSeasonId = () => new Date().toISOString().slice(0, 7); 

const getSeasonOptions = () => {
    const options = [{ value: 'legacy', label: '📂 Arquivo Morto (Antigos)' }];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
        const value = date.toISOString().slice(0, 7);
        const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        options.push({ value, label: formattedLabel });
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

const isPlayerBanned = (user, config = DEFAULT_CONFIG) => {
    if (!user) return false;
    const fines = user.fines || 0;
    const threshold = user.isOwner ? Number(config.banThresholdOwner) : Number(config.banThresholdPlayer);
    return fines >= threshold;
};

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150; 
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
    };
  });
};

const dateFilters = {
  day: d => new Date(d).toDateString() === new Date().toDateString(),
  week: d => {
    const date = new Date(d), today = new Date();
    const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff)); monday.setHours(0,0,0,0);
    return date >= monday;
  },
  month: d => {
    const date = new Date(d), today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  },
  all: () => true
};

// --- COMPONENTES DE NATAL ---

const ChristmasSnow = () => {
    // Verifica se estamos em Dezembro (mês 11 no JS)
    if (new Date().getMonth() !== 11) return null;
    
    const snowStyle = `
        @keyframes snowfall {
            0% { transform: translateY(-10px) translateX(0); opacity: 1; }
            100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
        }
        .snowflake { position: fixed; top: -10px; color: #fff; font-size: 1em; opacity: 0.8; pointer-events: none; z-index: 0; animation: snowfall linear infinite; }
    `;
    const snowflakes = Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const animDuration = 5 + Math.random() * 10;
        const animDelay = Math.random() * 5;
        const size = 0.5 + Math.random();
        return (<div key={i} className="snowflake" style={{ left: `${left}vw`, animationDuration: `${animDuration}s`, animationDelay: `${animDelay}s`, transform: `scale(${size})` }}>❄</div>);
    });
    
    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
            <style>{snowStyle}</style>
            {snowflakes}
        </div>
    );
};

const ChristmasLights = () => {
    if (new Date().getMonth() !== 11) return null;
    return (
        <div className="fixed top-0 left-0 w-full h-3 z-[60] flex justify-between px-2 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => {
                const colors = ['bg-red-500', 'bg-emerald-500', 'bg-yellow-400', 'bg-blue-500'];
                const color = colors[i % 4];
                return (<div key={i} className={`w-2 h-2 rounded-full ${color} shadow-[0_0_10px_2px_rgba(255,255,255,0.3)] animate-pulse`} style={{ animationDuration: `${1 + Math.random()}s` }}></div>);
            })}
        </div>
    );
};

// --- COMPONENTES PADRÃO ---

const AvatarDisplay = ({ avatar, size = "md", className = "" }) => {
    const isImage = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));
    const sizeClasses = { sm: "w-8 h-8 text-lg", md: "w-12 h-12 text-2xl", lg: "w-16 h-16 text-4xl", xl: "w-24 h-24 text-6xl" };
    const isChristmas = new Date().getMonth() === 11;

    return (
        <div className="relative inline-block">
            <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-slate-700 border border-slate-600 ${className} relative z-0`}>
                {isImage ? (
                    <img src={avatar} alt="Av" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'; e.target.parentNode.innerHTML='❌'}} />
                ) : (
                    <span role="img">{avatar || '👤'}</span>
                )}
            </div>
            
            {/* GORRINHO NA BORDA (SEM TAMPAR O ROSTO) */}
            {isChristmas && (
                <svg 
                    viewBox="0 0 100 100" 
                    // MUDANÇA: -top-5 (sobe mais) e -left-4 (sai mais para o lado) e w-9 (levemente maior)
                    className="absolute -top-5 -right-4 w-9 h-9 z-10 pointer-events-none filter drop-shadow-lg" 
                    // Mantém o espelhamento para a esquerda
                    style={{ transform: 'scaleX(-1) rotate(-25deg)' }}
                >
                    {/* Parte Vermelha */}
                    <path d="M20,80 Q50,10 80,80" fill="#ef4444" />
                    {/* Pompom Branco */}
                    <circle cx="20" cy="80" r="10" fill="white" />
                    {/* Base Branca */}
                    <path d="M45,80 Q65,90 85,80" stroke="white" strokeWidth="12" strokeLinecap="round" fill="none" />
                </svg>
            )}
        </div>
    );
};

const SeasonSelector = ({ current, onChange }) => {
    const options = getSeasonOptions();
    return (
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 mb-4 shadow-sm relative">
            <Calendar className="text-emerald-400 w-5 h-5 absolute left-3 pointer-events-none" />
            <select 
                value={current}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent text-white text-sm font-bold outline-none w-full cursor-pointer pl-8 appearance-none py-1 relative z-10"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="text-slate-500 w-4 h-4 absolute right-3 pointer-events-none" />
        </div>
    );
};

const PlayerStatsModal = ({ player, onClose }) => {
    if (!player) return null;
    const netScore = player.wins - player.losses;
    const winRate = player.games > 0 ? Math.round((player.wins / player.games) * 100) : 0;

    // USA A MESMA LÓGICA DO RANKING AGORA
    const activeBadges = calculateBadges(player);

    return (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95">
                {/* ... (O RESTO DO CÓDIGO DO MODAL CONTINUA IGUAL) ... */}
                {/* Apenas certifique-se de manter a renderização das medalhas que fizemos antes */}
                
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <AvatarDisplay avatar={player.avatar} size="lg" className="border-2 border-emerald-500" />
                        <div>
                            <h2 className="text-xl font-bold text-white">{player.displayName}</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${player.isOwner ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                {player.isOwner ? 'Dono da Raquete' : 'Jogador'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-700 rounded-full p-1"><XCircle className="w-6 h-6" /></button>
                </div>

                {activeBadges.length > 0 && (
                    <div className="mb-5 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-yellow-500" /> Conquistas Desbloqueadas
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {activeBadges.map(badgeKey => {
                                const info = BADGES_CONFIG[badgeKey];
                                if (!info) return null;
                                return (
                                    <div key={badgeKey} className="flex flex-col items-center bg-slate-800 p-2 rounded-lg border border-slate-700 min-w-[70px] shadow-sm relative group cursor-help">
                                        <span className="text-2xl mb-1 filter drop-shadow-md">{info.emoji}</span>
                                        <span className={`text-[9px] font-bold text-center leading-tight ${info.color}`}>{info.title}</span>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[150px] bg-black text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl border border-slate-600">
                                            {info.desc}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-center">
                        <span className="text-xs text-slate-400 font-bold uppercase">Pontuação</span>
                        <div className={`text-2xl font-black ${netScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {netScore > 0 ? '+' : ''}{netScore}
                        </div>
                        <span className="text-[10px] text-slate-500">Vitórias - Derrotas</span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-center">
                        <span className="text-xs text-slate-400 font-bold uppercase">Aproveitamento</span>
                        <div className="text-2xl font-black text-white">{winRate}%</div>
                        <span className="text-[10px] text-slate-500">{player.wins}V / {player.losses}D</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="bg-slate-700/30 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-slate-300 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Total Partidas</span>
                        <span className="font-bold text-white">{player.games}</span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-lg flex justify-between items-center border-t border-slate-600 mt-2 pt-2">
                        <span className="text-sm text-slate-300 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Saldo de Pontos</span>
                        <span className={`font-bold ${player.pointDiff >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {player.pointDiff > 0 ? '+' : ''}{player.pointDiff}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                         <div className="bg-slate-700/30 p-3 rounded-lg flex flex-col items-center text-center">
                            <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" fill="currentColor" /> Chilenas Dadas</span>
                            <span className="font-bold text-white text-lg">{player.chilenasGiven}</span>
                         </div>
                         <div className="bg-slate-700/30 p-3 rounded-lg flex flex-col items-center text-center">
                            <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Chilenas Tomadas</span>
                            <span className="font-bold text-white text-lg">{player.chilenasReceived}</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserSelectModal = ({ users, onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const filtered = users.filter(u => u.displayName.toLowerCase().includes(search.toLowerCase()));

    const handleCreateAndSelect = async () => {
        if (!search.trim()) return;
        const fakeUid = 'offline_' + Date.now();
        const newUser = {
            uid: fakeUid,
            displayName: search,
            email: `offline_${Date.now()}@noemail.com`,
            isOwner: false,
            isOffline: true,
            fines: 0,
            balance: 0,
            role: 'user',
            avatar: getRandomAvatar(),
            createdAt: serverTimestamp()
        };
        try {
            await setDoc(doc(db, getCollectionPath('users'), fakeUid), newUser);
            onSelect(newUser); 
        } catch (e) {
            alert("Erro ao criar: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl h-[80vh] flex flex-col">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="font-bold text-white">Selecionar Infrator</h2>
                    <button onClick={onClose} className="text-slate-400"><XCircle /></button>
                </div>
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                        <input 
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-10 text-white outline-none"
                            placeholder="Buscar nome..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    {filtered.map(u => (
                        <button 
                            key={u.uid} 
                            onClick={() => onSelect(u)}
                            className="w-full bg-slate-700/50 hover:bg-slate-700 p-3 rounded-xl flex items-center gap-3 text-left transition-colors"
                        >
                            <AvatarDisplay avatar={u.avatar} size="sm" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="block font-bold text-white">{u.displayName}</span>
                                    {isPlayerBanned(u) && <span className="text-[8px] bg-red-600 px-1 rounded">BANIDO</span>}
                                </div>
                                <span className="text-[10px] text-slate-400">{u.isOwner ? 'Dono' : (u.isOffline ? 'Sem Conta' : 'Jogador')}</span>
                            </div>
                        </button>
                    ))}
                    
                    {search.length > 0 && (
                        <button 
                            onClick={handleCreateAndSelect}
                            className="w-full bg-emerald-900/30 border border-emerald-700/50 hover:bg-emerald-900/50 p-3 rounded-xl flex items-center justify-center gap-2 text-emerald-400 font-bold mt-4"
                        >
                            <UserPlus className="w-4 h-4" />
                            Cadastrar e Multar "{search}"
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const AuthScreen = ({ onCancel, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showReset, setShowReset] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const migrateOfflineUser = async (newUserUid, userEmail) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        const q = query(usersRef, where('email', '==', userEmail), where('isOffline', '==', true));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null; 
        const offlineDoc = querySnapshot.docs[0];
        const offlineData = offlineDoc.data();
        const offlineUid = offlineDoc.id;
        const batch = writeBatch(db);
        const matchesRef = collection(db, getCollectionPath('matches'));
        const qP1 = query(matchesRef, where('p1Id', '==', offlineUid));
        const p1Snaps = await getDocs(qP1);
        p1Snaps.forEach(doc => { batch.update(doc.ref, { p1Id: newUserUid }); });
        const qP2 = query(matchesRef, where('p2Id', '==', offlineUid));
        const p2Snaps = await getDocs(qP2);
        p2Snaps.forEach(doc => { batch.update(doc.ref, { p2Id: newUserUid }); });
        
        const transRef = collection(db, getCollectionPath('transactions'));
        const qTrans = query(transRef, where('userId', '==', offlineUid));
        const transSnaps = await getDocs(qTrans);
        transSnaps.forEach(doc => { batch.update(doc.ref, { userId: newUserUid }); });

        batch.delete(offlineDoc.ref);
        await batch.commit();
        return { fines: offlineData.fines || 0, isOwner: offlineData.isOwner || false, avatar: offlineData.avatar, balance: offlineData.balance || 0 };
    } catch (e) { return null; }
  };

  const handleSubmit = async (winType) => {
    if (!isGuestP1 && !selectedP1) return;
    if (!isGuestP2 && !selectedP2) return;
    if (isDoubles && (!selectedP1Partner || !selectedP2Partner)) return alert("Selecione as duplas completas!");

    setLoading(true);
    try {
      const matchData = { 
          createdAt: serverTimestamp(), 
          createdBy: currentUser.uid, 
          seasonId: currentSeasonId,
          isChilena: false,
          isSimpleWin: false,
          isDoubles: isDoubles
      };

      // ... (LÓGICA DE NOMES E IDS PERMANECE IGUAL) ...
      if (isGuestP1) { matchData.p1Name = guestNameP1 || 'Convidado 1'; matchData.p1Id = 'guest_' + Date.now() + '_1'; } 
      else { matchData.p1Name = selectedP1.displayName; matchData.p1Id = selectedP1.uid; }
      if (isDoubles && selectedP1Partner) { matchData.p1PartnerName = selectedP1Partner.displayName; matchData.p1PartnerId = selectedP1Partner.uid; }

      if (isGuestP2) { matchData.p2Name = guestNameP2 || 'Convidado 2'; matchData.p2Id = 'guest_' + Date.now() + '_2'; } 
      else { matchData.p2Name = selectedP2.displayName; matchData.p2Id = selectedP2.uid; }
      if (isDoubles && selectedP2Partner) { matchData.p2PartnerName = selectedP2Partner.displayName; matchData.p2PartnerId = selectedP2Partner.uid; }

      let s1Final = 0, s2Final = 0;

      // ... (LÓGICA DE PLACAR PERMANECE IGUAL) ...
      if (winType === 'score') {
          if (!score1 || !score2) return;
          s1Final = parseInt(score1);
          s2Final = parseInt(score2);
      } else if (winType === 'p1_chilena') {
          s1Final = 7; s2Final = 0; matchData.isChilena = true;
      } else if (winType === 'p2_chilena') {
          s1Final = 0; s2Final = 7; matchData.isChilena = true;
      } else if (winType === 'p1_simple') {
          s1Final = 1; s2Final = 0; matchData.isSimpleWin = true; 
      } else if (winType === 'p2_simple') {
          s1Final = 0; s2Final = 1; matchData.isSimpleWin = true; 
      }

      matchData.s1 = s1Final;
      matchData.s2 = s2Final;

      let newStatus = 'pending_user';
      let confBy = null;
      let confAt = null;

      if (isAdmin) {
          newStatus = 'confirmed'; confBy = 'admin_scribe'; confAt = serverTimestamp();
      } else {
          newStatus = 'pending_guest'; 
      }

      matchData.status = newStatus;
      if(confBy) matchData.confirmedBy = confBy;
      if(confAt) matchData.confirmedAt = confAt;
      
      const docRef = await addDoc(collection(db, getCollectionPath('matches')), matchData);
      
      if (matchData.isChilena) triggerChilenaEffect();
      else triggerWinConfetti();

      // --- 👠 ZOEIRA DO "PERDEU DE 4" (NOVA LÓGICA AQUI) ---
      // Só executa se não for chilena (chilena é 7x0) e tiver placar real
      if (!matchData.isChilena && !matchData.isSimpleWin) {
          const p1Won = s1Final > s2Final;
          const loserScore = p1Won ? s2Final : s1Final;
          const loserName = p1Won ? (matchData.p2Name) : (matchData.p1Name);
          
          if (loserScore === 4) {
              // Toca um alerta humilhante
              alert(`👠 IHHH! ${loserName} PERDEU DE 4!\n\n🤣 VIROU PUTA! 🤣`);
          }
      }

      // --- LÓGICA DO REI DA MESA ---
      if (isKingMode && newStatus === 'confirmed') {
          const p1Won = s1Final > s2Final;
          if (!p1Won) {
              if (isGuestP2) {
                  setIsGuestP1(true);
                  setGuestNameP1(guestNameP2);
                  setSelectedP1(null);
                  setSelectedP1Partner(null);
              } else {
                  setIsGuestP1(false);
                  setSelectedP1(selectedP2);
                  if (isDoubles) setSelectedP1Partner(selectedP2Partner);
              }
          }
          setIsGuestP2(false);
          setGuestNameP2('');
          setSelectedP2(null);
          setSelectedP2Partner(null);
          setScore1('');
          setScore2('');
          setLoading(false);
          if(!((!matchData.isChilena && !matchData.isSimpleWin) && ((p1Won ? s2Final : s1Final) === 4))) {
             // Só mostra o alerta do Rei se não mostrou o da Puta (pra não ter 2 alerts seguidos)
             alert('👑 Vencedores continuam! Quem são os próximos desafiantes?');
          }
      } else {
          onSuccess(docRef.id, matchData.status);
      }

    } catch (err) { alert('Erro: ' + err.message); setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError("Digite seu e-mail primeiro."); return; }
    setLoading(true); setError('');
    try { await sendPasswordResetEmail(auth, email); alert("E-mail enviado!"); setShowReset(false); } 
    catch (err) { setError("Erro: " + err.message); } finally { setLoading(false); }
  };

  if (showReset) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
            <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 relative">
                <button onClick={() => setShowReset(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle /></button>
                <div className="text-center mb-6"><h2 className="text-2xl font-bold">Recuperar Senha</h2><p className="text-slate-400 text-sm">Digite seu e-mail para receber o link.</p></div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Email</label><input type="email" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar Link'}</button>
                </form>
                <div className="mt-4 text-center">
                    <button onClick={() => setShowReset(false)} className="text-slate-400 text-sm hover:text-white underline">Voltar para o Login</button>
                </div>
            </div>
        </div>
      );
  }

  const isChristmas = new Date().getMonth() === 11;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100 relative overflow-hidden">
      <ChristmasSnow />
      <ChristmasLights />
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 relative z-10">
        {onCancel && (<button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle /></button>)}
        <div className="text-center mb-8">
            <Trophy className={`w-12 h-12 mx-auto mb-2 ${isChristmas ? 'text-red-500' : 'text-emerald-400'}`} />
            {isChristmas ? (
                <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2"><span className="text-red-500 drop-shadow-md">Ping</span><span className="text-emerald-500 drop-shadow-md">Pong</span><span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Master</span><span>🎅</span></h1>
            ) : (
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Ping Pong Master</h1>
            )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (<div><label className="block text-sm font-medium text-slate-300 mb-1">Nome</label><input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} /></div>)}
          <div><label className="block text-sm font-medium text-slate-300 mb-1">Email</label><input type="email" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
          </div>

          {isLogin && (<div className="text-right"><button type="button" onClick={() => setShowReset(true)} className="text-emerald-400 text-xs hover:underline">Esqueci minha senha</button></div>)}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">{loading ? '...' : (isLogin ? 'Entrar' : 'Criar Conta')}</button>
        </form>
        <div className="mt-6 text-center space-y-4">
            <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 text-sm hover:underline">{isLogin ? 'Criar conta' : 'Fazer login'}</button>
            {onCancel && (<div className="pt-4 border-t border-slate-700"><button onClick={onCancel} className="text-slate-400 text-sm flex items-center justify-center gap-2 w-full hover:text-white"><Eye className="w-4 h-4" /> Apenas Olhar (Sem Conta)</button></div>)}
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ user, userDoc, onClose }) => {
    const [name, setName] = useState(userDoc?.displayName || '');
    const [avatar, setAvatar] = useState(userDoc?.avatar || '👤');
    const [loading, setLoading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return alert('Imagem muito grande! Máximo 5MB.');
        try { const resizedBase64 = await resizeImage(file); setAvatar(resizedBase64); } catch (error) { alert('Erro ao processar imagem'); }
    };

    const handleSave = async () => {
        if(!name.trim()) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, getCollectionPath('users'), user.uid), { displayName: name, avatar: avatar });
            await updateProfile(user, { displayName: name });
            onClose();
        } catch (error) { alert('Erro ao salvar'); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95 relative z-10">
                <h2 className="text-xl font-bold text-white mb-4 text-center">Editar Perfil</h2>
                <div className="flex flex-col items-center mb-6 gap-4">
                    <AvatarDisplay avatar={avatar} size="xl" className="border-4 border-slate-600 shadow-lg" />
                    <div className="flex gap-2">
                        <button onClick={() => setAvatar(getRandomAvatar())} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-slate-600"><RefreshCw className="w-3 h-3" /> Emoji</button>
                        <button onClick={() => fileInputRef.current.click()} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-emerald-500"><Camera className="w-3 h-3" /> Foto</button>
                        <button onClick={() => setShowUrlInput(!showUrlInput)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-blue-500"><Globe className="w-3 h-3" /> Link</button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    {showUrlInput && (
                        <input 
                            type="text" 
                            placeholder="Cole o link da imagem (https://...)" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                            onChange={(e) => setAvatar(e.target.value)}
                        />
                    )}
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-400">SEU NOME</label><input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1 focus:border-emerald-500 outline-none" value={name} onChange={e => setName(e.target.value)} /></div>
                    <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
                    <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ config, onClose }) => {
    const [values, setValues] = useState({
        finePricePlayer: config.finePricePlayer,
        finePriceOwner: config.finePriceOwner,
        banThresholdPlayer: config.banThresholdPlayer,
        banThresholdOwner: config.banThresholdOwner
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (field, val) => setValues(prev => ({ ...prev, [field]: val }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const cleanValues = {
                finePricePlayer: parseFloat(values.finePricePlayer),
                finePriceOwner: parseFloat(values.finePriceOwner),
                banThresholdPlayer: parseInt(values.banThresholdPlayer),
                banThresholdOwner: parseInt(values.banThresholdOwner)
            };
            await setDoc(doc(db, getCollectionPath('settings'), 'global'), cleanValues);
            alert('✅ Regras atualizadas com sucesso!');
            onClose();
        } catch (e) { 
            console.error(e);
            alert('Erro: ' + e.message); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95 relative z-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Gavel className="text-amber-400"/> Regras do Jogo</h2>
                
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Preço das Multas (R$)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] text-slate-500">JOGADOR</label><input type="number" step="0.5" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" value={values.finePricePlayer} onChange={e => handleChange('finePricePlayer', e.target.value)} /></div>
                            <div><label className="text-[10px] text-slate-500">DONO</label><input type="number" step="0.5" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" value={values.finePriceOwner} onChange={e => handleChange('finePriceOwner', e.target.value)} /></div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Limite de Banimento (Infrações)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] text-slate-500">JOGADOR</label><input type="number" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" value={values.banThresholdPlayer} onChange={e => handleChange('banThresholdPlayer', e.target.value)} /></div>
                            <div><label className="text-[10px] text-slate-500">DONO</label><input type="number" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" value={values.banThresholdOwner} onChange={e => handleChange('banThresholdOwner', e.target.value)} /></div>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg mt-2">{loading ? 'Salvando...' : 'Salvar Regras'}</button>
                    <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const TransactionModal = ({ user, action, onClose, config }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [finesToClear, setFinesToClear] = useState(1); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (action === 'fine') {
            const price = user.isOwner ? config.finePriceOwner : config.finePricePlayer;
            setAmount(Number(price).toFixed(2));
            setDescription('Infração');
        } else {
            setAmount(user.balance > 0 ? user.balance.toFixed(2) : '');
            setDescription('Pagamento');
            setFinesToClear(1);
        }
    }, [action, user, config]);

    const handleSave = async () => {
        if (!amount || isNaN(amount) || amount <= 0) return alert('Valor inválido');
        if (!description.trim()) return alert('Descreva o motivo');
        setLoading(true);

        try {
            const value = parseFloat(amount);
            const userRef = doc(db, getCollectionPath('users'), user.uid);
            const transactionsRef = collection(db, getCollectionPath('transactions'));
            const batch = writeBatch(db);

            const newTrans = doc(transactionsRef);
            batch.set(newTrans, {
                userId: user.uid, type: action, amount: value, description: description, createdAt: serverTimestamp()
            });

            const currentBalance = parseFloat(user.balance || 0);
            const currentFines = parseInt(user.fines || 0);

            if (action === 'fine') {
                batch.update(userRef, { 
                    balance: currentBalance + value,
                    fines: currentFines + 1 
                });
            } else {
                const newBalance = Math.max(0, currentBalance - value);
                const newFines = Math.max(0, currentFines - finesToClear); 
                batch.update(userRef, { balance: newBalance, fines: newFines });
            }

            await batch.commit();
            onClose();
        } catch (e) { alert('Erro: ' + e.message); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95 relative z-10">
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${action === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {action === 'fine' ? <MinusCircle /> : <CheckCircle />}
                    {action === 'fine' ? `Aplicar Multa: ${user.displayName}` : `Receber de: ${user.displayName}`}
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400">VALOR (R$)</label>
                        <input type="number" step="0.50" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1 text-lg font-bold" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    {action === 'payment' && (
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <label className="text-xs font-bold text-slate-400 block mb-2">QUITA QUANTAS INFRAÇÕES?</label>
                            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-1">
                                <button onClick={() => setFinesToClear(Math.max(0, finesToClear - 1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Minus className="w-4 h-4"/></button>
                                <span className="text-white font-bold">{finesToClear}</span>
                                <button onClick={() => setFinesToClear(finesToClear + 1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Plus className="w-4 h-4"/></button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 text-center">Reduz a contagem para liberar o jogador.</p>
                        </div>
                    )}
                    <div><label className="text-xs font-bold text-slate-400">MOTIVO / DESCRIÇÃO</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1" value={description} onChange={e => setDescription(e.target.value)} /></div>
                    <button onClick={handleSave} disabled={loading} className={`w-full text-white font-bold py-3 rounded-xl shadow-lg ${action === 'fine' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{loading ? 'Salvando...' : 'Confirmar'}</button>
                    <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const FinesScreen = ({ users, isAdmin, onOpenTransaction }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [showUserSelect, setShowUserSelect] = useState(false);

    const finesList = users.filter(u => u.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const totalDebt = finesList.reduce((acc, u) => acc + (u.balance || 0), 0);

    useEffect(() => {
        if (!selectedUser) return;
        const q = query(collection(db, getCollectionPath('transactions')), where('userId', '==', selectedUser.uid), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => { setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
        return () => unsub();
    }, [selectedUser]);

    return (
        <div className="space-y-6 pb-20 relative z-10">
            {showUserSelect && (<UserSelectModal users={users} onClose={() => setShowUserSelect(false)} onSelect={(user) => { setShowUserSelect(false); onOpenTransaction(user, 'fine'); }} />)}
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Banknote className="text-red-400" /> Financeiro</h2>{isAdmin && (<button onClick={() => setShowUserSelect(true)} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-lg"><PlusCircle className="w-3 h-3" /> Aplicar Multa</button>)}</div>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-lg"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total a Receber</span><div className="text-4xl font-bold text-emerald-400 mt-2">R$ {totalDebt.toFixed(2).replace('.', ',')}</div></div>
            {selectedUser && (<div className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden animate-in slide-in-from-bottom-5"><div className="bg-slate-700 p-3 flex justify-between items-center cursor-pointer" onClick={() => setSelectedUser(null)}><span className="font-bold text-white flex items-center gap-2"><Receipt className="w-4 h-4" /> Extrato: {selectedUser.displayName}</span><ChevronUp className="w-4 h-4 text-slate-300" /></div><div className="p-3 max-h-60 overflow-y-auto space-y-2">{transactions.length === 0 ? <p className="text-center text-slate-500 text-xs">Sem histórico.</p> : transactions.map(t => (<div key={t.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 last:border-0"><div><span className={`font-bold block ${t.type === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>{t.type === 'fine' ? 'Multa' : 'Pagamento'}</span><span className="text-xs text-slate-400">{t.description}</span><span className="text-[10px] text-slate-500 block">{t.createdAt?.toDate().toLocaleDateString()}</span></div><span className={`font-bold ${t.type === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>{t.type === 'fine' ? '+' : '-'} R$ {t.amount.toFixed(2)}</span></div>))}</div></div>)}
            <div className="space-y-3">{finesList.length === 0 ? (<div className="text-center text-slate-500 py-10">Ninguém deve nada! 🙌</div>) : (finesList.map(user => (<div key={user.uid} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between shadow-sm"><div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(selectedUser?.uid === user.uid ? null : user)}><AvatarDisplay avatar={user.avatar} size="sm" /><div><div className="flex items-center gap-2"><span className="font-bold text-white">{user.displayName}</span>{isPlayerBanned(user) && <span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse">BANIDO</span>}</div><div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">{user.fines} infrações <ChevronDown className="w-3 h-3" /></div></div></div><div className="flex flex-col items-end gap-1"><span className="text-lg font-bold text-red-400">R$ {(user.balance || 0).toFixed(2).replace('.', ',')}</span>{isAdmin && (<div className="flex gap-2 mt-1"><button onClick={() => onOpenTransaction(user, 'payment')} className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-800 hover:bg-emerald-900/50 font-bold">PAGAR</button><button onClick={() => onOpenTransaction(user, 'fine')} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800 hover:bg-red-900/50 font-bold">+ MULTA</button></div>)}</div></div>)))}</div>
        </div>
    );
};

// --- CONFIGURAÇÃO DAS MEDALHAS ---
const BADGES_CONFIG = {
    'vip':        { emoji: '💼', title: 'Sócio',       desc: 'Dono da raquete (VIP)', color: 'text-amber-400' },
    'natal':      { emoji: '🎅', title: 'Natalino',    desc: 'Jogou em Dezembro', color: 'text-red-400' },
    'invicto':    { emoji: '🛡️', title: 'Invicto',     desc: 'Sem derrotas (min 5 jogos)', color: 'text-blue-400' }, // Dificuldade aumentada
    'veterano':   { emoji: '🎖️', title: 'Veterano',    desc: '50+ partidas jogadas', color: 'text-slate-300' },       // Dificuldade aumentada (era 10)
    'artilheiro': { emoji: '⚽', title: 'Artilheiro',  desc: '200+ pontos marcados', color: 'text-emerald-400' },     // Dificuldade aumentada (era 50)
    'paredao':    { emoji: '🧱', title: 'Paredão',     desc: 'Saldo de pontos > 50', color: 'text-orange-400' },      // Dificuldade aumentada (era 20)
    'zica':       { emoji: '👻', title: 'Azarado',      desc: 'Só derrotas (min 5 jogos)', color: 'text-purple-400' }  // Dificuldade aumentada
};

// Função auxiliar para calcular medalhas (centralizada)
const calculateBadges = (player) => {
    const active = [];
    if (player.isOwner) active.push('vip');
    if (new Date().getMonth() === 11) active.push('natal');
    
    // NOVOS CRITÉRIOS DE DIFICULDADE
    if (player.wins > 0 && player.losses === 0 && player.games >= 5) active.push('invicto'); // Mínimo 5 jogos
    if (player.games >= 50) active.push('veterano');       // Exige fidelidade!
    if (player.pointsScored >= 200) active.push('artilheiro'); // Exige muito ponto
    if (player.pointDiff >= 50) active.push('paredao');    // Exige dominar os jogos
    if (player.wins === 0 && player.losses >= 5) active.push('zica'); // Zica braba

    return active;
};

// --- RANKING LIST ---
const RankingList = ({ matches, users, period, onSelectPlayer, config }) => {
  const ranking = useMemo(() => {
    const stats = {};
    const nameToUid = {}; 

    // Inicializa estatísticas zeradas
    users.forEach(u => { 
        stats[u.uid] = { 
            ...u, 
            wins: 0, losses: 0, games: 0, 
            pointsScored: 0, pointsConceded: 0, pointDiff: 0,
            chilenasGiven: 0, chilenasReceived: 0   
        };
        if (u.displayName) nameToUid[u.displayName.toLowerCase().trim()] = u.uid;
    });
    
    // Função Auxiliar para Processar Resultado
    const processResult = (playerId, isWinner, sPro, sCon, isChilena) => {
        if (!playerId) return;
        
        // Tenta achar pelo ID, se não, tenta recuperar pelo nome (para convidados antigos ou bugs)
        let finalId = playerId;
        // Se não tem stats para esse ID, talvez seja um nome? (Fallback)
        if (!stats[finalId] && nameToUid[finalId.toLowerCase?.()]) {
            finalId = nameToUid[finalId.toLowerCase()];
        }

        if (stats[finalId]) {
            stats[finalId].games++;
            stats[finalId].pointsScored += sPro;
            stats[finalId].pointsConceded += sCon;
            stats[finalId].pointDiff += (sPro - sCon);
            
            if (isWinner) {
                stats[finalId].wins++;
                if (isChilena) stats[finalId].chilenasGiven++;
            } else {
                stats[finalId].losses++;
                if (isChilena) stats[finalId].chilenasReceived++;
            }
        }
    };

    matches.forEach(m => {
      const isConfirmed = m.status === 'confirmed' || m.status === undefined || m.status === null;
      if (!isConfirmed) return; 

      if (period !== 'all') {
          // CORREÇÃO OFFLINE: Usa data atual se estiver pendente
          const matchDate = m.createdAt ? m.createdAt.toDate() : new Date();
          if (!dateFilters[period](matchDate)) return; 
      }

      const s1 = Number(m.s1 || 0);
      const s2 = Number(m.s2 || 0);
      const p1Won = s1 > s2;

      // Processa Time 1 (J1 + Parceiro)
      processResult(m.p1Id, p1Won, s1, s2, m.isChilena);
      if (m.p1PartnerId) processResult(m.p1PartnerId, p1Won, s1, s2, m.isChilena);

      // Processa Time 2 (J2 + Parceiro)
      processResult(m.p2Id, !p1Won, s2, s1, m.isChilena);
      if (m.p2PartnerId) processResult(m.p2PartnerId, !p1Won, s2, s1, m.isChilena);
    });
    
    return Object.values(stats).filter(p => p.games > 0 || p.fines > 0).sort((a, b) => {
      const scoreA = a.wins - a.losses;
      const scoreB = b.wins - b.losses;
      if (scoreB !== scoreA) return scoreB - scoreA;
      if (b.wins !== a.wins) return b.wins - a.wins; 
      return b.pointDiff - a.pointDiff; 
    });
  }, [matches, users, period]);

  if (ranking.length === 0) return <div className="text-center p-8 text-slate-500"><Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>Nenhum registro.</p></div>;

  const isChristmas = new Date().getMonth() === 11;

  return (
    <div className="space-y-3 relative z-10">
      {ranking.map((player, index) => {
        const isBanned = isPlayerBanned(player, config);
        const netScore = player.wins - player.losses;
        const isTop1 = index === 0 && !isBanned && isChristmas;
        const badges = calculateBadges(player);

        return (
          <div 
            key={player.uid} 
            onClick={() => onSelectPlayer(player)} 
            className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-colors hover:bg-slate-700/50 shadow-sm 
                ${isTop1 ? 'border-transparent' : (isBanned ? 'bg-red-900/20 border-red-800' : 'bg-slate-800 border-slate-700')}
            `}
            style={isTop1 ? {
                backgroundImage: 'linear-gradient(#1e293b, #1e293b), linear-gradient(45deg, #ef4444 25%, #ffffff 25%, #ffffff 50%, #ef4444 50%, #ef4444 75%, #ffffff 75%, #ffffff)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                border: '3px solid transparent',
                backgroundSize: '20px 20px'
            } : {}}
          >
            <div className="flex-shrink-0 w-8 text-center font-bold text-slate-400 text-xl">#{index + 1}</div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <AvatarDisplay avatar={player.avatar} size="sm" />
                <h3 className={`font-bold text-lg ${isBanned ? 'text-red-400' : 'text-white'}`}>{player.displayName}</h3>
                {player.isOwner && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Dono</span>}
              </div>
              
              {badges.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                      {badges.slice(0, 4).map(b => (
                          <span 
                            key={b} 
                            onClick={(e) => { e.stopPropagation(); alert(`${BADGES_CONFIG[b].emoji} ${BADGES_CONFIG[b].title}:\n${BADGES_CONFIG[b].desc}`); }}
                            className="text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-600/50 cursor-help hover:scale-110 transition-transform" 
                          >
                              {BADGES_CONFIG[b].emoji}
                          </span>
                      ))}
                      {badges.length > 4 && <span className="text-[9px] text-slate-500 flex items-center bg-slate-900/50 px-1 rounded">+{badges.length - 4}</span>}
                  </div>
              )}

              <p className="text-sm text-slate-400 mt-1">{player.wins}V • {player.losses}D <span className="text-xs text-slate-500">({player.games} jogos)</span></p>
            </div>
            <div className="text-right">
                <span className={`block text-xl font-bold ${netScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {netScore > 0 ? '+' : ''}{netScore}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Pontos</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- NEW MATCH (COM RIVALIDADE ATUALIZADA) ---
// --- NEW MATCH (ATUALIZADO PARA SALVAR VITÓRIA SIMPLES) ---
// --- NEW MATCH (LAYOUT CORRIGIDO E RENOMEADO) ---
// --- NEW MATCH (COM MODO DUPLA + REI DA MESA + PLACAR OPCIONAL) ---
// --- NEW MATCH (LAYOUT FINAL: ABAS DE MODO + LABELS DINÂMICOS) ---
const NewMatch = ({ users, matches, currentUser, isAdmin, onClose, onSuccess, config }) => {
  // Buscas
  const [p1Search, setP1Search] = useState('');
  const [p1PartnerSearch, setP1PartnerSearch] = useState('');
  const [p2Search, setP2Search] = useState('');
  const [p2PartnerSearch, setP2PartnerSearch] = useState('');
  
  // Estados dos Jogadores
  const [selectedP1, setSelectedP1] = useState(users.find(u => u.uid === currentUser.uid));
  const [selectedP1Partner, setSelectedP1Partner] = useState(null);
  const [selectedP2, setSelectedP2] = useState(null);
  const [selectedP2Partner, setSelectedP2Partner] = useState(null);
  
  // Estados de Convidado
  const [isGuestP1, setIsGuestP1] = useState(false);
  const [guestNameP1, setGuestNameP1] = useState('');
  const [isGuestP2, setIsGuestP2] = useState(false);
  const [guestNameP2, setGuestNameP2] = useState('');

  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modos de Jogo
  const [isChilenaMode, setIsChilenaMode] = useState(false);
  const [isKingMode, setIsKingMode] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);

  const [currentSeasonId] = useState(() => new Date().toISOString().slice(0, 7));

  const hasScore = score1 !== '' && score2 !== '';

  // --- LÓGICA DE RIVALIDADE ---
  const rivalryStats = useMemo(() => {
    if (isDoubles || !selectedP1 || !selectedP2 || isGuestP1 || isGuestP2) return null;
    
    const history = matches.filter(m => 
        !m.isDoubles && 
        ((m.p1Id === selectedP1.uid && m.p2Id === selectedP2.uid) ||
        (m.p1Id === selectedP2.uid && m.p2Id === selectedP1.uid))
    );

    let wins1 = 0;
    let wins2 = 0;

    history.forEach(m => {
        if (m.status !== 'confirmed') return;
        const p1IsP1InMatch = m.p1Id === selectedP1.uid;
        const s1 = p1IsP1InMatch ? m.s1 : m.s2;
        const s2 = p1IsP1InMatch ? m.s2 : m.s1;

        if (s1 > s2) wins1++;
        else if (s2 > s1) wins2++;
    });

    let statusLabel = "⚖️ Clássico Equilibrado";
    let statusColor = "text-slate-400";
    
    const diff = wins1 - wins2;
    const total = wins1 + wins2;

    if (total < 3) {
        statusLabel = "🔥 Começando a rivalidade...";
    } else if (diff >= 3) {
        statusLabel = `☠️ ${selectedP1.displayName} é o Carrasco!`;
        statusColor = "text-emerald-400";
    } else if (diff <= -3) {
        statusLabel = `🦆 ${selectedP1.displayName} é Freguês!`;
        statusColor = "text-amber-400"; 
    }

    return { wins1, wins2, total, statusLabel, statusColor };
  }, [selectedP1, selectedP2, matches, isGuestP1, isGuestP2, isDoubles]);

  const getAvailableUsers = (search, ...excludedUids) => {
      const excluded = excludedUids.filter(id => id); 
      return users.filter(u => 
          !excluded.includes(u.uid) && 
          u.displayName.toLowerCase().includes(search.toLowerCase())
      );
  };

  // --- EFEITOS ---
  const triggerWinConfetti = () => {
      const colors = ['#10b981', '#3b82f6', '#f59e0b']; 
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: colors, zIndex: 9999 });
  };

  const triggerChilenaEffect = () => {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      const random = (min, max) => Math.random() * (max - min) + min;
      const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#ef4444', '#f97316', '#eab308'] });
          confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#ef4444', '#f97316', '#eab308'] });
      }, 250);
  };

  const UserOption = ({ user, onClick }) => (
      <button type="button" onClick={onClick} className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3"><AvatarDisplay avatar={user.avatar} size="sm" /><div><span className="block font-bold">{user.displayName}</span><span className="text-[10px] text-slate-400">{user.isOffline ? 'Sem Conta' : user.email}</span></div></div>
        {isPlayerBanned(user, config) && <span className="text-xs text-red-400 border border-red-500/30 px-1 rounded">Suspenso</span>}
      </button>
  );

  const handleSubmit = async (winType) => {
    if (!isGuestP1 && !selectedP1) return;
    if (!isGuestP2 && !selectedP2) return;
    if (isDoubles && (!selectedP1Partner || !selectedP2Partner)) return alert("Selecione as duplas completas!");

    setLoading(true);
    try {
      const matchData = { 
          createdAt: serverTimestamp(), 
          createdBy: currentUser.uid, 
          seasonId: currentSeasonId,
          isChilena: false,
          isSimpleWin: false,
          isDoubles: isDoubles
      };

      if (isGuestP1) { matchData.p1Name = guestNameP1 || 'Convidado 1'; matchData.p1Id = 'guest_' + Date.now() + '_1'; } 
      else { matchData.p1Name = selectedP1.displayName; matchData.p1Id = selectedP1.uid; }
      
      if (isDoubles && selectedP1Partner) {
          matchData.p1PartnerName = selectedP1Partner.displayName;
          matchData.p1PartnerId = selectedP1Partner.uid;
      }

      if (isGuestP2) { matchData.p2Name = guestNameP2 || 'Convidado 2'; matchData.p2Id = 'guest_' + Date.now() + '_2'; } 
      else { matchData.p2Name = selectedP2.displayName; matchData.p2Id = selectedP2.uid; }

      if (isDoubles && selectedP2Partner) {
          matchData.p2PartnerName = selectedP2Partner.displayName;
          matchData.p2PartnerId = selectedP2Partner.uid;
      }

      let s1Final = 0, s2Final = 0;

      if (winType === 'score') {
          if (!score1 || !score2) return;
          s1Final = parseInt(score1);
          s2Final = parseInt(score2);
      } else if (winType === 'p1_chilena') {
          s1Final = 7; s2Final = 0; matchData.isChilena = true;
      } else if (winType === 'p2_chilena') {
          s1Final = 0; s2Final = 7; matchData.isChilena = true;
      } else if (winType === 'p1_simple') {
          s1Final = 1; s2Final = 0; matchData.isSimpleWin = true; 
      } else if (winType === 'p2_simple') {
          s1Final = 0; s2Final = 1; matchData.isSimpleWin = true; 
      }

      matchData.s1 = s1Final;
      matchData.s2 = s2Final;

      let newStatus = 'pending_user';
      let confBy = null;
      let confAt = null;

      if (isAdmin) {
          newStatus = 'confirmed'; confBy = 'admin_scribe'; confAt = serverTimestamp();
      } else {
          newStatus = 'pending_guest'; 
      }

      matchData.status = newStatus;
      if(confBy) matchData.confirmedBy = confBy;
      if(confAt) matchData.confirmedAt = confAt;
      
      const docRef = await addDoc(collection(db, getCollectionPath('matches')), matchData);
      
      if (matchData.isChilena) triggerChilenaEffect();
      else triggerWinConfetti();

      if (isKingMode && newStatus === 'confirmed') {
          const p1Won = s1Final > s2Final;

          if (!p1Won) {
              if (isGuestP2) {
                  setIsGuestP1(true);
                  setGuestNameP1(guestNameP2);
                  setSelectedP1(null);
                  setSelectedP1Partner(null);
              } else {
                  setIsGuestP1(false);
                  setSelectedP1(selectedP2);
                  if (isDoubles) setSelectedP1Partner(selectedP2Partner);
              }
          }

          setIsGuestP2(false);
          setGuestNameP2('');
          setSelectedP2(null);
          setSelectedP2Partner(null);
          setScore1('');
          setScore2('');
          setLoading(false);
          
          alert('👑 Vencedores continuam! Quem são os próximos desafiantes?');
      } else {
          onSuccess(docRef.id, matchData.status);
      }

    } catch (err) { alert('Erro: ' + err.message); setLoading(false); }
  };

  const isAutoConfirmButton = isAdmin;

  const renderPartnerInput = (label, selected, setSelected, search, setSearch, ...excludes) => (
      <div className="relative mt-2 pl-4 border-l-2 border-slate-700 animate-in slide-in-from-top-2">
          <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">{label}</label>
          {!selected ? (
              <div className="relative">
                  <input type="text" placeholder="Buscar parceiro..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                  {search && <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-20 max-h-40 overflow-y-auto shadow-xl">
                      {getAvailableUsers(search, ...excludes).map(u => <UserOption key={u.uid} user={u} onClick={() => { setSelected(u); setSearch(''); }} />)}
                  </div>}
              </div>
          ) : (
              <div className="bg-slate-800/50 p-2 rounded-lg flex items-center justify-between border border-slate-600/50">
                  <div className="flex items-center gap-2"><AvatarDisplay avatar={selected.avatar} size="xs" /><span className="font-bold text-sm text-white">{selected.displayName}</span></div>
                  <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-white"><XCircle className="w-4 h-4" /></button>
              </div>
          )}
      </div>
  );

  return (
    <div className="space-y-6 relative z-10 pt-4">
      {/* CABEÇALHO */}
      <div className="text-center pb-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2"><PlusCircle className="text-emerald-400" /> Registrar</h2>
      </div>

      {/* --- SELETOR DE MODO (ABAS) --- */}
      <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-700">
          <button 
            onClick={() => { setIsDoubles(false); setSelectedP1Partner(null); setSelectedP2Partner(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${!isDoubles ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
              👤 Solo (1x1)
          </button>
          <button 
            onClick={() => setIsDoubles(true)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDoubles ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
              👥 Dupla (2x2)
          </button>
      </div>
      
      {/* --- TIME/JOGADOR 1 --- */}
      <div className="space-y-1">
        {/* MUDANÇA: LABEL DINÂMICA (TIME OU JOGADOR) */}
        <label className="text-slate-400 text-xs font-bold ml-1 flex justify-between">
            {isDoubles ? 'TIME 1' : 'JOGADOR 1'} 
            {isKingMode && <span className="text-indigo-400 text-[10px]">(Vencedores)</span>}
        </label>
        
        {!selectedP1 && !isGuestP1 ? (
          <div className="relative">
            <input type="text" placeholder={isDoubles ? "Buscar Capitão..." : "Buscar Jogador..."} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" value={p1Search} onChange={(e) => setP1Search(e.target.value)} />
            {p1Search && <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-20 max-h-64 overflow-y-auto shadow-xl">
                {getAvailableUsers(p1Search, selectedP2?.uid, selectedP2Partner?.uid).map(u => <UserOption key={u.uid} user={u} onClick={() => { setSelectedP1(u); setP1Search(''); }} />)}
                <button type="button" onClick={() => setIsGuestP1(true)} className="w-full text-left px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-emerald-400 font-medium">+ Convidado</button>
            </div>}
          </div>
        ) : (
            isGuestP1 ? (
                <div className="bg-slate-800 p-3 rounded-lg space-y-2 border border-amber-500/30">
                    <div className="flex justify-between items-center"><span className="text-sm text-amber-400 font-bold">Convidado</span><button onClick={() => setIsGuestP1(false)} className="text-xs text-slate-400 underline">Trocar</button></div>
                    <input type="text" placeholder="Nome..." className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={guestNameP1} onChange={(e) => setGuestNameP1(e.target.value)} />
                </div>
            ) : (
                <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between border border-slate-600">
                    <div className="flex items-center gap-2"><AvatarDisplay avatar={selectedP1.avatar} size="sm" /><span className="font-bold text-white">{selectedP1.displayName}</span></div>
                    <button onClick={() => { setSelectedP1(null); setSelectedP1Partner(null); }} className="text-xs text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
            )
        )}
        
        {/* PARCEIRO TIME 1 (Só aparece se modo dupla estiver ON) */}
        {isDoubles && !isGuestP1 && selectedP1 && renderPartnerInput('Parceiro Time 1', selectedP1Partner, setSelectedP1Partner, p1PartnerSearch, setP1PartnerSearch, selectedP1?.uid, selectedP2?.uid, selectedP2Partner?.uid)}
      </div>

      {/* --- TIME/JOGADOR 2 --- */}
      <div className="space-y-1 mt-4">
        {/* MUDANÇA: LABEL DINÂMICA */}
        <label className="text-slate-400 text-xs font-bold ml-1 flex justify-between">
            {isDoubles ? 'TIME 2' : 'JOGADOR 2'}
            {isKingMode && <span className="text-indigo-400 text-[10px]">(Desafiantes)</span>}
        </label>

        {!selectedP2 && !isGuestP2 ? (
          <div className="relative">
            <input type="text" placeholder={isDoubles ? "Buscar Capitão..." : "Buscar Jogador..."} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" value={p2Search} onChange={(e) => setP2Search(e.target.value)} />
            {p2Search && <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-20 max-h-64 overflow-y-auto shadow-xl">
                {getAvailableUsers(p2Search, selectedP1?.uid, selectedP1Partner?.uid, selectedP2Partner?.uid).map(u => <UserOption key={u.uid} user={u} onClick={() => { setSelectedP2(u); setP2Search(''); }} />)}
                <button type="button" onClick={() => setIsGuestP2(true)} className="w-full text-left px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-emerald-400 font-medium">+ Convidado</button>
            </div>}
          </div>
        ) : (
            isGuestP2 ? (
                <div className="bg-slate-800 p-3 rounded-lg space-y-2 border border-amber-500/30">
                    <div className="flex justify-between items-center"><span className="text-sm text-amber-400 font-bold">Convidado</span><button onClick={() => setIsGuestP2(false)} className="text-xs text-slate-400 underline">Trocar</button></div>
                    <input type="text" placeholder="Nome..." className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={guestNameP2} onChange={(e) => setGuestNameP2(e.target.value)} />
                </div>
            ) : (
                <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between border border-emerald-500/30">
                    <div className="flex items-center gap-2"><AvatarDisplay avatar={selectedP2.avatar} size="sm" /><span className="font-bold text-emerald-400">{selectedP2.displayName}</span></div>
                    <button onClick={() => { setSelectedP2(null); setSelectedP2Partner(null); }} className="text-xs text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
            )
        )}

        {/* PARCEIRO TIME 2 */}
        {isDoubles && !isGuestP2 && selectedP2 && renderPartnerInput('Parceiro Time 2', selectedP2Partner, setSelectedP2Partner, p2PartnerSearch, setP2PartnerSearch, selectedP1?.uid, selectedP1Partner?.uid, selectedP2?.uid)}
      </div>

      {/* RIVALIDADE (SÓ NO X1) */}
      {rivalryStats && (
        <div className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">
                <span>Histórico (Geral)</span>
                <span>{rivalryStats.total} Jogos</span>
            </div>
            <div className="flex items-center justify-between px-2">
                <div className="text-center">
                    <span className="block text-xl font-bold text-white">{rivalryStats.wins1}</span>
                    <span className="text-[10px] text-slate-500">Vitórias J1</span>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="text-center">
                     <span className={`text-xs font-bold ${rivalryStats.statusColor}`}>{rivalryStats.statusLabel}</span>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="text-center">
                    <span className="block text-xl font-bold text-emerald-400">{rivalryStats.wins2}</span>
                    <span className="text-[10px] text-slate-500">Vitórias J2</span>
                </div>
            </div>
        </div>
      )}

      {/* BOTÃO REI DA MESA */}
      <div className="flex justify-center">
        <button 
            type="button" 
            onClick={() => setIsKingMode(!isKingMode)} 
            className={`w-full text-xs font-bold py-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${isKingMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:bg-slate-800'}`}
        >
            {isKingMode ? '🔥 Vitórias Consecutivas: ATIVADO' : '🔄 Ativar Vitórias Consecutivas'}
        </button>
      </div>

      <div className="flex justify-end">
          <button type="button" onClick={() => setIsChilenaMode(!isChilenaMode)} className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border transition-all ${isChilenaMode ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              <Zap className="w-3 h-3" fill={isChilenaMode ? "currentColor" : "none"} /> Modo Chilena {isChilenaMode ? 'ATIVADO' : ''}
          </button>
      </div>

      {isChilenaMode ? (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => handleSubmit('p1_chilena')} disabled={loading} className="bg-slate-800 border-2 border-slate-600 hover:border-yellow-500 hover:bg-yellow-500/10 p-4 rounded-xl flex flex-col items-center gap-2 disabled:opacity-50">
                  <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" /><span className="text-xs font-bold text-yellow-100">{isDoubles ? 'Time 1' : 'J1'} Aplicou Chilena</span>
              </button>
              <button onClick={() => handleSubmit('p2_chilena')} disabled={loading} className="bg-slate-800 border-2 border-slate-600 hover:border-yellow-500 hover:bg-yellow-500/10 p-4 rounded-xl flex flex-col items-center gap-2 disabled:opacity-50">
                  <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" /><span className="text-xs font-bold text-yellow-100">{isDoubles ? 'Time 2' : 'J2'} Aplicou Chilena</span>
              </button>
          </div>
      ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center"><label className="block text-slate-400 text-xs mb-1">Placar {isDoubles ? 'Time 1' : 'J1'}</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-700" placeholder="-" value={score1} onChange={(e) => setScore1(e.target.value)} /></div>
                <div className="text-center"><label className="block text-slate-400 text-xs mb-1">Placar {isDoubles ? 'Time 2' : 'J2'}</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-700" placeholder="-" value={score2} onChange={(e) => setScore2(e.target.value)} /></div>
            </div>
            
            {/* BOTÕES DE CONFIRMAÇÃO INTELIGENTES */}
            {hasScore ? (
                <button 
                    onClick={() => handleSubmit('score')} 
                    // BLOQUEIA SE NÃO TIVER JOGADOR 2 SELECIONADO
                    disabled={loading || (!isGuestP1 && !selectedP1) || (!isGuestP2 && !selectedP2)} 
                    className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex justify-center items-center gap-2 animate-in zoom-in-95
                        ${(!isGuestP2 && !selectedP2) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : (isAdmin ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}
                    `}
                >
                    {loading ? '...' : (
                        (!isGuestP2 && !selectedP2) ? 'Selecione o Oponente...' : // AVISO VISUAL
                        (isAutoConfirmButton ? (isKingMode ? 'Registrar & Manter' : 'Registrar Placar') : 'Enviar Placar')
                    )}
                </button>
            ) : (
                <div className="mt-4">
                    <p className="text-center text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">
                        {(!isGuestP2 && !selectedP2) ? 'Selecione o oponente para continuar...' : 'Sem placar? Selecione o vencedor:'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleSubmit('p1_simple')}
                            disabled={loading || (!isGuestP2 && !selectedP2)} // BLOQUEIA
                            className="bg-slate-800 border border-slate-600 hover:bg-emerald-900/30 hover:border-emerald-500/50 p-3 rounded-xl flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="text-xl">🏆</span>
                            <span className="text-xs font-bold text-white line-clamp-1">{isDoubles ? 'TIME 1' : (selectedP1 ? selectedP1.displayName : (guestNameP1 || 'J1'))}</span>
                            <span className="text-[9px] text-emerald-400">VENCEU</span>
                        </button>

                        <button 
                            onClick={() => handleSubmit('p2_simple')}
                            disabled={loading || (!isGuestP2 && !selectedP2)} // BLOQUEIA
                            className="bg-slate-800 border border-slate-600 hover:bg-emerald-900/30 hover:border-emerald-500/50 p-3 rounded-xl flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="text-xl">🏆</span>
                            <span className="text-xs font-bold text-white line-clamp-1">{isDoubles ? 'TIME 2' : (selectedP2 ? selectedP2.displayName : (guestNameP2 || 'J2'))}</span>
                            <span className="text-[9px] text-emerald-400">VENCEU</span>
                        </button>
                    </div>
                </div>
            )}
          </>
      )}
    </div>
  );
};

const QrModal = ({ matchId, onClose }) => {
  const confirmationUrl = `${window.location.origin}${window.location.pathname}?confirmMatch=${matchId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(confirmationUrl)}&bgcolor=1e293b&color=34d399`;
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full text-center border border-slate-700 shadow-2xl animate-in zoom-in-95 relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Validação</h2>
            <p className="text-slate-400 mb-4 text-sm">Peça para o convidado escanear no celular <strong className="text-white">DELE</strong>.</p>
            <div className="bg-slate-900 p-4 rounded-xl inline-block border-2 border-emerald-500/30 shadow-lg mx-auto"><img src={qrCodeUrl} alt="QR Code" className="rounded-lg" /></div>
            <button onClick={onClose} className="block w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">Fechar</button>
        </div>
    </div>
  );
};

const ConfirmMatchScreen = ({ matchId, currentUser, onComplete }) => {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const docRef = doc(db, getCollectionPath('matches'), matchId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) { setStatus('error'); setLoading(false); return; }
        const data = snap.data();
        setMatch(data);
        if (data.status === 'confirmed') { setStatus('already_confirmed'); setLoading(false); return; }
        if (currentUser && data.createdBy === currentUser.uid) { setStatus('denied_creator'); setLoading(false); return; }
        setLoading(false);
      } catch (error) { setStatus('error'); setLoading(false); }
    };
    fetchMatch();
  }, [matchId, currentUser]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, getCollectionPath('matches'), matchId);
      await updateDoc(docRef, { status: 'confirmed', confirmedBy: currentUser ? currentUser.uid : 'guest_device', confirmedAt: serverTimestamp() });
      setStatus('success'); if (onComplete) setTimeout(onComplete, 2000);
    } catch (error) { alert('Erro ao confirmar'); } finally { setLoading(false); }
  };

  if (loading) return <div className="p-8 text-center text-white">Verificando...</div>;
  if (status === 'error') return <div className="p-8 text-center text-red-400 font-bold">Partida não encontrada</div>;
  if (status === 'denied_creator') return <div className="p-8 text-center text-amber-400 font-bold">Você não pode confirmar sua própria partida.</div>;
  if (status === 'already_confirmed' || status === 'success') return <div className="p-8 text-center text-emerald-400 font-bold">Partida Confirmada!</div>;

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-800 rounded-xl shadow-2xl m-4 border border-slate-700 relative z-10">
      <h2 className="text-xl font-bold text-white text-center mb-6">Confirmar Placar</h2>
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-xl mb-6">
        <div className="text-center"><span className="block text-2xl font-bold text-emerald-400">{match.s1}</span><span className="text-xs text-slate-400">{match.p1Name}</span></div>
        <span className="text-slate-600 font-bold">VS</span>
        <div className="text-center"><span className="block text-2xl font-bold text-white">{match.s2}</span><span className="text-xs text-slate-400">{match.p2Name}</span></div>
      </div>
      <button onClick={handleConfirm} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg">Confirmar</button>
    </div>
  );
};

const AdminPanel = ({ users, onOpenTransaction, config }) => { 
    const [newOfflineName, setNewOfflineName] = useState('');
    const [newOfflineEmail, setNewOfflineEmail] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [adminSearch, setAdminSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); 
    const [showSettings, setShowSettings] = useState(false);
    const [processing, setProcessing] = useState(false); 

    const handleUpdateUser = async (uid, data) => { try { await updateDoc(doc(db, getCollectionPath('users'), uid), data); } catch (e) { alert('Erro: ' + e.message); } };
    const handleDeleteOffline = async (uid) => { if(window.confirm('Tem certeza?')) await deleteDoc(doc(db, getCollectionPath('users'), uid)); };

    const addOfflinePlayer = async (e) => {
        e.preventDefault();
        if (!newOfflineName.trim()) return;
        try {
            const fakeUid = 'offline_' + Date.now();
            await setDoc(doc(db, getCollectionPath('users'), fakeUid), {
                uid: fakeUid, displayName: newOfflineName, email: newOfflineEmail.trim() || `offline_${Date.now()}@noemail.com`,
                isOwner: false, isOffline: true, fines: 0, balance: 0, role: 'user', avatar: getRandomAvatar(), createdAt: serverTimestamp()
            });
            setNewOfflineName(''); setNewOfflineEmail(''); alert('Jogador adicionado!');
        } catch (err) { alert('Erro: ' + err.message); }
    };

    const startEditing = (user) => { setEditingUserId(user.uid); setEditName(user.displayName); setEditEmail(user.email); };
    const cancelEditing = () => { setEditingUserId(null); setEditName(''); setEditEmail(''); };
    const saveEdit = async (uid) => { if(!editName.trim() || !editEmail.trim()) return alert('Preencha os campos!'); await handleUpdateUser(uid, { displayName: editName, email: editEmail.trim() }); setEditingUserId(null); };

    // --- FUNÇÃO PARA ZERAR (DESFAZER O RESGATE) ---
    const handleResetSeason = async () => {
        if (!confirm("⚠️ TEM CERTEZA? Isso vai remover TODAS as partidas do ranking atual e jogá-las para o Arquivo Morto. O ranking ficará zerado.")) return;
        
        setProcessing(true);
        try {
            const currentSeasonTag = new Date().toISOString().slice(0, 7); 

            const q = query(
                collection(db, getCollectionPath('matches')), 
                where('seasonId', '==', currentSeasonTag)
            );
            
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            let count = 0;

            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { seasonId: deleteField() });
                count++;
            });

            if (count > 0) {
                await batch.commit();
                alert(`Pronto! ${count} partidas foram removidas da temporada atual. O ranking foi zerado.`);
            } else {
                alert("O ranking já está vazio! Nenhuma partida encontrada nesta temporada.");
            }
        } catch (e) {
            alert("Erro ao zerar: " + e.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const term = adminSearch.toLowerCase();
        const matchesSearch = user.displayName.toLowerCase().includes(term) || (user.email && user.email.toLowerCase().includes(term));
        if (!matchesSearch) return false;
        if (filterType === 'debtors') return user.balance > 0;
        if (filterType === 'banned') return isPlayerBanned(user, config); 
        if (filterType === 'offline') return user.isOffline;
        return true;
    });

    return (
        <div className="space-y-6 relative z-10">
            {showSettings && <SettingsModal config={config} onClose={() => setShowSettings(false)} />}
            
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Gavel className="text-amber-400" /> Painel do Juiz</h2>
                <button onClick={() => setShowSettings(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-600 shadow-sm">
                    <Edit2 className="w-4 h-4" /> Regras
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="text-red-400 font-bold text-sm flex items-center gap-2"><Trash2 className="w-4 h-4"/> Zerar Ranking Atual</h4>
                        <p className="text-slate-400 text-[10px]">Move os jogos atuais para o Arquivo Morto.</p>
                    </div>
                    <button onClick={handleResetSeason} disabled={processing} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg">{processing ? 'Zerando...' : 'ZERAR TUDO'}</button>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Cadastrar Sem Conta</h3>
                    <form onSubmit={addOfflinePlayer} className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="Nome..." className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newOfflineName} onChange={(e) => setNewOfflineName(e.target.value)} required />
                            <input type="email" placeholder="E-mail real (opcional)" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newOfflineEmail} onChange={(e) => setNewOfflineEmail(e.target.value)} />
                        </div>
                        <button className="bg-slate-700 text-white px-3 py-2 rounded text-xs font-bold w-full hover:bg-slate-600 transition-colors">Adicionar & Reservar E-mail</button>
                    </form>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-emerald-500 outline-none placeholder-slate-500" placeholder="Buscar..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                </div>
                <select className="w-full sm:w-auto bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-emerald-500 cursor-pointer" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="all">Todos ({users.length})</option>
                    <option value="debtors">Devedores 💸</option>
                    <option value="banned">Banidos 🚫</option>
                    <option value="offline">Offline 🤖</option>
                </select>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold ml-1 mb-2">Exibindo {filteredUsers.length} jogadores</p>
                {filteredUsers.length === 0 ? (<div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">Ninguém encontrado com esses filtros.</div>) : (
                    filteredUsers.map(user => (
                        <div key={user.uid} className={`p-4 rounded-lg border flex flex-col gap-3 ${user.isOffline ? 'bg-slate-800/50 border-slate-700 border-dashed' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    {editingUserId === user.uid ? (
                                        <div className="flex flex-col gap-2 mb-2">
                                            <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={editName} onChange={e => setEditName(e.target.value)} />
                                            <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                                            <div className="flex gap-2"><button onClick={() => saveEdit(user.uid)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">Salvar</button><button onClick={cancelEditing} className="bg-slate-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">Cancelar</button></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-bold text-white flex items-center gap-2">
                                                <AvatarDisplay avatar={user.avatar} size="sm" />
                                                {user.displayName}
                                                {user.isOffline && <span className="text-[10px] bg-slate-600 px-1 rounded text-slate-300">OFFLINE</span>}
                                                {user.isOffline && (<button onClick={() => startEditing(user)} className="text-slate-500 hover:text-white p-1"><Edit2 className="w-3 h-3" /></button>)}
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">{user.email}{user.isOffline && user.email.includes('@') && !user.email.includes('noemail.com') && <span className="text-emerald-500">(VINCULADO)</span>}</p>
                                        </>
                                    )}
                                    <div className="flex gap-2 mt-1">{user.isOwner ? <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">DONO</span> : <span className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">JOGADOR</span>}</div>
                                </div>
                                <div className="text-center"><span className={`block text-xl font-bold ${user.fines > 0 ? 'text-red-400' : 'text-slate-600'}`}>{user.fines || 0}</span><span className="text-[10px] text-slate-500">MULTAS</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2"><button onClick={() => handleUpdateUser(user.uid, { isOwner: !user.isOwner })} className="text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">{user.isOwner ? 'Remover Dono' : 'Tornar Dono'}</button>{user.isOffline && <button onClick={() => handleDeleteOffline(user.uid)} className="text-xs bg-red-900/20 text-red-400 hover:bg-red-900/40 py-2 rounded flex justify-center items-center gap-1"><Trash2 className="w-3 h-3" /> Apagar</button>}</div>
                            <div className="grid grid-cols-2 gap-2"><button onClick={() => onOpenTransaction(user, 'fine')} className="text-xs border border-red-500/50 text-red-400 hover:bg-red-900/20 py-2 rounded flex items-center justify-center gap-1 font-bold">+ Multa</button><button onClick={() => onOpenTransaction(user, 'payment')} className="text-xs bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 py-2 rounded font-bold border border-emerald-800">Pagar</button></div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); 
  const [usersList, setUsersList] = useState([]);
  const [matchesList, setMatchesList] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('all');
  const [pendingConfirmationMatchId, setPendingConfirmationMatchId] = useState(null);
  const [confirmMatchId, setConfirmMatchId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [transactionModal, setTransactionModal] = useState(null); 
  const [selectedPlayerStats, setSelectedPlayerStats] = useState(null);

  // --- CONTROLE DE TEMPORADAS ---
  const [currentSeason, setCurrentSeason] = useState(getCurrentSeasonId()); // Padrão: Mês Atual

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, getCollectionPath('settings'), 'global'), (doc) => {
        if (doc.exists()) {
            setConfig(prev => ({ ...prev, ...doc.data() })); 
        }
    });
    return () => unsubConfig();
  }, []);

  // --- CARREGAMENTO DE DADOS (COM FILTRO DE TEMPORADA) ---
  // --- CARREGAMENTO DE DADOS BLINDADO (SUBSTITUA O SEU POR ESTE) ---
  useEffect(() => {
    // 1. Carrega Usuários (Global)
    const unsubUsers = onSnapshot(query(collection(db, getCollectionPath('users'))), (snap) => {
      const list = []; 
      snap.forEach(doc => list.push(doc.data())); 
      setUsersList(list);
    });

    // 2. Carrega Partidas da Temporada Selecionada
    let q;
    const matchesRef = collection(db, getCollectionPath('matches'));

    if (currentSeason === 'legacy') {
        q = matchesRef; 
    } else {
        q = query(matchesRef, where('seasonId', '==', currentSeason));
    }

    const unsubMatches = onSnapshot(q, (snap) => {
      const list = []; 
      snap.forEach(doc => {
          const data = doc.data();
          // Filtro extra no lado do cliente para o Legado
          if (currentSeason === 'legacy') {
              if (!data.seasonId) list.push({ id: doc.id, ...data });
          } else {
              list.push({ id: doc.id, ...data });
          }
      });
      
      // --- CORREÇÃO AQUI: ORDENAÇÃO SEGURA ---
      // Se estiver offline (createdAt é null), usa a hora atual (Date.now())
      list.sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.toDate().getTime() : Date.now();
          const dateB = b.createdAt ? b.createdAt.toDate().getTime() : Date.now();
          return dateB - dateA;
      });
      
      setMatchesList(list);
    });

    return () => { unsubUsers(); unsubMatches(); };
  }, [currentSeason]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('confirmMatch');
    if (matchId) setConfirmMatchId(matchId);

    const unsubscribe = onAuthStateChanged(auth, (u) => { 
        setUser(u); 
        setLoading(false); 
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !matchesList.length) return;
    const pending = matchesList.filter(m => m.status === 'pending_user' && m.p2Id === user.uid);
    setNotifications(pending);
  }, [matchesList, user]);

  const clearUrl = () => { window.history.pushState({}, document.title, window.location.pathname); setConfirmMatchId(null); };
  const handleDeleteMatch = async (matchId) => { if(confirm('Tem certeza?')) await deleteDoc(doc(db, getCollectionPath('matches'), matchId)); };
  const handleForceConfirm = async (matchId) => { if(confirm('Juiz: Validar na força?')) await updateDoc(doc(db, getCollectionPath('matches'), matchId), { status: 'confirmed', confirmedBy: 'admin_force', confirmedAt: serverTimestamp() }); };
  const handleP2Confirm = async (matchId) => { await updateDoc(doc(db, getCollectionPath('matches'), matchId), { status: 'confirmed', confirmedBy: user.uid, confirmedAt: serverTimestamp() }); alert('Jogo confirmado!'); };

  const openTransaction = (userTarget, action) => {
      setTransactionModal({ user: userTarget, action });
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400">Carregando...</div>;
  if (confirmMatchId) return <div className="min-h-screen bg-slate-900 text-slate-100 relative z-10"><ChristmasSnow /><ChristmasLights /><ConfirmMatchScreen matchId={confirmMatchId} currentUser={user} onComplete={clearUrl}/></div>;
   
  if (view === 'auth' && !user) {
      return <AuthScreen onCancel={() => setView('dashboard')} onLoginSuccess={() => setView('dashboard')} />;
  }

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const currentUserDoc = user ? usersList.find(u => u.uid === user.uid) : null;

  const filteredHistory = matchesList.filter(m => {
      // CORREÇÃO OFFLINE: Se não tiver createdAt, assume que é de hoje (new Date())
      const matchDate = m.createdAt ? m.createdAt.toDate() : new Date();
      
      const dateStr = matchDate.toLocaleDateString('en-CA'); 
      if (historyDate && dateStr !== historyDate) return false;
      
      if (historySearch) {
          const term = historySearch.toLowerCase();
          const p1 = m.p1Name ? m.p1Name.toLowerCase() : '';
          const p2 = m.p2Name ? m.p2Name.toLowerCase() : '';
          const p1Partner = m.p1PartnerName ? m.p1PartnerName.toLowerCase() : '';
          const p2Partner = m.p2PartnerName ? m.p2PartnerName.toLowerCase() : '';
          return p1.includes(term) || p2.includes(term) || p1Partner.includes(term) || p2Partner.includes(term);
      }
      return true;
  });

  const isChristmas = new Date().getMonth() === 11;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 md:pb-0 md:pl-20 relative overflow-x-hidden overflow-y-auto">
      <ChristmasSnow />
      <ChristmasLights />
      
      {pendingConfirmationMatchId && <QrModal matchId={pendingConfirmationMatchId} onClose={() => setPendingConfirmationMatchId(null)} />}
      {showProfile && user && <ProfileModal user={user} userDoc={currentUserDoc} onClose={() => setShowProfile(false)} />}
      {transactionModal && <TransactionModal user={transactionModal.user} action={transactionModal.action} onClose={() => setTransactionModal(null)} config={config} />}
      {selectedPlayerStats && <PlayerStatsModal player={selectedPlayerStats} onClose={() => setSelectedPlayerStats(null)} />}

      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-20 flex justify-between items-center md:hidden relative">
        <div className="flex items-center gap-2">
            <Trophy className={`w-6 h-6 ${isChristmas ? 'text-red-500' : 'text-emerald-400'}`} />
            {isChristmas ? (
                <span className="font-bold text-lg text-white flex items-center gap-1"><span className="text-red-500">Ping</span><span className="text-emerald-500">Pong</span><span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Master</span>🎅</span>
            ) : (
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Master</span>
            )}
        </div>
        <div className="flex gap-4">
            {user ? (
                <>
                    <button onClick={() => setShowProfile(true)} className="hover:scale-110 transition-transform"><AvatarDisplay avatar={currentUserDoc?.avatar} size="sm" /></button>
                    <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button>
                </>
            ) : (
                <button onClick={() => setView('auth')} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><LogIn className="w-3 h-3" /> Entrar</button>
            )}
        </div>
      </header>

      {notifications.length > 0 && <div className="bg-amber-600/90 backdrop-blur text-white p-3 sticky top-14 md:top-0 z-30 animate-in slide-in-from-top relative"><div className="max-w-2xl mx-auto flex justify-between items-center"><span className="text-sm font-medium">Você tem {notifications.length} partida(s) para confirmar!</span><button onClick={() => setConfirmMatchId(notifications[0].id)} className="bg-white text-amber-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Ver</button></div></div>}
      
      <main className="max-w-2xl mx-auto p-4 space-y-6 min-h-screen relative z-10">
        <div className="hidden md:flex justify-between items-center mb-8 pt-8">
            {isChristmas ? (
                <h1 className="text-3xl font-bold text-white flex items-center gap-2"><span className="text-red-500 drop-shadow-md">Ping</span><span className="text-emerald-500 drop-shadow-md">Pong</span><span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Master</span><span>🎅</span></h1>
            ) : (
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Ping Pong Master</h1>
            )}
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-700"><AvatarDisplay avatar={currentUserDoc?.avatar} size="sm" /><span className="font-bold text-sm">{currentUserDoc?.displayName}</span></button>
                        <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><LogOut className="w-4 h-4" /> Sair</button>
                    </>
                ) : (
                    <button onClick={() => setView('auth')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-500">Fazer Login</button>
                )}
            </div>
        </div>

        {view === 'dashboard' && (
            <>
                <SeasonSelector current={currentSeason} onChange={setCurrentSeason} />
                
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto mb-4">
                    {['day', 'week', 'month', 'all'].map((p) => (
                        <button 
                            key={p} 
                            onClick={() => setPeriod(p)} 
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === p ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Geral'}
                        </button>
                    ))}
                </div>

                <RankingList matches={matchesList} users={usersList} period={period} onSelectPlayer={setSelectedPlayerStats} config={config} />
                
                <button onClick={() => setView(user ? 'newMatch' : 'auth')} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-4 shadow-2xl shadow-emerald-500/30 transition-transform hover:scale-110 z-50 group">
                    <PlusCircle className="w-8 h-8" />
                </button>
            </>
        )}
        
        {view === 'newMatch' && user && (<div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-xl relative"><button onClick={() => setView('dashboard')} className="absolute top-4 right-4 text-slate-400 hover:text-white z-50"><XCircle /></button><NewMatch matches={matchesList} users={usersList} currentUser={user} isAdmin={isAdmin} onClose={() => setView('dashboard')} onSuccess={(id, status) => { if (status === 'pending_guest') setPendingConfirmationMatchId(id); else { setView('dashboard'); alert(status === 'confirmed' ? 'Partida registrada!' : 'Partida enviada para confirmação!'); } }} config={config} /></div>)}
        
        {view === 'history' && (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><History className="text-cyan-400" /> Histórico</h2>
                </div>
                
                <div className="flex gap-2 mb-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                        <input 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-emerald-500 outline-none placeholder-slate-500" 
                            placeholder="Buscar jogador..." 
                            value={historySearch} 
                            onChange={e => setHistorySearch(e.target.value)} 
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none"/>
                        <input 
                            type="date" 
                            className="bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-emerald-500 outline-none appearance-none" 
                            value={historyDate} 
                            onChange={e => setHistoryDate(e.target.value)} 
                        />
                    </div>
                </div>

                {filteredHistory.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p>Nenhuma partida encontrada para esta data.</p>
                        <button onClick={() => setHistoryDate('')} className="text-emerald-400 text-sm mt-2 hover:underline">Ver todo o histórico</button>
                    </div>
                ) : (
                    filteredHistory.map(m => {
                        // Helpers para identificar vencedor
                        const p1Won = m.s1 > m.s2;
                        const isDraw = m.s1 === m.s2; // Raro, mas possível em testes

                        return (
                            <div key={m.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm relative">
                                {/* Cabeçalho do Card (Data e Status) */}
                                <div className="bg-slate-900/50 px-3 py-1.5 flex justify-between items-center border-b border-slate-700/50">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 
                                        {m.createdAt ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '🕒 Enviando...'}
                                        {m.isDoubles && <span className="ml-2 text-blue-400 bg-blue-900/20 px-1.5 rounded border border-blue-500/20">DUPLA</span>}
                                    </span>
                                    
                                    {/* Status da Partida */}
                                    {m.status === 'confirmed' ? (
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            <CheckCircle className="w-3 h-3" /> Confirmado
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                            <History className="w-3 h-3" /> Pendente
                                        </div>
                                    )}
                                </div>

                                {/* Corpo do Placar */}
                                {/* Corpo do Placar */}
                                <div className="p-3 flex flex-col gap-2">
                                    
                                    {/* LINHA TIME 1 */}
                                    <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${p1Won ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-l-2 border-emerald-500' : 'opacity-70'}`}>
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${p1Won ? 'text-white' : 'text-slate-400'}`}>
                                                {m.p1Name}
                                            </span>
                                            {m.p1PartnerName && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="text-[9px] bg-slate-700 px-1 rounded">e</span> {m.p1PartnerName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            {/* ETIQUETA DA VERGONHA J1 */}
                                            {!p1Won && m.s1 === 4 && !m.isSimpleWin && (
                                                <span className="text-[8px] font-black text-pink-500 border border-pink-500/50 px-1 rounded bg-pink-500/10 transform -rotate-6">
                                                    👠 PUTA
                                                </span>
                                            )}
                                            
                                            {m.isSimpleWin ? (
                                                p1Won ? <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-md" /> : <span className="text-slate-600 font-bold text-lg">—</span>
                                            ) : (
                                                <span className={`text-xl font-black ${p1Won ? 'text-emerald-400' : 'text-slate-500'}`}>{m.s1}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* LINHA TIME 2 */}
                                    <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${!p1Won ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-l-2 border-emerald-500' : 'opacity-70'}`}>
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${!p1Won ? 'text-white' : 'text-slate-400'}`}>
                                                {m.p2Name}
                                            </span>
                                            {m.p2PartnerName && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="text-[9px] bg-slate-700 px-1 rounded">e</span> {m.p2PartnerName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            {/* ETIQUETA DA VERGONHA J2 */}
                                            {p1Won && m.s2 === 4 && !m.isSimpleWin && (
                                                <span className="text-[8px] font-black text-pink-500 border border-pink-500/50 px-1 rounded bg-pink-500/10 transform -rotate-6">
                                                    👠 PUTA
                                                </span>
                                            )}

                                            {m.isSimpleWin ? (
                                                !p1Won ? <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-md" /> : <span className="text-slate-600 font-bold text-lg">—</span>
                                            ) : (
                                                <span className={`text-xl font-black ${!p1Won ? 'text-emerald-400' : 'text-slate-500'}`}>{m.s2}</span>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Rodapé (Ações) */}
                               {/* Rodapé (Ações) */}
                                {(m.isChilena || (user && (m.status !== 'confirmed' || isAdmin))) && (
                                    <div className="px-3 pb-3 pt-0 flex justify-between items-center">
                                        <div>
                                            {m.isChilena && (
                                                <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 flex items-center gap-1">
                                                    <Zap className="w-3 h-3 fill-yellow-500" /> CHILENA
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Botões de Ação */}
                                        {(m.status !== 'confirmed' || isAdmin) && user && (
                                            <div className="flex gap-2">
                                                {/* QR Code (Apenas criador vê) */}
                                                {m.createdBy === user.uid && m.p2Id.startsWith('guest_') && (
                                                    <button onClick={() => setPendingConfirmationMatchId(m.id)} className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600"><QrCode className="w-4 h-4" /></button>
                                                )}
                                                
                                                {/* Botão Cancelar (Criador) - SÓ APARECE SE NÃO FOR ADMIN (pra não duplicar) */}
                                                {m.createdBy === user.uid && !isAdmin && (
                                                    <button onClick={() => handleDeleteMatch(m.id)} className="p-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50" title="Cancelar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* Botão Confirmar (Jogador 2) */}
                                                {m.p2Id === user.uid && (
                                                    <button onClick={() => handleP2Confirm(m.id)} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500" title="Confirmar">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* Botões de Admin (Validar e Excluir) */}
                                                {isAdmin && (
                                                    <>
                                                        {m.status !== 'confirmed' && (
                                                            <button onClick={() => handleForceConfirm(m.id)} className="p-1.5 bg-amber-600 text-white rounded hover:bg-amber-500" title="Validar Forçado">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteMatch(m.id)} className="p-1.5 bg-red-600 text-white rounded hover:bg-red-500" title="Excluir (Admin)">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        )}

        {view === 'fines' && <FinesScreen users={usersList} isAdmin={isAdmin} onOpenTransaction={openTransaction} />}
        {view === 'admin' && isAdmin && <AdminPanel users={usersList} onOpenTransaction={openTransaction} config={config} />}
      </main>
      <nav className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 md:w-20 md:h-screen md:border-t-0 md:border-r md:top-0 md:flex-col md:justify-center z-50">
        <div className="flex justify-around items-center h-16 md:flex-col md:h-auto md:gap-8">
            <NavButton icon={Trophy} label="Ranking" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <NavButton icon={History} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
            <NavButton icon={Banknote} label="Multas" active={view === 'fines'} onClick={() => setView('fines')} />
            {isAdmin && <NavButton icon={Gavel} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />}
        </div>
      </nav>
    </div>
  );
}

const NavButton = ({ icon: Icon, label, active, onClick }) => (<button onClick={onClick} className={`flex flex-col items-center justify-center w-16 md:w-full transition-colors ${active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}><Icon className={`w-6 h-6 mb-1 ${active ? 'fill-emerald-400/20' : ''}`} /><span className="text-[10px] font-medium">{label}</span></button>);