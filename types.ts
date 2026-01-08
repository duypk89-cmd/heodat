
export enum Category {
  FOOD = 'Thực phẩm',
  HOUSEHOLD = 'Đồ gia dụng',
  COSMETICS = 'Mỹ phẩm',
  FASHION = 'Thời trang',
  HEALTH = 'Sức khỏe',
  OTHER = 'Khác'
}

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string; // Changed to string to support custom categories
  note: string;
  date: string;
  receiptImage?: string;
  isFamily?: boolean;
}

export interface Budget {
  monthly: number;
  weekly: number;
}

export interface FoodItem {
  id: string;
  name: string;
  expiryDate: string;
  quantity: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
}

export type AppTab = 'home' | 'history' | 'reports' | 'tools';
export type WalletMode = 'personal' | 'family';
export type AppTheme = 'pink' | 'mint' | 'lavender';
