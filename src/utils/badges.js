export const BADGES_CONFIG = {
  'vip':        { emoji: '💼', title: 'Sócio',       desc: 'Dono da raquete (VIP)', color: 'text-amber-400' },
  'natal':      { emoji: '🎅', title: 'Natalino',    desc: 'Jogou em Dezembro', color: 'text-red-400' },
  'invicto':    { emoji: '🛡️', title: 'Invicto',     desc: 'Sem derrotas (min 5 jogos)', color: 'text-blue-400' },
  'veterano':   { emoji: '🎖️', title: 'Veterano',    desc: '50+ partidas jogadas', color: 'text-slate-300' },
  'artilheiro': { emoji: '⚽', title: 'Artilheiro',  desc: '200+ pontos marcados', color: 'text-emerald-400' },
  'paredao':    { emoji: '🧱', title: 'Paredão',     desc: 'Saldo de pontos > 50', color: 'text-orange-400' },
  'zica':       { emoji: '👻', title: 'Azarado',      desc: 'Só derrotas (min 5 jogos)', color: 'text-purple-400' }
};

export const calculateBadges = (player) => {
  const active = [];
  if (player.isOwner) active.push('vip');
  if (new Date().getMonth() === 11) active.push('natal');
  
  if (player.wins > 0 && player.losses === 0 && player.games >= 5) active.push('invicto');
  if (player.games >= 50) active.push('veterano');
  if (player.pointsScored >= 200) active.push('artilheiro');
  if (player.pointDiff >= 50) active.push('paredao');
  if (player.wins === 0 && player.losses >= 5) active.push('zica');

  return active;
};
