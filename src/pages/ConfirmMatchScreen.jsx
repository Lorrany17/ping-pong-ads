import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, getCollectionPath } from '../config/firebase';

export default function ConfirmMatchScreen({ matchId, currentUser, onComplete }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const docRef = doc(db, getCollectionPath('matches'), matchId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) { 
          setStatus('error'); 
          setLoading(false); 
          return; 
        }
        const data = snap.data();
        setMatch(data);
        if (data.status === 'confirmed') { 
          setStatus('already_confirmed'); 
          setLoading(false); 
          return; 
        }
        if (currentUser && data.createdBy === currentUser.uid) { 
          setStatus('denied_creator'); 
          setLoading(false); 
          return; 
        }
        setStatus('pending');
        setLoading(false);
      } catch (error) { 
        setStatus('error'); 
        setLoading(false); 
      }
    };
    fetchMatch();
  }, [matchId, currentUser]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, getCollectionPath('matches'), matchId);
      await updateDoc(docRef, { 
        status: 'confirmed', 
        confirmedBy: currentUser ? currentUser.uid : 'guest_device', 
        confirmedAt: serverTimestamp() 
      });
      setStatus('success'); 
      if (onComplete) setTimeout(onComplete, 2000);
    } catch (error) { 
      alert('Erro ao confirmar'); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Verificando...</div>;
  if (status === 'error') return <div className="p-8 text-center text-red-400 font-bold">Partida não encontrada</div>;
  if (status === 'denied_creator') return <div className="p-8 text-center text-amber-400 font-bold">Você não pode confirmar sua própria partida.</div>;
  if (status === 'already_confirmed' || status === 'success') return <div className="p-8 text-center text-emerald-400 font-bold">Partida Confirmada!</div>;

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-800 rounded-xl shadow-2xl m-4 border border-slate-700 relative z-10">
      <h2 className="text-xl font-bold text-white text-center mb-6">Confirmar Placar</h2>
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-xl mb-6">
        <div className="text-center">
          <span className="block text-2xl font-bold text-emerald-400">{match.s1}</span>
          <span className="text-xs text-slate-400">{match.p1Name}</span>
        </div>
        <span className="text-slate-600 font-bold">VS</span>
        <div className="text-center">
          <span className="block text-2xl font-bold text-white">{match.s2}</span>
          <span className="text-xs text-slate-400">{match.p2Name}</span>
        </div>
      </div>
      <button onClick={handleConfirm} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg">
        Confirmar
      </button>
    </div>
  );
}
