import React, { useState, useMemo } from 'react';
import { PlusCircle, XCircle, Zap, RefreshCw } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, getCollectionPath } from '../config/firebase';
import { isPlayerBanned } from '../utils';
import { AvatarDisplay } from '../components';

export default function NewMatch({ users, matches, currentUser, isAdmin, onClose, onSuccess, config }) {
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
    <button 
      type="button" 
      onClick={onClick} 
      className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 border-b border-slate-700/50 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <AvatarDisplay avatar={user.avatar} size="sm" />
        <div>
          <span className="block font-bold">{user.displayName}</span>
          <span className="text-[10px] text-slate-400">{user.isOffline ? 'Sem Conta' : user.email}</span>
        </div>
      </div>
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

      if (isGuestP1) { 
        matchData.p1Name = guestNameP1 || 'Convidado 1'; 
        matchData.p1Id = 'guest_' + Date.now() + '_1'; 
      } else { 
        matchData.p1Name = selectedP1.displayName; 
        matchData.p1Id = selectedP1.uid; 
      }
      
      if (isDoubles && selectedP1Partner) {
        matchData.p1PartnerName = selectedP1Partner.displayName;
        matchData.p1PartnerId = selectedP1Partner.uid;
      }

      if (isGuestP2) { 
        matchData.p2Name = guestNameP2 || 'Convidado 2'; 
        matchData.p2Id = 'guest_' + Date.now() + '_2'; 
      } else { 
        matchData.p2Name = selectedP2.displayName; 
        matchData.p2Id = selectedP2.uid; 
      }

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
      if (confBy) matchData.confirmedBy = confBy;
      if (confAt) matchData.confirmedAt = confAt;
      
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

    } catch (err) { 
      alert('Erro: ' + err.message); 
      setLoading(false); 
    }
  };

  const isAutoConfirmButton = isAdmin;

  const renderPartnerInput = (label, selected, setSelected, search, setSearch, ...excludes) => (
    <div className="relative mt-2 pl-4 border-l-2 border-slate-700 animate-in slide-in-from-top-2">
      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">{label}</label>
      {!selected ? (
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar parceiro..." 
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          {search && (
            <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-20 max-h-40 overflow-y-auto shadow-xl">
              {getAvailableUsers(search, ...excludes).map(u => (
                <UserOption key={u.uid} user={u} onClick={() => { setSelected(u); setSearch(''); }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/50 p-2 rounded-lg flex items-center justify-between border border-slate-600/50">
          <div className="flex items-center gap-2">
            <AvatarDisplay avatar={selected.avatar} size="xs" />
            <span className="font-bold text-sm text-white">{selected.displayName}</span>
          </div>
          <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
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
        <label className="text-slate-400 text-xs font-bold ml-1 flex justify-between">
          {isDoubles ? 'TIME 1' : 'JOGADOR 1'} 
          {isKingMode && <span className="text-indigo-400 text-[10px]">(Vencedores)</span>}
        </label>
        
        {!selectedP1 && !isGuestP1 ? (
          <div className="relative">
            <input 
              type="text" 
              placeholder={isDoubles ? "Buscar Capitão..." : "Buscar Jogador..."} 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" 
              value={p1Search} 
              onChange={(e) => setP1Search(e.target.value)} 
            />
            {p1Search && (
              <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-20 max-h-64 overflow-y-auto shadow-xl">
                {getAvailableUsers(p1Search, selectedP2?.uid, selectedP2Partner?.uid).map(u => (
                  <UserOption key={u.uid} user={u} onClick={() => { setSelectedP1(u); setP1Search(''); }} />
                ))}
                <button 
                  type="button" 
                  onClick={() => setIsGuestP1(true)} 
                  className="w-full text-left px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-emerald-400 font-medium"
                >
                  + Convidado
                </button>
              </div>
            )}
          </div>
        ) : (
          isGuestP1 ? (
            <div className="bg-slate-800 p-3 rounded-lg space-y-2 border border-amber-500/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-400 font-bold">Convidado</span>
                <button onClick={() => setIsGuestP1(false)} className="text-xs text-slate-400 underline">Trocar</button>
              </div>
              <input 
                type="text" 
                placeholder="Nome..." 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" 
                value={guestNameP1} 
                onChange={(e) => setGuestNameP1(e.target.value)} 
              />
            </div>
          ) : (
            <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between border border-slate-600">
              <div className="flex items-center gap-2">
                <AvatarDisplay avatar={selectedP1.avatar} size="sm" />
                <span className="font-bold text-white">{selectedP1.displayName}</span>
              </div>
              <button onClick={() => { setSelectedP1(null); setSelectedP1Partner(null); }} className="text-xs text-slate-400 hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )
        )}
        
        {isDoubles && !isGuestP1 && selectedP1 && renderPartnerInput('Parceiro Time 1', selectedP1Partner, setSelectedP1Partner, p1PartnerSearch, setP1PartnerSearch, selectedP1?.uid, selectedP2?.uid, selectedP2Partner?.uid)}
      </div>

      {/* --- TIME/JOGADOR 2 --- */}
      <div className="space-y-1 mt-4">
        <label className="text-slate-400 text-xs font-bold ml-1 flex justify-between">
          {isDoubles ? 'TIME 2' : 'JOGADOR 2'}
          {isKingMode && <span className="text-indigo-400 text-[10px]">(Desafiantes)</span>}
        </label>

        {!selectedP2 && !isGuestP2 ? (
          <div className="relative">
            <input 
              type="text" 
              placeholder={isDoubles ? "Buscar Capitão..." : "Buscar Jogador..."} 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" 
              value={p2Search} 
              onChange={(e) => setP2Search(e.target.value)} 
            />
            {p2Search && (
              <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-b-lg mt-1 z-20 max-h-64 overflow-y-auto shadow-xl">
                {getAvailableUsers(p2Search, selectedP1?.uid, selectedP1Partner?.uid, selectedP2Partner?.uid).map(u => (
                  <UserOption key={u.uid} user={u} onClick={() => { setSelectedP2(u); setP2Search(''); }} />
                ))}
                <button 
                  type="button" 
                  onClick={() => setIsGuestP2(true)} 
                  className="w-full text-left px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-emerald-400 font-medium"
                >
                  + Convidado
                </button>
              </div>
            )}
          </div>
        ) : (
          isGuestP2 ? (
            <div className="bg-slate-800 p-3 rounded-lg space-y-2 border border-amber-500/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-400 font-bold">Convidado</span>
                <button onClick={() => setIsGuestP2(false)} className="text-xs text-slate-400 underline">Trocar</button>
              </div>
              <input 
                type="text" 
                placeholder="Nome..." 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" 
                value={guestNameP2} 
                onChange={(e) => setGuestNameP2(e.target.value)} 
              />
            </div>
          ) : (
            <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <AvatarDisplay avatar={selectedP2.avatar} size="sm" />
                <span className="font-bold text-emerald-400">{selectedP2.displayName}</span>
              </div>
              <button onClick={() => { setSelectedP2(null); setSelectedP2Partner(null); }} className="text-xs text-slate-400 hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )
        )}

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
        <button 
          type="button" 
          onClick={() => setIsChilenaMode(!isChilenaMode)} 
          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border transition-all ${isChilenaMode ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
        >
          <Zap className="w-3 h-3" fill={isChilenaMode ? "currentColor" : "none"} /> Modo Chilena {isChilenaMode ? 'ATIVADO' : ''}
        </button>
      </div>

      {isChilenaMode ? (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <button 
            onClick={() => handleSubmit('p1_chilena')} 
            disabled={loading} 
            className="bg-slate-800 border-2 border-slate-600 hover:border-yellow-500 hover:bg-yellow-500/10 p-4 rounded-xl flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
            <span className="text-xs font-bold text-yellow-100">{isDoubles ? 'Time 1' : 'J1'} Aplicou Chilena</span>
          </button>
          <button 
            onClick={() => handleSubmit('p2_chilena')} 
            disabled={loading} 
            className="bg-slate-800 border-2 border-slate-600 hover:border-yellow-500 hover:bg-yellow-500/10 p-4 rounded-xl flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
            <span className="text-xs font-bold text-yellow-100">{isDoubles ? 'Time 2' : 'J2'} Aplicou Chilena</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <label className="block text-slate-400 text-xs mb-1">Placar {isDoubles ? 'Time 1' : 'J1'}</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-700" 
                placeholder="-" 
                value={score1} 
                onChange={(e) => setScore1(e.target.value)} 
              />
            </div>
            <div className="text-center">
              <label className="block text-slate-400 text-xs mb-1">Placar {isDoubles ? 'Time 2' : 'J2'}</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-700" 
                placeholder="-" 
                value={score2} 
                onChange={(e) => setScore2(e.target.value)} 
              />
            </div>
          </div>
          
          {hasScore ? (
            <button 
              onClick={() => handleSubmit('score')} 
              disabled={loading || (!isGuestP1 && !selectedP1) || (!isGuestP2 && !selectedP2)} 
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex justify-center items-center gap-2 animate-in zoom-in-95
                ${(!isGuestP2 && !selectedP2) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : (isAdmin ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}
              `}
            >
              {loading ? '...' : (
                (!isGuestP2 && !selectedP2) ? 'Selecione o Oponente...' : 
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
                  disabled={loading || (!isGuestP2 && !selectedP2)} 
                  className="bg-slate-800 border border-slate-600 hover:bg-emerald-900/30 hover:border-emerald-500/50 p-3 rounded-xl flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-xl">🏆</span>
                  <span className="text-xs font-bold text-white line-clamp-1">{isDoubles ? 'TIME 1' : (selectedP1 ? selectedP1.displayName : (guestNameP1 || 'J1'))}</span>
                  <span className="text-[9px] text-emerald-400">VENCEU</span>
                </button>

                <button 
                  onClick={() => handleSubmit('p2_simple')}
                  disabled={loading || (!isGuestP2 && !selectedP2)} 
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
}
