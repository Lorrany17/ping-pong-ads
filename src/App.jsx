import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Trophy, 
  History, 
  Banknote, 
  Gavel, 
  LogOut, 
  LogIn, 
  PlusCircle, 
  XCircle 
} from 'lucide-react';
import { auth, db, getCollectionPath, ADMIN_EMAILS, DEFAULT_CONFIG } from './config/firebase';
import { getCurrentSeasonId } from './utils';
import { 
  ChristmasSnow, 
  ChristmasLights, 
  AvatarDisplay, 
  SeasonSelector, 
  NavButton, 
  QrModal, 
  PlayerStatsModal, 
  TransactionModal, 
  ProfileModal 
} from './components';
import { 
  AuthScreen, 
  RankingList, 
  NewMatch, 
  FinesScreen, 
  HistoryScreen, 
  ConfirmMatchScreen, 
  AdminPanel 
} from './pages';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); 
  const [usersList, setUsersList] = useState([]);
  const [matchesList, setMatchesList] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const [period, setPeriod] = useState('all');
  const [pendingConfirmationMatchId, setPendingConfirmationMatchId] = useState(null);
  const [confirmMatchId, setConfirmMatchId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [transactionModal, setTransactionModal] = useState(null); 
  const [selectedPlayerStats, setSelectedPlayerStats] = useState(null);

  const [currentSeason, setCurrentSeason] = useState(getCurrentSeasonId());

  // --- CARREGAMENTO DAS CONFIGURAÇÕES GLOBAIS ---
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, getCollectionPath('settings'), 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() })); 
      }
    });
    return () => unsubConfig();
  }, []);

  // --- CARREGAMENTO DE DADOS (BLINDADO E SEGURO) ---
  useEffect(() => {
    if (!user) return;

    const unsubUsers = onSnapshot(query(collection(db, getCollectionPath('users'))), (snap) => {
      const list = []; 
      snap.forEach(docSnap => list.push(docSnap.data())); 
      setUsersList(list);
    });

    let q;
    const matchesRef = collection(db, getCollectionPath('matches'));

    if (currentSeason === 'legacy') {
      q = matchesRef; 
    } else {
      q = query(matchesRef, where('seasonId', '==', currentSeason));
    }

    const unsubMatches = onSnapshot(q, (snap) => {
      const list = []; 
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (currentSeason === 'legacy') {
          if (!data.seasonId) list.push({ id: docSnap.id, ...data });
        } else {
          list.push({ id: docSnap.id, ...data });
        }
      });
      
      list.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate().getTime() : Date.now();
        const dateB = b.createdAt ? b.createdAt.toDate().getTime() : Date.now();
        return dateB - dateA;
      });
      
      setMatchesList(list);
    });

    return () => { 
      unsubUsers(); 
      unsubMatches(); 
    };
  }, [currentSeason, user]);

  // --- INICIALIZAÇÃO DE PARÂMETROS E ESTADO DE AUTENTICAÇÃO ---
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

  // --- NOTIFICAÇÕES DE PARTIDAS PENDENTES ---
  useEffect(() => {
    if (!user || !matchesList.length) return;
    const pending = matchesList.filter(m => m.status === 'pending_user' && m.p2Id === user.uid);
    setNotifications(pending);
  }, [matchesList, user]);

  // --- HANDLERS E FUNÇÕES AUXILIARES ---
  const clearUrl = () => { 
    window.history.pushState({}, document.title, window.location.pathname); 
    setConfirmMatchId(null); 
  };
  
  const handleDeleteMatch = async (matchId) => { 
    if (confirm('Tem certeza?')) {
      await deleteDoc(doc(db, getCollectionPath('matches'), matchId)); 
    }
  };
  
  const handleForceConfirm = async (matchId) => { 
    if (confirm('Juiz: Validar na força?')) {
      await updateDoc(doc(db, getCollectionPath('matches'), matchId), { 
        status: 'confirmed', 
        confirmedBy: 'admin_force', 
        confirmedAt: serverTimestamp() 
      }); 
    }
  };
  
  const handleP2Confirm = async (matchId) => { 
    await updateDoc(doc(db, getCollectionPath('matches'), matchId), { 
      status: 'confirmed', 
      confirmedBy: user.uid, 
      confirmedAt: serverTimestamp() 
    }); 
    alert('Jogo confirmado!'); 
  };

  const openTransaction = (userTarget, action) => {
    setTransactionModal({ user: userTarget, action });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload(); 
    } catch (error) {
      alert("Erro ao sair: " + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400">Carregando...</div>;
  }
  
  if (confirmMatchId) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 relative z-10">
        <ChristmasSnow />
        <ChristmasLights />
        <ConfirmMatchScreen matchId={confirmMatchId} currentUser={user} onComplete={clearUrl} />
      </div>
    );
  }
   
  if (view === 'auth' && !user) {
    return <AuthScreen onCancel={() => setView('dashboard')} onLoginSuccess={() => setView('dashboard')} />;
  }

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const currentUserDoc = user ? usersList.find(u => u.uid === user.uid) : null;
  const isChristmas = new Date().getMonth() === 11;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 md:pb-0 md:pl-20 relative overflow-x-hidden overflow-y-auto">
      <ChristmasSnow />
      <ChristmasLights />
      
      {pendingConfirmationMatchId && (
        <QrModal matchId={pendingConfirmationMatchId} onClose={() => setPendingConfirmationMatchId(null)} />
      )}
      {showProfile && user && (
        <ProfileModal user={user} userDoc={currentUserDoc} onClose={() => setShowProfile(false)} />
      )}
      {transactionModal && (
        <TransactionModal 
          user={transactionModal.user} 
          action={transactionModal.action} 
          onClose={() => setTransactionModal(null)} 
          config={config} 
        />
      )}
      {selectedPlayerStats && (
        <PlayerStatsModal player={selectedPlayerStats} onClose={() => setSelectedPlayerStats(null)} />
      )}

      {/* --- HEADER MOBILE --- */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-20 flex justify-between items-center md:hidden relative">
        <div className="flex items-center gap-2">
          <Trophy className={`w-6 h-6 ${isChristmas ? 'text-red-500' : 'text-emerald-400'}`} />
          {isChristmas ? (
            <span className="font-bold text-lg text-white flex items-center gap-1">
              <span className="text-red-500">Ping</span>
              <span className="text-emerald-500">Pong</span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Master</span>
              <span>🎅</span>
            </span>
          ) : (
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Master
            </span>
          )}
        </div>
        <div className="flex gap-4">
          {user ? (
            <>
              <button onClick={() => setShowProfile(true)} className="hover:scale-110 transition-transform">
                <AvatarDisplay avatar={currentUserDoc?.avatar} size="sm" />
              </button>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setView('auth')} 
              className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" /> Entrar
            </button>
          )}
        </div>
      </header>

      {/* --- AVISO DE NOTIFICAÇÕES --- */}
      {notifications.length > 0 && (
        <div className="bg-amber-600/90 backdrop-blur text-white p-3 sticky top-14 md:top-0 z-30 animate-in slide-in-from-top relative">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <span className="text-sm font-medium">Você tem {notifications.length} partida(s) para confirmar!</span>
            <button 
              onClick={() => setConfirmMatchId(notifications[0].id)} 
              className="bg-white text-amber-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm"
            >
              Ver
            </button>
          </div>
        </div>
      )}
      
      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="max-w-2xl mx-auto p-4 space-y-6 min-h-screen relative z-10">
        
        {/* --- HEADER DESKTOP --- */}
        <div className="hidden md:flex justify-between items-center mb-8 pt-8">
          {isChristmas ? (
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
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
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={() => setShowProfile(true)} 
                  className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-700"
                >
                  <AvatarDisplay avatar={currentUserDoc?.avatar} size="sm" />
                  <span className="font-bold text-sm">{currentUserDoc?.displayName}</span>
                </button>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('auth')} 
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-500"
              >
                Fazer Login
              </button>
            )}
          </div>
        </div>

        {/* --- DASHBOARD VIEW --- */}
        {view === 'dashboard' && (
          <>
            <SeasonSelector current={currentSeason} onChange={setCurrentSeason} />
            
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto mb-4">
              {['day', 'week', 'month', 'all'].map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)} 
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    period === p ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Geral'}
                </button>
              ))}
            </div>

            <RankingList 
              matches={matchesList} 
              users={usersList} 
              period={period} 
              onSelectPlayer={setSelectedPlayerStats} 
              config={config} 
            />
            
            <button 
              onClick={() => setView(user ? 'newMatch' : 'auth')} 
              className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-4 shadow-2xl shadow-emerald-500/30 transition-transform hover:scale-110 z-50 group"
            >
              <PlusCircle className="w-8 h-8" />
            </button>
          </>
        )}
        
        {/* --- REGISTRO DE PARTIDA VIEW --- */}
        {view === 'newMatch' && user && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-xl relative">
            <button onClick={() => setView('dashboard')} className="absolute top-4 right-4 text-slate-400 hover:text-white z-50">
              <XCircle />
            </button>
            <NewMatch 
              matches={matchesList} 
              users={usersList} 
              currentUser={user} 
              isAdmin={isAdmin} 
              onClose={() => setView('dashboard')} 
              onSuccess={(id, status) => { 
                if (status === 'pending_guest') {
                  setPendingConfirmationMatchId(id); 
                } else { 
                  setView('dashboard'); 
                  alert(status === 'confirmed' ? 'Partida registrada!' : 'Partida enviada para confirmação!'); 
                } 
              }} 
              config={config} 
            />
          </div>
        )}
        
        {/* --- HISTÓRICO VIEW --- */}
        {view === 'history' && (
          <HistoryScreen 
            matchesList={matchesList}
            user={user}
            isAdmin={isAdmin}
            handleDeleteMatch={handleDeleteMatch}
            handleForceConfirm={handleForceConfirm}
            handleP2Confirm={handleP2Confirm}
            setPendingConfirmationMatchId={setPendingConfirmationMatchId}
            setConfirmMatchId={setConfirmMatchId}
          />
        )}

        {/* --- FINANCEIRO VIEW --- */}
        {view === 'fines' && (
          <FinesScreen 
            users={usersList} 
            isAdmin={isAdmin} 
            onOpenTransaction={openTransaction} 
          />
        )}

        {/* --- ADMIN VIEW --- */}
        {view === 'admin' && isAdmin && (
          <AdminPanel 
            users={usersList} 
            onOpenTransaction={openTransaction} 
            config={config} 
          />
        )}
      </main>

      {/* --- NAVEGAÇÃO LATERAL / INFERIOR --- */}
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