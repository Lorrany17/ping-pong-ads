import React, { useState } from 'react';
import { Gavel } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, getCollectionPath } from '../config/firebase';

export default function SettingsModal({ config, onClose }) {
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
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gavel className="text-amber-400"/> Regras do Jogo
        </h2>
        
        <div className="space-y-4">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Preço das Multas (R$)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500">JOGADOR</label>
                <input 
                  type="number" 
                  step="0.5" 
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" 
                  value={values.finePricePlayer} 
                  onChange={e => handleChange('finePricePlayer', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">DONO</label>
                <input 
                  type="number" 
                  step="0.5" 
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" 
                  value={values.finePriceOwner} 
                  onChange={e => handleChange('finePriceOwner', e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Limite de Banimento (Infrações)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500">JOGADOR</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" 
                  value={values.banThresholdPlayer} 
                  onChange={e => handleChange('banThresholdPlayer', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">DONO</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold" 
                  value={values.banThresholdOwner} 
                  onChange={e => handleChange('banThresholdOwner', e.target.value)} 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg mt-2"
          >
            {loading ? 'Salvando...' : 'Salvar Regras'}
          </button>
          <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
