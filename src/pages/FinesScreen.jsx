import React, { useState, useEffect } from 'react';
import { Banknote, PlusCircle, Receipt, ChevronUp, ChevronDown } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, getCollectionPath } from '../config/firebase';
import { isPlayerBanned } from '../utils';
import { UserSelectModal, AvatarDisplay } from '../components';

export default function FinesScreen({ users, isAdmin, onOpenTransaction }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showUserSelect, setShowUserSelect] = useState(false);

  const finesList = users.filter(u => u.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const totalDebt = finesList.reduce((acc, u) => acc + (u.balance || 0), 0);

  useEffect(() => {
    if (!selectedUser) return;
    const q = query(
      collection(db, getCollectionPath('transactions')), 
      where('userId', '==', selectedUser.uid), 
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => { 
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
    });
    return () => unsub();
  }, [selectedUser]);

  return (
    <div className="space-y-6 pb-20 relative z-10">
      {showUserSelect && (
        <UserSelectModal 
          users={users} 
          onClose={() => setShowUserSelect(false)} 
          onSelect={(user) => { 
            setShowUserSelect(false); 
            onOpenTransaction(user, 'fine'); 
          }} 
        />
      )}
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Banknote className="text-red-400" /> Financeiro
        </h2>
        {isAdmin && (
          <button 
            onClick={() => setShowUserSelect(true)} 
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-lg"
          >
            <PlusCircle className="w-3 h-3" /> Aplicar Multa
          </button>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-lg">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total a Receber</span>
        <div className="text-4xl font-bold text-emerald-400 mt-2">R$ {totalDebt.toFixed(2).replace('.', ',')}</div>
      </div>

      {selectedUser && (
        <div className="bg-slate-800 rounded-xl border border-slate-600 overflow-hidden animate-in slide-in-from-bottom-5">
          <div 
            className="bg-slate-700 p-3 flex justify-between items-center cursor-pointer" 
            onClick={() => setSelectedUser(null)}
          >
            <span className="font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Extrato: {selectedUser.displayName}
            </span>
            <ChevronUp className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="p-3 max-h-60 overflow-y-auto space-y-2">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 text-xs">Sem histórico.</p>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 last:border-0">
                  <div>
                    <span className={`font-bold block ${t.type === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {t.type === 'fine' ? 'Multa' : 'Pagamento'}
                    </span>
                    <span className="text-xs text-slate-400">{t.description}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {t.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`font-bold ${t.type === 'fine' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {t.type === 'fine' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {finesList.length === 0 ? (
          <div className="text-center text-slate-500 py-10">Ninguém deve nada! 🙌</div>
        ) : (
          finesList.map(user => (
            <div key={user.uid} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between shadow-sm">
              <div 
                className="flex items-center gap-3 cursor-pointer" 
                onClick={() => setSelectedUser(selectedUser?.uid === user.uid ? null : user)}
              >
                <AvatarDisplay avatar={user.avatar} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{user.displayName}</span>
                    {isPlayerBanned(user) && (
                      <span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse">BANIDO</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    {user.fines} infrações <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-red-400">R$ {(user.balance || 0).toFixed(2).replace('.', ',')}</span>
                {isAdmin && (
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => onOpenTransaction(user, 'payment')} 
                      className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-800 hover:bg-emerald-900/50 font-bold"
                    >
                      PAGAR
                    </button>
                    <button 
                      onClick={() => onOpenTransaction(user, 'fine')} 
                      className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800 hover:bg-red-900/50 font-bold"
                    >
                      + MULTA
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
