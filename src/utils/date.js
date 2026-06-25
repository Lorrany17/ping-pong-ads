export const dateFilters = {
  day: d => new Date(d).toDateString() === new Date().toDateString(),
  week: d => {
    const date = new Date(d), today = new Date();
    const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff)); monday.setHours(0,0,0,0);
    return date >= monday;
  },
  month: d => {
    const date = new Date(d), today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  },
  all: () => true
};
