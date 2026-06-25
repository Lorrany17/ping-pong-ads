import React, { useState } from 'react';
import { Trophy, Eye, EyeOff, XCircle } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  setDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, getCollectionPath, ADMIN_EMAILS } from '../config/firebase';
import { getRandomAvatar } from '../utils';
import { ChristmasSnow, ChristmasLights } from '../components';

export default function AuthScreen({ onCancel, onLoginSuccess }) {
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
      return { 
        fines: offlineData.fines || 0, 
        isOwner: offlineData.isOwner || false, 
        avatar: offlineData.avatar, 
        balance: offlineData.balance || 0 
      };
    } catch (e) { 
      return null; 
    }
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
          uid: userCredential.user.uid, 
          displayName: name, 
          email: email,
          avatar: migratedData?.avatar || getRandomAvatar(), 
          isOwner: migratedData?.isOwner || false, 
          fines: migratedData?.fines || 0, 
          balance: migratedData?.balance || 0,
          role: isAdmin ? 'admin' : 'user', 
          createdAt: serverTimestamp()
        });
        if (migratedData) alert(`Bem-vindo(a) ${name}! Histórico recuperado.`);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError("Digite seu e-mail primeiro."); return; }
    setLoading(true); setError('');
    try { 
      await sendPasswordResetEmail(auth, email); 
      alert("E-mail enviado!"); 
      setShowReset(false); 
    } catch (err) { 
      setError("Erro: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (showReset) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 relative">
          <button onClick={() => setShowReset(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle /></button>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Recuperar Senha</h2>
            <p className="text-slate-400 text-sm">Digite seu e-mail para receber o link.</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input 
                type="email" 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setShowReset(false)} className="text-slate-400 text-sm hover:text-white underline">
              Voltar para o Login
            </button>
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
        {onCancel && (
          <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <XCircle />
          </button>
        )}
        <div className="text-center mb-8">
          <Trophy className={`w-12 h-12 mx-auto mb-2 ${isChristmas ? 'text-red-500' : 'text-emerald-400'}`} />
          {isChristmas ? (
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <span className="text-red-500 drop-shadow-md">Ping</span>
              <span className="text-emerald-500 drop-shadow-md">Pong</span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Master</span>
              <span>🎅</span>
            </h1>
          ) : (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Ping Pong Master
            </h1>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
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

          {isLogin && (
            <div className="text-right">
              <button type="button" onClick={() => setShowReset(true)} className="text-emerald-400 text-xs hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
        <div className="mt-6 text-center space-y-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 text-sm hover:underline">
            {isLogin ? 'Criar conta' : 'Fazer login'}
          </button>
          {onCancel && (
            <div className="pt-4 border-t border-slate-700">
              <button 
                onClick={onCancel} 
                className="text-slate-400 text-sm flex items-center justify-center gap-2 w-full hover:text-white"
              >
                <Eye className="w-4 h-4" /> Apenas Olhar (Sem Conta)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
