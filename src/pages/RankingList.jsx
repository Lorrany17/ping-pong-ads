import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { AvatarDisplay } from '../components';
import { dateFilters, calculateBadges, BADGES_CONFIG, isPlayerBanned } from '../utils';

export default function RankingList({ matches, users, period, onSelectPlayer, config }) {
  const ranking = useMemo(() => {
    const stats = {};
    const nameToUid = {}; 

    // Inicializa estatísticas zeradas
    users.forEach(u => { 
      stats[u.uid] = { 
        ...u, 
        wins: 0, losses: 0, games: 0, 
        pointsScored: 0, pointsConceded: 0, pointDiff: 0,
        chilenasGiven: 0, chilenasReceived: 0   
      };
      if (u.displayName) nameToUid[u.displayName.toLowerCase().trim()] = u.uid;
    });
    
    // Função Auxiliar para Processar Resultado
    const processResult = (playerId, isWinner, sPro, sCon, isChilena) => {
      if (!playerId) return;
      
      // Tenta achar pelo ID, se não, tenta recuperar pelo nome (para convidados antigos ou bugs)
      let finalId = playerId;
      if (!stats[finalId] && nameToUid[finalId.toLowerCase?.()]) {
        finalId = nameToUid[finalId.toLowerCase()];
      }

      if (stats[finalId]) {
        stats[finalId].games++;
        stats[finalId].pointsScored += sPro;
        stats[finalId].pointsConceded += sCon;
        stats[finalId].pointDiff += (sPro - sCon);
        
        if (isWinner) {
          stats[finalId].wins++;
          if (isChilena) stats[finalId].chilenasGiven++;
        } else {
          stats[finalId].losses++;
          if (isChilena) stats[finalId].chilenasReceived++;
        }
      }
    };

    matches.forEach(m => {
      const isConfirmed = m.status === 'confirmed' || m.status === undefined || m.status === null;
      if (!isConfirmed) return; 

      if (period !== 'all') {
        const matchDate = m.createdAt ? m.createdAt.toDate() : new Date();
        if (!dateFilters[period](matchDate)) return; 
      }

      const s1 = Number(m.s1 || 0);
      const s2 = Number(m.s2 || 0);
      const p1Won = s1 > s2;

      // Processa Time 1 (J1 + Parceiro)
      processResult(m.p1Id, p1Won, s1, s2, m.isChilena);
      if (m.p1PartnerId) processResult(m.p1PartnerId, p1Won, s1, s2, m.isChilena);

      // Processa Time 2 (J2 + Parceiro)
      processResult(m.p2Id, !p1Won, s2, s1, m.isChilena);
      if (m.p2PartnerId) processResult(m.p2PartnerId, !p1Won, s2, s1, m.isChilena);
    });
    
    return Object.values(stats).filter(p => p.games > 0 || p.fines > 0).sort((a, b) => {
      const scoreA = a.wins - a.losses;
      const scoreB = b.wins - b.losses;
      if (scoreB !== scoreA) return scoreB - scoreA;
      if (b.wins !== a.wins) return b.wins - a.wins; 
      return b.pointDiff - a.pointDiff; 
    });
  }, [matches, users, period]);

  if (ranking.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500">
        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>Nenhum registro.</p>
      </div>
    );
  }

  const isChristmas = new Date().getMonth() === 11;

  return (
    <div className="space-y-3 relative z-10">
      {ranking.map((player, index) => {
        const isBanned = isPlayerBanned(player, config);
        const netScore = player.wins - player.losses;
        const isTop1 = index === 0 && !isBanned && isChristmas;
        const badges = calculateBadges(player);

        return (
          <div 
            key={player.uid} 
            onClick={() => onSelectPlayer(player)} 
            className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-colors hover:bg-slate-700/50 shadow-sm 
                ${isTop1 ? 'border-transparent' : (isBanned ? 'bg-red-900/20 border-red-800' : 'bg-slate-800 border-slate-700')}
            `}
            style={isTop1 ? {
              backgroundImage: 'linear-gradient(#1e293b, #1e293b), linear-gradient(45deg, #ef4444 25%, #ffffff 25%, #ffffff 50%, #ef4444 50%, #ef4444 75%, #ffffff 75%, #ffffff)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              border: '3px solid transparent',
              backgroundSize: '20px 20px'
            } : {}}
          >
            <div className="flex-shrink-0 w-8 text-center font-bold text-slate-400 text-xl">#{index + 1}</div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <AvatarDisplay avatar={player.avatar} size="sm" />
                <h3 className={`font-bold text-lg ${isBanned ? 'text-red-400' : 'text-white'}`}>{player.displayName}</h3>
                {player.isOwner && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Dono</span>}
              </div>
              
              {badges.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {badges.slice(0, 4).map(b => (
                    <span 
                      key={b} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        alert(`${BADGES_CONFIG[b].emoji} ${BADGES_CONFIG[b].title}:\n${BADGES_CONFIG[b].desc}`); 
                      }}
                      className="text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-600/50 cursor-help hover:scale-110 transition-transform" 
                    >
                      {BADGES_CONFIG[b].emoji}
                    </span>
                  ))}
                  {badges.length > 4 && <span className="text-[9px] text-slate-500 flex items-center bg-slate-900/50 px-1 rounded">+{badges.length - 4}</span>}
                </div>
              )}

              <p className="text-sm text-slate-400 mt-1">
                {player.wins}V • {player.losses}D <span className="text-xs text-slate-500">({player.games} jogos)</span>
              </p>
            </div>
            <div className="text-right">
              <span className={`block text-xl font-bold ${netScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netScore > 0 ? '+' : ''}{netScore}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Pontos</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
