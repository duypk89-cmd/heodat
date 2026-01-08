
export enum Category {
  FOOD = 'Thực phẩm',
  HOUSEHOLD = 'Đồ gia dụng',
  COSMETICS = 'Mỹ phẩm',
  FASHION = 'Thời trang',
  HEALTH = 'Sức khỏe',
  OTHER = 'Khác'
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  is_family: boolean;
  created_at?: string;
}

export interface FoodItem {
  id: string;
  user_id: string;
  name: string;
  expiryDate: string;
  quantity: string;
  created_at?: string;
}

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  completed: boolean;
  created_at?: string;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
  color?: string;
  created_at?: string;
}

export type AppTab = 'home' | 'history' | 'reports' | 'tools';
export type WalletMode = 'personal' | 'family';
export type AppTheme = 'pink' | 'mint' | 'lavender';
