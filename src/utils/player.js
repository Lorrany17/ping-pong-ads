import { DEFAULT_CONFIG } from '../config/firebase';

export const isPlayerBanned = (user, config = DEFAULT_CONFIG) => {
  if (!user) return false;
  const fines = user.fines || 0;
  const threshold = user.isOwner ? Number(config.banThresholdOwner) : Number(config.banThresholdPlayer);
  return fines >= threshold;
};
