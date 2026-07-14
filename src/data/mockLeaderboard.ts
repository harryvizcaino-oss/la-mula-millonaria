export interface Player {
  id: number;
  name: string;
  avatar: string;
  score: number;
  millas: number;
  distance: number;
  level: number;
  trend: 'up' | 'down' | 'same';
  trendValue: number;
  isFriend?: boolean;
}

export const mockPlayers: Player[] = [
  { id: 1, name: 'CarlosM', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosM', score: 45230, millas: 12500, distance: 8420, level: 42, trend: 'up', trendValue: 3 },
  { id: 2, name: 'AnaR23', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnaR23', score: 38940, millas: 10800, distance: 7210, level: 38, trend: 'up', trendValue: 1 },
  { id: 3, name: 'TruckKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TruckKing', score: 31200, millas: 8900, distance: 6100, level: 35, trend: 'down', trendValue: 2 },
  { id: 4, name: 'MariaSpeed', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaSpeed', score: 28450, millas: 7600, distance: 5400, level: 31, trend: 'up', trendValue: 5 },
  { id: 5, name: 'DiegoTruck', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DiegoTruck', score: 27100, millas: 7200, distance: 5100, level: 29, trend: 'same', trendValue: 0 },
  { id: 6, name: 'LuciaRun', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LuciaRun', score: 25600, millas: 6800, distance: 4800, level: 28, trend: 'up', trendValue: 2 },
  { id: 7, name: 'PedroMax', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PedroMax', score: 24300, millas: 6500, distance: 4500, level: 26, trend: 'down', trendValue: 1 },
  { id: 8, name: 'SofiaFast', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SofiaFast', score: 23800, millas: 6100, distance: 4300, level: 25, trend: 'up', trendValue: 4 },
  { id: 9, name: 'JuanRider', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JuanRider', score: 22100, millas: 5800, distance: 4000, level: 24, trend: 'down', trendValue: 3 },
  { id: 10, name: 'ElenaPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ElenaPro', score: 21500, millas: 5400, distance: 3800, level: 23, trend: 'up', trendValue: 1 },
  { id: 11, name: 'MiguelTop', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MiguelTop', score: 20800, millas: 5100, distance: 3600, level: 22, trend: 'same', trendValue: 0 },
  { id: 12, name: 'IsabelGo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IsabelGo', score: 19400, millas: 4800, distance: 3400, level: 21, trend: 'up', trendValue: 2 },
  { id: 13, name: 'AndresFX', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AndresFX', score: 18700, millas: 4600, distance: 3200, level: 20, trend: 'down', trendValue: 1 },
  { id: 14, name: 'CarmenZ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CarmenZ', score: 17200, millas: 4200, distance: 3000, level: 19, trend: 'up', trendValue: 3 },
  { id: 15, name: 'RaulDrive', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RaulDrive', score: 16800, millas: 4000, distance: 2800, level: 18, trend: 'down', trendValue: 2 },
  { id: 16, name: 'NataliaX', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NataliaX', score: 15400, millas: 3800, distance: 2600, level: 17, trend: 'up', trendValue: 1 },
  { id: 17, name: 'TomasRun', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TomasRun', score: 14800, millas: 3600, distance: 2500, level: 16, trend: 'same', trendValue: 0 },
  { id: 18, name: 'PaulaV', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PaulaV', score: 13500, millas: 3200, distance: 2300, level: 15, trend: 'down', trendValue: 1 },
  { id: 19, name: 'HectorG', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HectorG', score: 12900, millas: 3000, distance: 2100, level: 14, trend: 'up', trendValue: 2 },
  { id: 20, name: 'DianaMax', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DianaMax', score: 11800, millas: 2800, distance: 1900, level: 13, trend: 'up', trendValue: 1 },
];

export const mockCurrentUser: Player & { rank: number } = {
  id: 999,
  name: 'Tu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
  score: 15230,
  millas: 15420,
  distance: 4150,
  level: 18,
  trend: 'up',
  trendValue: 5,
  rank: 42,
};

export const mockFriends: Player[] = [
  { id: 101, name: 'AnaR23', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnaR23', score: 38940, millas: 10800, distance: 7210, level: 38, trend: 'up', trendValue: 1, isFriend: true },
  { id: 102, name: 'TruckKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TruckKing', score: 31200, millas: 8900, distance: 6100, level: 35, trend: 'down', trendValue: 2, isFriend: true },
  { id: 103, name: 'MariaSpeed', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaSpeed', score: 28450, millas: 7600, distance: 5400, level: 31, trend: 'up', trendValue: 5, isFriend: true },
  { id: 104, name: 'PedroMax', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PedroMax', score: 24300, millas: 6500, distance: 4500, level: 26, trend: 'down', trendValue: 1, isFriend: true },
  { id: 999, name: 'Tu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You', score: 15230, millas: 15420, distance: 4150, level: 18, trend: 'up', trendValue: 5, isFriend: true },
];

export const weeklyPrizes = [
  { rank: 1, prize: '5,000 TicaMillas + Gift Card $10,000', icon: 'crown', color: 'from-[#FFD700] to-[#F59E0B]' },
  { rank: 2, prize: '3,000 TicaMillas + Audifonos BT', icon: 'medal', color: 'from-[#C0C0C0] to-[#94A3B8]' },
  { rank: 3, prize: '1,500 TicaMillas + Botella Termica', icon: 'award', color: 'from-[#CD7F32] to-[#D97706]' },
];
