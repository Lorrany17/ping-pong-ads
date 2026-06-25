import React, { useState } from 'react';
import { History, Search, Calendar, Clock, CheckCircle, QrCode, Trash2, Check, Zap, Trophy } from 'lucide-react';

export default function HistoryScreen({ 
  matchesList, 
  user, 
  isAdmin, 
  handleDeleteMatch, 
  handleForceConfirm, 
  handleP2Confirm, 
  setPendingConfirmationMatchId, 
  setConfirmMatchId 
}) {
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredHistory = matchesList.filter(m => {
    const matchDate = m.createdAt ? m.createdAt.toDate() : new Date();
    const dateStr = matchDate.toLocaleDateString('en-CA'); 
    if (historyDate && dateStr !== historyDate) return false;
    
    if (historySearch) {
      const term = historySearch.toLowerCase();
      const p1 = m.p1Name ? m.p1Name.toLowerCase() : '';
      const p2 = m.p2Name ? m.p2Name.toLowerCase() : '';
      const p1Partner = m.p1PartnerName ? m.p1PartnerName.toLowerCase() : '';
      const p2Partner = m.p2PartnerName ? m.p2PartnerName.toLowerCase() : '';
      return p1.includes(term) || p2.includes(term) || p1Partner.includes(term) || p2Partner.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><History className="text-cyan-400" /> Histórico</h2>
      </div>
      
      <div className="flex gap-2 mb-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
          <input 
            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-emerald-500 outline-none placeholder-slate-500" 
            placeholder="Buscar jogador..." 
            value={historySearch} 
            onChange={e => setHistorySearch(e.target.value)} 
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none"/>
          <input 
            type="date" 
            className="bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:border-emerald-500 outline-none appearance-none" 
            value={historyDate} 
            onChange={e => setHistoryDate(e.target.value)} 
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <p>Nenhuma partida encontrada para esta data.</p>
          <button onClick={() => setHistoryDate('')} className="text-emerald-400 text-sm mt-2 hover:underline">Ver todo o histórico</button>
        </div>
      ) : (
        filteredHistory.map(m => {
          const p1Won = m.s1 > m.s2;

          return (
            <div key={m.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm relative">
              <div className="bg-slate-900/50 px-3 py-1.5 flex justify-between items-center border-b border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 
                  {m.createdAt ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '🕒 Enviando...'}
                  {m.isDoubles && <span className="ml-2 text-blue-400 bg-blue-900/20 px-1.5 rounded border border-blue-500/20">DUPLA</span>}
                </span>
                
                {m.status === 'confirmed' ? (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Confirmado
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                    <History className="w-3 h-3" /> Pendente
                  </div>
                )}
              </div>

              <div className="p-3 flex flex-col gap-2">
                
                {/* LINHA TIME 1 */}
                <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${p1Won ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-l-2 border-emerald-500' : 'opacity-70'}`}>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${p1Won ? 'text-white' : 'text-slate-400'}`}>
                      {m.p1Name}
                    </span>
                    {m.p1PartnerName && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="text-[9px] bg-slate-700 px-1 rounded">e</span> {m.p1PartnerName}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {!p1Won && m.s1 === 4 && !m.isSimpleWin && (
                      <span className="text-[8px] font-black text-pink-500 border border-pink-500/50 px-1 rounded bg-pink-500/10 transform -rotate-6">
                        👠 PUTA
                      </span>
                    )}
                    
                    {m.isSimpleWin ? (
                      p1Won ? <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-md" /> : <span className="text-slate-600 font-bold text-lg">—</span>
                    ) : (
                      <span className={`text-xl font-black ${p1Won ? 'text-emerald-400' : 'text-slate-500'}`}>{m.s1}</span>
                    )}
                  </div>
                </div>

                {/* LINHA TIME 2 */}
                <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${!p1Won ? 'bg-gradient-to-r from-emerald-900/20 to-transparent border-l-2 border-emerald-500' : 'opacity-70'}`}>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${!p1Won ? 'text-white' : 'text-slate-400'}`}>
                      {m.p2Name}
                    </span>
                    {m.p2PartnerName && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="text-[9px] bg-slate-700 px-1 rounded">e</span> {m.p2PartnerName}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {p1Won && m.s2 === 4 && !m.isSimpleWin && (
                      <span className="text-[8px] font-black text-pink-500 border border-pink-500/50 px-1 rounded bg-pink-500/10 transform -rotate-6">
                        👠 PUTA
                      </span>
                    )}

                    {m.isSimpleWin ? (
                      !p1Won ? <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-md" /> : <span className="text-slate-600 font-bold text-lg">—</span>
                    ) : (
                      <span className={`text-xl font-black ${!p1Won ? 'text-emerald-400' : 'text-slate-500'}`}>{m.s2}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé (Ações) */}
              {(m.isChilena || (user && (m.status !== 'confirmed' || isAdmin))) && (
                <div className="px-3 pb-3 pt-0 flex justify-between items-center">
                  <div>
                    {m.isChilena && (
                      <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-yellow-500" /> CHILENA
                      </span>
                    )}
                  </div>
                  
                  {(m.status !== 'confirmed' || isAdmin) && user && (
                    <div className="flex gap-2">
                      {m.createdBy === user.uid && m.p2Id.startsWith('guest_') && (
                        <button 
                          onClick={() => setPendingConfirmationMatchId(m.id)} 
                          className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      
                      {m.createdBy === user.uid && !isAdmin && (
                        <button 
                          onClick={() => handleDeleteMatch(m.id)} 
                          className="p-1.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50" 
                          title="Cancelar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {m.p2Id === user.uid && (
                        <button 
                          onClick={() => handleP2Confirm(m.id)} 
                          className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500" 
                          title="Confirmar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          {m.status !== 'confirmed' && (
                            <button 
                              onClick={() => handleForceConfirm(m.id)} 
                              className="p-1.5 bg-amber-600 text-white rounded hover:bg-amber-500" 
                              title="Validar Forçado"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteMatch(m.id)} 
                            className="p-1.5 bg-red-600 text-white rounded hover:bg-red-500" 
                            title="Excluir (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
