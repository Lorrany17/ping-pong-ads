export const getCurrentSeasonId = () => new Date().toISOString().slice(0, 7); 

export const getSeasonOptions = () => {
  const options = [{ value: 'legacy', label: '📂 Arquivo Morto (Antigos)' }];
  const date = new Date();
  for (let i = 0; i < 6; i++) {
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    options.push({ value, label: formattedLabel });
    date.setMonth(date.getMonth() - 1);
  }
  return options;
};
