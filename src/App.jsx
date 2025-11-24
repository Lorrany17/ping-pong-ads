import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
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
  writeBatch
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
  Banknote,
  ChevronDown,
  ChevronUp,
  Receipt,
  MinusCircle,
  Search,
  Minus,
  Plus,
  Bell,
  Globe // Novo ícone para Internet
} from 'lucide-react';

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
const ADMIN_EMAILS = ['santoslorrany250@gmail.com']; 
const FINE_PRICE_PLAYER = 5.00; 
const FINE_PRICE_OWNER = 4.00; 

// --- REGRAS DE BANIMENTO (VIDAS) ---
const BAN_THRESHOLD_OWNER = 3;
const BAN_THRESHOLD_PLAYER = 1;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pingpong-app';

const getCollectionPath = (colName) => `artifacts/${appId}/public/data/${colName}`;

const AVATARS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💧','💦','☔️','☂️','🌊','🌫'];

const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

// --- FUNÇÃO AUXILIAR DE BANIMENTO ---
const isPlayerBanned = (user) => {
    if (!user) return false;
    const fines = user.fines || 0;
    const threshold = user.isOwner ? BAN_THRESHOLD_OWNER : BAN_THRESHOLD_PLAYER;
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

// --- COMPONENTES ---

const AvatarDisplay = ({ avatar, size = "md", className = "" }) => {
    // Aceita data:image (upload) OU http (link da internet)
    const isImage = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));
    const sizeClasses = { sm: "w-8 h-8 text-lg", md: "w-12 h-12 text-2xl", lg: "w-16 h-16 text-4xl", xl: "w-24 h-24 text-6xl" };
    return (
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-slate-700 border border-slate-600 ${className}`}>
            {isImage ? (
                <img src={avatar} alt="Av" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'; e.target.parentNode.innerHTML='❌'}} />
            ) : (
                <span role="img">{avatar || '👤'}</span>
            )}
        </div>
    );
};

// --- MODAL DE SELEÇÃO E CRIAÇÃO RÁPIDA ---
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const isAdmin = ADMIN_EMAILS.includes(email);
        const migratedData = await migrateOfflineUser(userCredential.user.uid, email);
        await setDoc(doc(db, getCollectionPath('users'), userCredential.user.uid), {
          uid: userCredential.user.uid, displayName: name, email: email,
          avatar: migratedData?.avatar || getRandomAvatar(), isOwner: migratedData?.isOwner || false, 
          fines: migratedData?.fines || 0, 
          balance: migratedData?.balance || 0,
          role: isAdmin ? 'admin' : 'user', createdAt: serverTimestamp()
        });
        if (migratedData) alert(`Bem-vindo(a) ${name}! Histórico recuperado.`);
      }
      if(onLoginSuccess) onLoginSuccess();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 relative">
        {onCancel && (<button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle /></button>)}
        <div className="text-center mb-8"><Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-2" /><h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Ping Pong Master</h1></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (<div><label className="block text-sm font-medium text-slate-300 mb-1">Nome</label><input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} /></div>)}
          <div><label className="block text-sm font-medium text-slate-300 mb-1">Email</label><input type="email" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1">Senha</label><input type="password" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
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
    const [showUrlInput, setShowUrlInput] = useState(false); // Estado para mostrar input de link
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
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-4 text-center">Editar Perfil</h2>
                <div className="flex flex-col items-center mb-6 gap-4">
                    <AvatarDisplay avatar={avatar} size="xl" className="border-4 border-slate-600 shadow-lg" />
                    
                    <div className="flex gap-2">
                        <button onClick={() => setAvatar(getRandomAvatar())} className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-slate-600"><RefreshCw className="w-3 h-3" /> Emoji</button>
                        <button onClick={() => fileInputRef.current.click()} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-emerald-500"><Camera className="w-3 h-3" /> Foto</button>
                        <button onClick={() => setShowUrlInput(!showUrlInput)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-blue-500"><Globe className="w-3 h-3" /> Link</button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    {/* Input para URL de Imagem da Internet */}
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

const TransactionModal = ({ user, action, onClose }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [finesToClear, setFinesToClear] = useState(1); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (action === 'fine') {
            setAmount(user.isOwner ? FINE_PRICE_OWNER.toFixed(2) : FINE_PRICE_PLAYER.toFixed(2));
            setDescription('Infração');
        } else {
            setAmount(user.balance > 0 ? user.balance.toFixed(2) : '');
            setDescription('Pagamento');
            setFinesToClear(1);
        }
    }, [action, user]);

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
            <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95">
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${action === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {action === 'fine' ? <MinusCircle /> : <CheckCircle />}
                    {action === 'fine' ? `Aplicar Multa: ${user.displayName}` : `Receber de: ${user.displayName}`}
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400">VALOR (R$)</label>
                        <input type="number" step="0.50" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1 text-lg font-bold" value={amount} onChange={e => setAmount(e.target.value)} />
                        {action === 'fine' && <p className="text-[10px] text-slate-500 mt-1">Edite se for um valor especial.</p>}
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
        <div className="space-y-6 pb-20">
            {showUserSelect && (<UserSelectModal users={users} onClose={() => setShowUserSelect(false)} onSelect={(user) => { setShowUserSelect(false); onOpenTransaction(user, 'fine'); }} />)}
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Banknote className="text-red-400" /> Financeiro</h2>{isAdmin && (<button onClick={() => setShowUserSelect(true)} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-lg"><PlusCircle className="w-3 h-3" /> Aplicar Multa</button>)}</div>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-lg"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total a Receber</span><div className="text-4xl font-bold text-emerald-400 mt-2">R$ {totalDebt.toFixed(2).replace('.', ',')}</div></div>
            {selectedUser && (<div className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden animate-in slide-in-from-bottom-5"><div className="bg-slate-700 p-3 flex justify-between items-center cursor-pointer" onClick={() => setSelectedUser(null)}><span className="font-bold text-white flex items-center gap-2"><Receipt className="w-4 h-4" /> Extrato: {selectedUser.displayName}</span><ChevronUp className="w-4 h-4 text-slate-300" /></div><div className="p-3 max-h-60 overflow-y-auto space-y-2">{transactions.length === 0 ? <p className="text-center text-slate-500 text-xs">Sem histórico.</p> : transactions.map(t => (<div key={t.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 last:border-0"><div><span className={`font-bold block ${t.type === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>{t.type === 'fine' ? 'Multa' : 'Pagamento'}</span><span className="text-xs text-slate-400">{t.description}</span><span className="text-[10px] text-slate-500 block">{t.createdAt?.toDate().toLocaleDateString()}</span></div><span className={`font-bold ${t.type === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>{t.type === 'fine' ? '+' : '-'} R$ {t.amount.toFixed(2)}</span></div>))}</div></div>)}
            <div className="space-y-3">{finesList.length === 0 ? (<div className="text-center text-slate-500 py-10">Ninguém deve nada! 🙌</div>) : (finesList.map(user => (<div key={user.uid} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between shadow-sm"><div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(selectedUser?.uid === user.uid ? null : user)}><AvatarDisplay avatar={user.avatar} size="sm" /><div><div className="flex items-center gap-2"><span className="font-bold text-white">{user.displayName}</span>{isPlayerBanned(user) && <span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse">BANIDO</span>}</div><div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">{user.fines} infrações <ChevronDown className="w-3 h-3" /></div></div></div><div className="flex flex-col items-end gap-1"><span className="text-lg font-bold text-red-400">R$ {(user.balance || 0).toFixed(2).replace('.', ',')}</span>{isAdmin && (<div className="flex gap-2 mt-1"><button onClick={() => onOpenTransaction(user, 'payment')} className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-800 hover:bg-emerald-900/50 font-bold">PAGAR</button><button onClick={() => onOpenTransaction(user, 'fine')} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800 hover:bg-red-900/50 font-bold">+ MULTA</button></div>)}</div></div>)))}</div>
        </div>
    );
};

const RankingList = ({ matches, users, period }) => {
  const ranking = useMemo(() => {
    const stats = {};
    users.forEach(u => { stats[u.uid] = { ...u, wins: 0, losses: 0, games: 0 }; });
    matches.forEach(m => {
      if (m.status !== 'confirmed' || !m.createdAt || !dateFilters[period](m.createdAt.toDate())) return;
      if (stats[m.p1Id]) { stats[m.p1Id].games++; if (Number(m.s1) > Number(m.s2)) stats[m.p1Id].wins++; else stats[m.p1Id].losses++; }
      if (m.p2Id && stats[m.p2Id]) { stats[m.p2Id].games++; if (Number(m.s2) > Number(m.s1)) stats[m.p2Id].wins++; else stats[m.p2Id].losses++; }
    });
    return Object.values(stats).filter(p => p.games > 0 || p.fines > 0).sort((a, b) => b.wins - a.wins || (b.wins/(b.games||1)) - (a.wins/(a.games||1)));
  }, [matches, users, period]);

  if (ranking.length === 0) return <div className="text-center p-8 text-slate-500"><Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>Nenhum registro.</p></div>;

  return (
    <div className="space-y-3">
      {ranking.map((player, index) => {
        const isBanned = isPlayerBanned(player);
        return (
          <div key={player.uid} className={`relative flex items-center p-4 rounded-xl border ${isBanned ? 'bg-red-900/20 border-red-800' : 'bg-slate-800 border-slate-700'} shadow-sm`}>
            <div className="flex-shrink-0 w-8 text-center font-bold text-slate-400 text-xl">#{index + 1}</div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <AvatarDisplay avatar={player.avatar} size="sm" />
                <h3 className={`font-bold text-lg ${isBanned ? 'text-red-400' : 'text-white'}`}>{player.displayName}</h3>
                {player.isOwner && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Dono</span>}
                {player.balance > 0 && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Deve R$ {player.balance.toFixed(2)}</span>}
              </div>
              <p className="text-sm text-slate-400">{player.wins} Vitórias • {player.losses} Derrotas</p>
            </div>
            <div className="text-right"><span className="block text-2xl font-bold text-emerald-400">{Math.round((player.wins / (player.games || 1)) * 100)}%</span></div>
          </div>
        );
      })}
    </div>
  );
};

const NewMatch = ({ users, currentUser, isAdmin, onClose, onSuccess }) => {
  const [p1Search, setP1Search] = useState('');
  const [p2Search, setP2Search] = useState('');
  const [selectedP1, setSelectedP1] = useState(users.find(u => u.uid === currentUser.uid));
  const [selectedP2, setSelectedP2] = useState(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [isGuestP1, setIsGuestP1] = useState(false);
  const [guestNameP1, setGuestNameP1] = useState('');
  const [isGuestP2, setIsGuestP2] = useState(false);
  const [guestNameP2, setGuestNameP2] = useState('');
  const [loading, setLoading] = useState(false);
  
  const isUserBanned = selectedP1 && !isGuestP1 && isPlayerBanned(selectedP1);
  if (isUserBanned && !isAdmin) return <div className="p-6 text-center"><AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-white mb-2">Suspenso!</h2><button onClick={onClose} className="bg-slate-700 text-white px-4 py-2 rounded-lg">Voltar</button></div>;

  const filterUsers = (search, excludeUid) => users.filter(u => (excludeUid ? u.uid !== excludeUid : true) && u.displayName.toLowerCase().includes(search.toLowerCase()));

  const UserOption = ({ user, onClick }) => (
      <button type="button" onClick={onClick} className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3"><AvatarDisplay avatar={user.avatar} size="sm" /><div><span className="block font-bold">{user.displayName}</span><span className="text-[10px] text-slate-400">{user.isOffline ? 'Sem Conta' : user.email}</span></div></div>
        {isPlayerBanned(user) && <span className="text-xs text-red-400 border border-red-500/30 px-1 rounded">Suspenso</span>}
      </button>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score1 || !score2) return;
    if (!isGuestP1 && !selectedP1) return;
    if (!isGuestP2 && !selectedP2) return;

    setLoading(true);
    try {
      const matchData = { s1: parseInt(score1), s2: parseInt(score2), createdAt: serverTimestamp(), createdBy: currentUser.uid };
      if (isGuestP1) { matchData.p1Name = guestNameP1 || 'Convidado 1'; matchData.p1Id = 'guest_' + Date.now() + '_1'; } 
      else { matchData.p1Name = selectedP1.displayName; matchData.p1Id = selectedP1.uid; }

      if (isGuestP2) { matchData.p2Name = guestNameP2 || 'Convidado 2'; matchData.p2Id = 'guest_' + Date.now() + '_2'; } 
      else { matchData.p2Name = selectedP2.displayName; matchData.p2Id = selectedP2.uid; }

      if (isAdmin || (selectedP2 && selectedP2.isOffline) || isGuestP2 || (isGuestP1 && isGuestP2)) {
          matchData.status = 'confirmed'; matchData.confirmedBy = isAdmin ? 'admin_scribe' : 'auto_scribe'; matchData.confirmedAt = serverTimestamp();
      } else { matchData.status = 'pending_user'; }
      
      const docRef = await addDoc(collection(db, getCollectionPath('matches')), matchData);
      onSuccess(docRef.id, matchData.status);
    } catch (err) { alert('Erro: ' + err.message); setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><PlusCircle className="text-emerald-400" /> Registrar Partida</h2>
      
      <div className="space-y-1">
        <label className="text-slate-400 text-xs font-bold ml-1">JOGADOR 1</label>
        {!selectedP1 && !isGuestP1 ? (
          <div className="relative">
            <input type="text" placeholder="Buscar J1..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" value={p1Search} onChange={(e) => setP1Search(e.target.value)} />
            {p1Search && <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-10 max-h-64 overflow-y-auto shadow-xl">
                {filterUsers(p1Search, null).map(u => <UserOption key={u.uid} user={u} onClick={() => { setSelectedP1(u); setP1Search(''); }} />)}
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
                    <button onClick={() => setSelectedP1(null)} className="text-xs text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
            )
        )}
      </div>

      <div className="space-y-1">
        <label className="text-slate-400 text-xs font-bold ml-1">JOGADOR 2</label>
        {!selectedP2 && !isGuestP2 ? (
          <div className="relative">
            <input type="text" placeholder="Buscar J2..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" value={p2Search} onChange={(e) => setP2Search(e.target.value)} />
            {p2Search && <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-10 max-h-64 overflow-y-auto shadow-xl">
                {filterUsers(p2Search, selectedP1?.uid).map(u => <UserOption key={u.uid} user={u} onClick={() => { setSelectedP2(u); setP2Search(''); }} />)}
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
                    <button onClick={() => setSelectedP2(null)} className="text-xs text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
            )
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center"><label className="block text-slate-400 text-xs mb-1">Placar J1</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none" value={score1} onChange={(e) => setScore1(e.target.value)} /></div>
        <div className="text-center"><label className="block text-slate-400 text-xs mb-1">Placar J2</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none" value={score2} onChange={(e) => setScore2(e.target.value)} /></div>
      </div>
      
      <button onClick={handleSubmit} disabled={loading || ((!selectedP1 && !isGuestP1) || (!selectedP2 && !isGuestP2))} className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex justify-center items-center gap-2 ${isAdmin ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:bg-slate-700 disabled:text-slate-500`}>
        {loading ? '...' : (isAdmin || isGuestP2 || (isGuestP1 && isGuestP2) ? 'Registrar (Auto-Confirmar)' : 'Enviar para Confirmação')}
      </button>
    </div>
  );
};

const QrModal = ({ matchId, onClose }) => {
  const confirmationUrl = `${window.location.origin}${window.location.pathname}?confirmMatch=${matchId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(confirmationUrl)}&bgcolor=1e293b&color=34d399`;
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full text-center border border-slate-700 shadow-2xl animate-in zoom-in-95">
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
    <div className="p-6 max-w-md mx-auto bg-slate-800 rounded-xl shadow-2xl m-4 border border-slate-700">
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

const AdminPanel = ({ users, onOpenTransaction }) => {
  const [newOfflineName, setNewOfflineName] = useState('');
  const [newOfflineEmail, setNewOfflineEmail] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Gavel className="text-amber-400" /> Painel do Juiz</h2>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Cadastrar Sem Conta</h3>
        <form onSubmit={addOfflinePlayer} className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="Nome..." className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newOfflineName} onChange={(e) => setNewOfflineName(e.target.value)} required />
                <input type="email" placeholder="E-mail real (opcional)" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newOfflineEmail} onChange={(e) => setNewOfflineEmail(e.target.value)} />
            </div>
            <button className="bg-slate-700 text-white px-3 py-2 rounded text-xs font-bold w-full">Adicionar & Reservar E-mail</button>
        </form>
      </div>
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.uid} className={`p-4 rounded-lg border flex flex-col gap-3 ${user.isOffline ? 'bg-slate-800/50 border-slate-700 border-dashed' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {editingUserId === user.uid ? (
                    <div className="flex flex-col gap-2 mb-2">
                        <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" />
                        <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
                        <div className="flex gap-2"><button onClick={() => saveEdit(user.uid)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><Save className="w-3 h-3" /> Salvar</button><button onClick={cancelEditing} className="bg-slate-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelar</button></div>
                    </div>
                ) : (
                    <>
                        <p className="font-bold text-white flex items-center gap-2"><AvatarDisplay avatar={user.avatar} size="sm" />{user.displayName}{user.isOffline && <span className="text-[10px] bg-slate-600 px-1 rounded text-slate-300">OFFLINE</span>}{user.isOffline && (<button onClick={() => startEditing(user)} className="text-slate-500 hover:text-white p-1"><Edit2 className="w-3 h-3" /></button>)}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">{user.email}{user.isOffline && user.email.includes('@') && !user.email.includes('noemail.com') && <span className="text-emerald-500">(VINCULADO)</span>}</p>
                    </>
                )}
                <div className="flex gap-2 mt-1">{user.isOwner ? <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">DONO DA RAQUETE</span> : <span className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">JOGADOR</span>}</div>
              </div>
              <div className="text-center"><span className={`block text-xl font-bold ${user.fines > 0 ? 'text-red-400' : 'text-slate-600'}`}>{user.fines || 0}</span><span className="text-[10px] text-slate-500">MULTAS</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2"><button onClick={() => handleUpdateUser(user.uid, { isOwner: !user.isOwner })} className="text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">{user.isOwner ? 'Remover Dono' : 'Tornar Dono'}</button>{user.isOffline && <button onClick={() => handleDeleteOffline(user.uid)} className="text-xs bg-red-900/20 text-red-400 hover:bg-red-900/40 py-2 rounded flex justify-center items-center gap-1"><Trash2 className="w-3 h-3" /> Apagar</button>}</div>
            
            {/* BOTÕES DE AÇÃO RÁPIDA (INTEGRADOS) */}
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => onOpenTransaction(user, 'fine')} className="text-xs border border-red-500/50 text-red-400 hover:bg-red-900/20 py-2 rounded flex items-center justify-center gap-1 font-bold">+ Multa</button>
               <button onClick={() => onOpenTransaction(user, 'payment')} className="text-xs bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 py-2 rounded font-bold border border-emerald-800">Pagar</button>
            </div>
          </div>
        ))}
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
  const [period, setPeriod] = useState('all');
  const [pendingConfirmationMatchId, setPendingConfirmationMatchId] = useState(null);
  const [confirmMatchId, setConfirmMatchId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [transactionModal, setTransactionModal] = useState(null); // Global Transaction Modal

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('confirmMatch');
    if (matchId) setConfirmMatchId(matchId);
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, getCollectionPath('users'))), (snap) => {
      const list = []; snap.forEach(doc => list.push(doc.data())); setUsersList(list);
    });
    const unsubMatches = onSnapshot(query(collection(db, getCollectionPath('matches')), orderBy('createdAt', 'desc')), (snap) => {
      const list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); setMatchesList(list);
    });
    return () => { unsubUsers(); unsubMatches(); };
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

  // Função para abrir o modal de transação (passada para AdminPanel e FinesScreen)
  const openTransaction = (userTarget, action) => {
      setTransactionModal({ user: userTarget, action });
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400">Carregando...</div>;
  if (confirmMatchId) return <div className="min-h-screen bg-slate-900 text-slate-100"><ConfirmMatchScreen matchId={confirmMatchId} currentUser={user} onComplete={clearUrl}/></div>;
  
  if (view === 'auth' && !user) {
      return <AuthScreen onCancel={() => setView('dashboard')} onLoginSuccess={() => setView('dashboard')} />;
  }

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const currentUserDoc = user ? usersList.find(u => u.uid === user.uid) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 md:pb-0 md:pl-20 relative">
      {pendingConfirmationMatchId && <QrModal matchId={pendingConfirmationMatchId} onClose={() => setPendingConfirmationMatchId(null)} />}
      {showProfile && user && <ProfileModal user={user} userDoc={currentUserDoc} onClose={() => setShowProfile(false)} />}
      {transactionModal && <TransactionModal user={transactionModal.user} action={transactionModal.action} onClose={() => setTransactionModal(null)} />}

      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-20 flex justify-between items-center md:hidden">
        <div className="flex items-center gap-2"><Trophy className="text-emerald-400 w-6 h-6" /><span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Master</span></div>
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

      {notifications.length > 0 && <div className="bg-amber-600/90 backdrop-blur text-white p-3 sticky top-14 md:top-0 z-30 animate-in slide-in-from-top"><div className="max-w-2xl mx-auto flex justify-between items-center"><span className="text-sm font-medium">Você tem {notifications.length} partida(s) para confirmar!</span><button onClick={() => setConfirmMatchId(notifications[0].id)} className="bg-white text-amber-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Ver</button></div></div>}
      
      <main className="max-w-2xl mx-auto p-4 space-y-6 min-h-screen">
        <div className="hidden md:flex justify-between items-center mb-8 pt-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Ping Pong Master</h1>
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

        {view === 'dashboard' && (<><div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto">{['day', 'week', 'month', 'all'].map((p) => (<button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${period === p ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Geral'}</button>))}</div><RankingList matches={matchesList} users={usersList} period={period} /><button onClick={() => setView(user ? 'newMatch' : 'auth')} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-4 shadow-2xl shadow-emerald-500/30 transition-transform hover:scale-110 z-50 group"><PlusCircle className="w-8 h-8" /></button></>)}
        {view === 'newMatch' && user && (<div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-xl relative"><button onClick={() => setView('dashboard')} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle /></button><NewMatch users={usersList} currentUser={user} isAdmin={isAdmin} onClose={() => setView('dashboard')} onSuccess={(id, status) => { if (status === 'pending_guest') setPendingConfirmationMatchId(id); else { setView('dashboard'); alert(status === 'confirmed' ? 'Partida registrada!' : 'Partida enviada para confirmação!'); } }} /></div>)}
        {view === 'history' && (<div className="space-y-4"><h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><History className="text-cyan-400" /> Histórico Recente</h2>{matchesList.slice(0, 20).map(m => (<div key={m.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-2"><div className="flex justify-between items-center"><div className="flex flex-col"><span className="text-slate-300 font-bold">{m.p1Name} <span className="text-emerald-400">{m.s1}</span></span><span className="text-slate-300 font-bold">{m.p2Name} <span className="text-emerald-400">{m.s2}</span></span><span className="text-xs text-slate-500 mt-1">{m.createdAt?.toDate().toLocaleDateString()} - {m.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</span></div>{m.status === 'confirmed' && <CheckCircle className="text-emerald-500/20 w-6 h-6" />}{m.status !== 'confirmed' && <History className="text-amber-500/50 w-6 h-6 animate-pulse" />}</div>{/* AÇÕES PARA JOGOS PENDENTES OU SE FOR ADMIN EM JOGOS CONFIRMADOS */}{(m.status !== 'confirmed' || isAdmin) && user && (<div className="flex gap-2 justify-end mt-2 border-t border-slate-700 pt-2 flex-wrap">{m.createdBy === user.uid && m.p2Id.startsWith('guest_') && (<button onClick={() => setPendingConfirmationMatchId(m.id)} className="text-xs bg-slate-700 text-white px-3 py-1 rounded border border-slate-600 flex items-center gap-1 hover:bg-slate-600"><QrCode className="w-3 h-3" /> Ver QR Code</button>)}{m.createdBy === user.uid && (<button onClick={() => handleDeleteMatch(m.id)} className="text-xs bg-red-900/20 text-red-400 px-3 py-1 rounded border border-red-900/50 flex items-center gap-1 hover:bg-red-900/40"><Trash2 className="w-3 h-3" /> Cancelar</button>)}{m.p2Id === user.uid && (<button onClick={() => handleP2Confirm(m.id)} className="text-xs bg-emerald-900/20 text-emerald-400 px-3 py-1 rounded border border-emerald-900/50 flex items-center gap-1 hover:bg-emerald-900/40"><Check className="w-3 h-3" /> Confirmar</button>)}{isAdmin && (<><button onClick={() => handleForceConfirm(m.id)} className="text-xs bg-amber-900/20 text-amber-400 px-3 py-1 rounded border border-amber-900/50 flex items-center gap-1 hover:bg-amber-900/40"><Check className="w-3 h-3" /> Validar</button><button onClick={() => handleDeleteMatch(m.id)} className="text-xs bg-red-900/20 text-red-400 px-3 py-1 rounded border border-red-900/50 flex items-center gap-1 hover:bg-red-900/40"><Trash2 className="w-3 h-3" /> Excluir</button></>)}</div>)}</div>))}</div>)}
        {view === 'fines' && <FinesScreen users={usersList} isAdmin={isAdmin} onOpenTransaction={openTransaction} />}
        {view === 'admin' && isAdmin && <AdminPanel users={usersList} onOpenTransaction={openTransaction} />}
      </main>
      <nav className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 md:w-20 md:h-screen md:border-t-0 md:border-r md:top-0 md:flex-col md:justify-center z-40"><div className="flex justify-around items-center h-16 md:flex-col md:h-auto md:gap-8"><NavButton icon={Trophy} label="Ranking" active={view === 'dashboard'} onClick={() => setView('dashboard')} /><NavButton icon={History} label="Histórico" active={view === 'history'} onClick={() => setView('history')} /><NavButton icon={Banknote} label="Multas" active={view === 'fines'} onClick={() => setView('fines')} />{isAdmin && <NavButton icon={Gavel} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />}</div></nav>
    </div>
  );
}

const NavButton = ({ icon: Icon, label, active, onClick }) => (<button onClick={onClick} className={`flex flex-col items-center justify-center w-16 md:w-full transition-colors ${active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}><Icon className={`w-6 h-6 mb-1 ${active ? 'fill-emerald-400/20' : ''}`} /><span className="text-[10px] font-medium">{label}</span></button>);