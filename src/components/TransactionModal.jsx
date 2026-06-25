import React, { useState, useEffect } from 'react';
import { MinusCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, getCollectionPath } from '../config/firebase';

export default function TransactionModal({ user, action, onClose, config }) {
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
        userId: user.uid, 
        type: action, 
        amount: value, 
        description: description, 
        createdAt: serverTimestamp()
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
    } catch (e) { 
      alert('Erro: ' + e.message); 
    } finally { 
      setLoading(false); 
    }
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
            <input 
              type="number" 
              step="0.50" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1 text-lg font-bold" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
          </div>
          {action === 'payment' && (
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <label className="text-xs font-bold text-slate-400 block mb-2">QUITA QUANTAS INFRAÇÕES?</label>
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setFinesToClear(Math.max(0, finesToClear - 1))} 
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                >
                  <Minus className="w-4 h-4"/>
                </button>
                <span className="text-white font-bold">{finesToClear}</span>
                <button 
                  onClick={() => setFinesToClear(finesToClear + 1)} 
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                >
                  <Plus className="w-4 h-4"/>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-center">Reduz a contagem para liberar o jogador.</p>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-400">MOTIVO / DESCRIÇÃO</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mt-1" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className={`w-full text-white font-bold py-3 rounded-xl shadow-lg ${
              action === 'fine' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
          <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
