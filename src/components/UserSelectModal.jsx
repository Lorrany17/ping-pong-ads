import React, { useState } from 'react';
import { Search, XCircle, UserPlus } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, getCollectionPath } from '../config/firebase';
import { getRandomAvatar, isPlayerBanned } from '../utils';
import AvatarDisplay from './AvatarDisplay';

export default function UserSelectModal({ users, onClose, onSelect }) {
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
}
