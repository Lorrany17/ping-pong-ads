import React, { useState } from 'react';
import { Gavel, Edit2, Trash2, UserPlus, Search } from 'lucide-react';
import { 
  updateDoc, 
  doc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp, 
  query, 
  collection, 
  where, 
  getDocs, 
  writeBatch, 
  deleteField 
} from 'firebase/firestore';
import { db, getCollectionPath } from '../config/firebase';
import { getRandomAvatar, isPlayerBanned } from '../utils';
import { AvatarDisplay, SettingsModal } from '../components';

export default function AdminPanel({ users, onOpenTransaction, config }) { 
  const [newOfflineName, setNewOfflineName] = useState('');
  const [newOfflineEmail, setNewOfflineEmail] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [showSettings, setShowSettings] = useState(false);
  const [processing, setProcessing] = useState(false); 

  const handleUpdateUser = async (uid, data) => { 
    try { 
      await updateDoc(doc(db, getCollectionPath('users'), uid), data); 
    } catch (e) { 
      alert('Erro: ' + e.message); 
    } 
  };
  
  const handleDeleteOffline = async (uid) => { 
    if (window.confirm('Tem certeza?')) {
      await deleteDoc(doc(db, getCollectionPath('users'), uid)); 
    }
  };

  const addOfflinePlayer = async (e) => {
    e.preventDefault();
    if (!newOfflineName.trim()) return;
    try {
      const fakeUid = 'offline_' + Date.now();
      await setDoc(doc(db, getCollectionPath('users'), fakeUid), {
        uid: fakeUid, 
        displayName: newOfflineName, 
        email: newOfflineEmail.trim() || `offline_${Date.now()}@noemail.com`,
        isOwner: false, 
        isOffline: true, 
        fines: 0, 
        balance: 0, 
        role: 'user', 
        avatar: getRandomAvatar(), 
        createdAt: serverTimestamp()
      });
      setNewOfflineName(''); 
      setNewOfflineEmail(''); 
      alert('Jogador adicionado!');
    } catch (err) { 
      alert('Erro: ' + err.message); 
    }
  };

  const startEditing = (user) => { 
    setEditingUserId(user.uid); 
    setEditName(user.displayName); 
    setEditEmail(user.email); 
  };
  
  const cancelEditing = () => { 
    setEditingUserId(null); 
    setEditName(''); 
    setEditEmail(''); 
  };
  
  const saveEdit = async (uid) => { 
    if (!editName.trim() || !editEmail.trim()) return alert('Preencha os campos!'); 
    await handleUpdateUser(uid, { displayName: editName, email: editEmail.trim() }); 
    setEditingUserId(null); 
  };

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
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gavel className="text-amber-400" /> Painel do Juiz
        </h2>
        <button 
          onClick={() => setShowSettings(true)} 
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-600 shadow-sm"
        >
          <Edit2 className="w-4 h-4" /> Regras
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex items-center justify-between">
          <div>
            <h4 className="text-red-400 font-bold text-sm flex items-center gap-2"><Trash2 className="w-4 h-4"/> Zerar Ranking Atual</h4>
            <p className="text-slate-400 text-[10px]">Move os jogos atuais para o Arquivo Morto.</p>
          </div>
          <button 
            onClick={handleResetSeason} 
            disabled={processing} 
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
          >
            {processing ? 'Zerando...' : 'ZERAR TUDO'}
          </button>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Cadastrar Sem Conta</h3>
          <form onSubmit={addOfflinePlayer} className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Nome..." 
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" 
                value={newOfflineName} 
                onChange={(e) => setNewOfflineName(e.target.value)} 
                required 
              />
              <input 
                type="email" 
                placeholder="E-mail real (opcional)" 
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white" 
                value={newOfflineEmail} 
                onChange={(e) => setNewOfflineEmail(e.target.value)} 
              />
            </div>
            <button className="bg-slate-700 text-white px-3 py-2 rounded text-xs font-bold w-full hover:bg-slate-600 transition-colors">
              Adicionar & Reservar E-mail
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-emerald-500 outline-none placeholder-slate-500" 
            placeholder="Buscar..." 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
          />
        </div>
        <select 
          className="w-full sm:w-auto bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-emerald-500 cursor-pointer" 
          value={filterType} 
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">Todos ({users.length})</option>
          <option value="debtors">Devedores 💸</option>
          <option value="banned">Banidos 🚫</option>
          <option value="offline">Offline 🤖</option>
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-bold ml-1 mb-2">Exibindo {filteredUsers.length} jogadores</p>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">
            Ninguém encontrado com esses filtros.
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.uid} className={`p-4 rounded-lg border flex flex-col gap-3 ${user.isOffline ? 'bg-slate-800/50 border-slate-700 border-dashed' : 'bg-slate-800 border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingUserId === user.uid ? (
                    <div className="flex flex-col gap-2 mb-2">
                      <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={editName} onChange={e => setEditName(e.target.value)} />
                      <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(user.uid)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">Salvar</button>
                        <button onClick={cancelEditing} className="bg-slate-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-white flex items-center gap-2">
                        <AvatarDisplay avatar={user.avatar} size="sm" />
                        {user.displayName}
                        {user.isOffline && <span className="text-[10px] bg-slate-600 px-1 rounded text-slate-300">OFFLINE</span>}
                        {user.isOffline && (
                          <button onClick={() => startEditing(user)} className="text-slate-500 hover:text-white p-1">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {user.email}
                        {user.isOffline && user.email.includes('@') && !user.email.includes('noemail.com') && (
                          <span className="text-emerald-500">(VINCULADO)</span>
                        )}
                      </p>
                    </>
                  )}
                  <div className="flex gap-2 mt-1">
                    {user.isOwner ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">DONO</span>
                    ) : (
                      <span className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">JOGADOR</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className={`block text-xl font-bold ${user.fines > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                    {user.fines || 0}
                  </span>
                  <span className="text-[10px] text-slate-500">MULTAS</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => handleUpdateUser(user.uid, { isOwner: !user.isOwner })} className="text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">
                  {user.isOwner ? 'Remover Dono' : 'Tornar Dono'}
                </button>
                {user.isOffline && (
                  <button onClick={() => handleDeleteOffline(user.uid)} className="text-xs bg-red-900/20 text-red-400 hover:bg-red-900/40 py-2 rounded flex justify-center items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Apagar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onOpenTransaction(user, 'fine')} className="text-xs border border-red-500/50 text-red-400 hover:bg-red-900/20 py-2 rounded flex items-center justify-center gap-1 font-bold">
                  + Multa
                </button>
                <button onClick={() => onOpenTransaction(user, 'payment')} className="text-xs bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 py-2 rounded font-bold border border-emerald-800">
                  Pagar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
