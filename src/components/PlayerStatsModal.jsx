import React from 'react';
import { Trophy, XCircle, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import { calculateBadges, BADGES_CONFIG } from '../utils';

export default function PlayerStatsModal({ player, onClose }) {
  if (!player) return null;
  const netScore = player.wins - player.losses;
  const winRate = player.games > 0 ? Math.round((player.wins / player.games) * 100) : 0;
  const activeBadges = calculateBadges(player);

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <AvatarDisplay avatar={player.avatar} size="lg" className="border-2 border-emerald-500" />
            <div>
              <h2 className="text-xl font-bold text-white">{player.displayName}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${player.isOwner ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                {player.isOwner ? 'Dono da Raquete' : 'Jogador'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-700 rounded-full p-1">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {activeBadges.length > 0 && (
          <div className="mb-5 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" /> Conquistas Desbloqueadas
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {activeBadges.map(badgeKey => {
                const info = BADGES_CONFIG[badgeKey];
                if (!info) return null;
                return (
                  <div key={badgeKey} className="flex flex-col items-center bg-slate-800 p-2 rounded-lg border border-slate-700 min-w-[70px] shadow-sm relative group cursor-help">
                    <span className="text-2xl mb-1 filter drop-shadow-md">{info.emoji}</span>
                    <span className={`text-[9px] font-bold text-center leading-tight ${info.color}`}>{info.title}</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[150px] bg-black text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl border border-slate-600">
                      {info.desc}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Pontuação</span>
            <div className={`text-2xl font-black ${netScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netScore > 0 ? '+' : ''}{netScore}
            </div>
            <span className="text-[10px] text-slate-500">Vitórias - Derrotas</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Aproveitamento</span>
            <div className="text-2xl font-black text-white">{winRate}%</div>
            <span className="text-[10px] text-slate-500">{player.wins}V / {player.losses}D</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-slate-700/30 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Total Partidas
            </span>
            <span className="font-bold text-white">{player.games}</span>
          </div>
          <div className="bg-slate-700/30 p-3 rounded-lg flex justify-between items-center border-t border-slate-600 mt-2 pt-2">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Saldo de Pontos
            </span>
            <span className={`font-bold ${player.pointDiff >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {player.pointDiff > 0 ? '+' : ''}{player.pointDiff}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-slate-700/30 p-3 rounded-lg flex flex-col items-center text-center">
              <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" fill="currentColor" /> Chilenas Dadas
              </span>
              <span className="font-bold text-white text-lg">{player.chilenasGiven}</span>
            </div>
            <div className="bg-slate-700/30 p-3 rounded-lg flex flex-col items-center text-center">
              <span className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-500" /> Chilenas Tomadas
              </span>
              <span className="font-bold text-white text-lg">{player.chilenasReceived}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
