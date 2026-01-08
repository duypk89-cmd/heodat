
import React, { useState, useEffect, useMemo } from 'react';
import { AppTab, Expense, Category, Budget, FoodItem, ShoppingItem, WalletMode, SavingGoal, AppTheme, CustomCategory } from './types';
import { Navigation } from './components/Navigation';
import { ExpenseForm } from './components/ExpenseForm';
import { PiggyBank } from './components/PiggyBank';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { getShoppingAdvice, getMarketHandbook } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthly: 5000000, weekly: 1250000 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [walletMode, setWalletMode] = useState<WalletMode>('personal');
  const [mascotQuote, setMascotQuote] = useState<string>("Mây ơi, hôm nay đi chợ nhớ mang túi vải nhé! ✨");
  const [isMascotLoading, setIsMascotLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>('pink');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [bankNotification, setBankNotification] = useState<{msg: string, amount: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [handbookContent, setHandbookContent] = useState<string | null>(null);
  const [isHandbookLoading, setIsHandbookLoading] = useState(false);

  // Persist data
  useEffect(() => {
    const data = {
      expenses: localStorage.getItem('expenses'),
      food: localStorage.getItem('foodItems'),
      shop: localStorage.getItem('shoppingList'),
      budget: localStorage.getItem('budget'),
      goals: localStorage.getItem('savingGoals'),
      theme: localStorage.getItem('appTheme'),
      customCats: localStorage.getItem('customCategories')
    };
    
    if (data.expenses) setExpenses(JSON.parse(data.expenses));
    if (data.food) setFoodItems(JSON.parse(data.food));
    if (data.shop) setShoppingList(JSON.parse(data.shop));
    if (data.budget) setBudget(JSON.parse(data.budget));
    if (data.goals) setSavingGoals(JSON.parse(data.goals));
    if (data.theme) setAppTheme(data.theme as AppTheme);
    if (data.customCats) setCustomCategories(JSON.parse(data.customCats));

    if (!data.expenses) {
      const now = new Date();
      setExpenses([
        { id: '1', amount: 50000, category: Category.FOOD, note: 'Rau củ sáng nay', date: now.toISOString(), isFamily: false },
        { id: '2', amount: 250000, category: Category.COSMETICS, note: 'Sữa rửa mặt', date: now.toISOString(), isFamily: false }
      ]);
      setSavingGoals([{ id: 'g1', name: 'Túi xách Chanel 👜', targetAmount: 2000000, savedAmount: 450000, icon: '👜' }]);
      setFoodItems([
        { id: 'f1', name: 'Sữa tươi', expiryDate: new Date(Date.now() + 86400000).toISOString(), quantity: '1 hộp' },
        { id: 'f2', name: 'Trứng gà', expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(), quantity: '10 quả' }
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('foodItems', JSON.stringify(foodItems));
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    localStorage.setItem('budget', JSON.stringify(budget));
    localStorage.setItem('savingGoals', JSON.stringify(savingGoals));
    localStorage.setItem('appTheme', appTheme);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [expenses, foodItems, shoppingList, budget, savingGoals, appTheme, customCategories]);

  // Bank notification simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setBankNotification({ msg: "Techcombank: -85,000đ tại Phúc Long Coffee", amount: 85000 });
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const themeConfig = {
    pink: { 
      primary: 'text-pink-500', 
      bg: 'bg-[#FFF5F7]', 
      card: 'bg-white', 
      gradient: 'from-[#FFDEE9] to-[#FFD1FF]',
      accent: 'bg-pink-100 text-pink-600',
      btn: 'bg-gradient-to-r from-pink-400 to-rose-400'
    },
    mint: { 
      primary: 'text-emerald-500', 
      bg: 'bg-[#F0FFF4]', 
      card: 'bg-white', 
      gradient: 'from-[#E0FFF4] to-[#C1FFD7]',
      accent: 'bg-emerald-100 text-emerald-600',
      btn: 'bg-gradient-to-r from-emerald-400 to-teal-400'
    },
    lavender: { 
      primary: 'text-purple-500', 
      bg: 'bg-[#F5F3FF]', 
      card: 'bg-white', 
      gradient: 'from-[#E2E2FF] to-[#D1D1FF]',
      accent: 'bg-purple-100 text-purple-600',
      btn: 'bg-gradient-to-r from-purple-400 to-indigo-400'
    }
  };

  const currentTheme = themeConfig[appTheme];

  const filteredExpenses = useMemo(() => {
    let list = walletMode === 'personal' ? expenses.filter(e => !e.isFamily) : expenses;
    if (searchQuery) {
      list = list.filter(e => e.note.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [expenses, walletMode, searchQuery]);

  const totalSpent = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), [filteredExpenses]);
  const savings = Math.max(budget.monthly - totalSpent, 0);

  const expiringItems = useMemo(() => {
    return foodItems.filter(item => {
      const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000);
      return daysLeft <= 2 && daysLeft >= 0;
    });
  }, [foodItems]);

  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const expense: Expense = { ...newExp, id: Math.random().toString(36).substr(2, 9), isFamily: walletMode === 'family' };
    setExpenses([expense, ...expenses]);
    setBankNotification(null);
  };

  const handleUpdateGoal = (id: string, add: number) => {
    setSavingGoals(savingGoals.map(g => g.id === id ? { ...g, savedAmount: Math.min(g.savedAmount + add, g.targetAmount) } : g));
  };

  const handleAskMascot = async () => {
    if (isMascotLoading) return;
    setIsMascotLoading(true);
    try {
      const items = shoppingList.map(i => i.name);
      if (items.length === 0) {
        setMascotQuote("Mây ơi, thêm vài món vào danh sách mua sắm để Mây tư vấn mẹo hay nhé! ✨");
      } else {
        const advice = await getShoppingAdvice(items);
        setMascotQuote(advice || "Mây bận quá, chưa nghĩ ra mẹo gì rồi!");
      }
    } catch (e) {
      setMascotQuote("Có lỗi xíu rồi, Mây thử lại sau nha! 🌸");
    } finally {
      setIsMascotLoading(false);
    }
  };

  const handleOpenHandbook = async (topic: 'prices' | 'freshness' | 'recipes') => {
    setIsHandbookLoading(true);
    setHandbookContent(null);
    try {
      const content = await getMarketHandbook(topic);
      setHandbookContent(content || "Mây không tìm thấy thông tin rồi...");
    } catch (e) {
      setHandbookContent("Lỗi rồi, Mây ơi!");
    } finally {
      setIsHandbookLoading(false);
    }
  };

  const trendData = useMemo(() => {
    const days: any[] = [];
    const now = new Date();
    for(let i=6; i>=0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const amount = filteredExpenses.filter(e => new Date(e.date).toDateString() === d.toDateString()).reduce((s, e) => s + e.amount, 0);
      days.push({ name: label, amount });
    }
    return days;
  }, [filteredExpenses]);

  const categoryData = useMemo(() => {
    const map: any = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-8 text-center`}>
        <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl mb-12 animate-soft-bounce">
          <span className="text-7xl">🐷</span>
        </div>
        <h1 className={`text-5xl font-black ${currentTheme.primary} mb-4 tracking-tighter`}>Gói Ghém</h1>
        <p className="text-gray-500 mb-12 font-medium">"Gói ghém yêu thương, chi tiêu thông thái"</p>
        <button onClick={() => setIsLoggedIn(true)} className={`${currentTheme.btn} w-full max-w-xs text-white font-bold py-4 px-8 rounded-[24px] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all`}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa_list/google.svg" className="w-5 h-5" alt="Google" />
          Vào bếp cùng Mây
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-32 relative ${currentTheme.bg}`}>
      {/* Simulation: Bank Alert */}
      {bankNotification && activeTab === 'home' && (
        <div className="fixed top-24 left-6 right-6 z-[100] bg-white rounded-[28px] p-5 shadow-2xl border-l-8 border-pink-400 animate-in slide-in-from-top duration-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-1">
              <i className="fa-solid fa-building-columns"></i> Thông báo ngân hàng
            </span>
            <button onClick={() => setBankNotification(null)} className="text-gray-300 hover:text-gray-500"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <p className="text-xs text-gray-800 font-bold mb-4">{bankNotification.msg}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => handleAddExpense({ amount: bankNotification.amount, category: Category.OTHER, note: 'Cà phê Phúc Long', date: new Date().toISOString() })}
              className={`flex-1 ${currentTheme.btn} text-white text-[10px] font-black py-2 rounded-xl shadow-md`}
            >Lưu ngay ✨</button>
            <button onClick={() => setBankNotification(null)} className="flex-1 bg-gray-50 text-gray-400 text-[10px] font-black py-2 rounded-xl">Bỏ qua</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex justify-between items-center sticky top-0 bg-inherit/80 backdrop-blur-md z-40">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">Chào Mây! <span className="animate-pulse">🌸</span></h1>
          <p className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.primary}`}>Nội trợ bận rộn</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setWalletMode(walletMode === 'personal' ? 'family' : 'personal')}
            className={`px-4 py-2 rounded-full text-[10px] font-black transition-all shadow-sm ${walletMode === 'family' ? 'bg-purple-500 text-white' : currentTheme.accent}`}
          >
            {walletMode === 'family' ? 'Ví Gia Đình 👨‍👩‍👧' : 'Cá Nhân 👩'}
          </button>
          <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-sm border-white`}>
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Mây" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Balance Cloud */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${currentTheme.gradient} rounded-[48px] p-8 text-gray-800 shadow-2xl border border-white/50`}>
              <div className="absolute -top-10 -right-10 opacity-10"><i className="fa-solid fa-cloud text-[240px]"></i></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Số dư còn gói ghém</p>
                <h2 className="text-4xl font-black mb-8">{(budget.monthly - totalSpent).toLocaleString()}đ</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/40 p-3 rounded-3xl backdrop-blur-md border border-white/20">
                    <span className="block text-[8px] font-black uppercase opacity-50">Đã tiêu tháng này</span>
                    <span className="text-sm font-black text-rose-500">{totalSpent.toLocaleString()}đ</span>
                  </div>
                  <div className="bg-white/40 p-3 rounded-3xl backdrop-blur-md border border-white/20">
                    <span className="block text-[8px] font-black uppercase opacity-50">Tiết kiệm hũ heo</span>
                    <span className="text-sm font-black text-emerald-600">{savings.toLocaleString()}đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Food Expiry Alert */}
            {expiringItems.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-[32px] flex items-center gap-4 animate-soft-bounce shadow-sm">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 text-2xl shadow-inner">
                  <i className="fa-solid fa-hourglass-start"></i>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Sắp hết hạn rồi Mây ơi!</h4>
                  <p className="text-xs font-bold text-gray-700">{expiringItems.map(i => i.name).join(', ')} cần dùng ngay nha!</p>
                </div>
              </div>
            )}

            <PiggyBank savings={savings} />

            {/* Mascot interaction */}
            <div className="bg-white p-5 rounded-[32px] shadow-sm border border-pink-50 flex items-center gap-5 group relative">
              <div onClick={handleAskMascot} className={`w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-sm ${currentTheme.accent}`}>
                <span className="text-4xl">{isMascotLoading ? '⏳' : '🐰'}</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-pink-400 uppercase mb-1 tracking-widest">Thỏ Trợ Lý</p>
                <p className="text-xs text-gray-600 italic font-medium">"{mascotQuote}"</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Hóa đơn', icon: 'fa-receipt', color: 'bg-blue-50 text-blue-500', onClick: () => setIsFormOpen(true) },
                { label: 'Mẹo chợ', icon: 'fa-lightbulb', color: 'bg-amber-50 text-amber-500', onClick: () => { setActiveTab('tools'); handleOpenHandbook('freshness'); } },
                { label: 'Nấu ăn', icon: 'fa-utensils', color: 'bg-purple-50 text-purple-500', onClick: () => { setActiveTab('tools'); handleOpenHandbook('recipes'); } },
                { label: 'Tủ lạnh', icon: 'fa-snowflake', color: 'bg-emerald-50 text-emerald-500', onClick: () => setActiveTab('tools') }
              ].map(action => (
                <div key={action.label} className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={action.onClick}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${action.color}`}>
                    <i className={`fa-solid ${action.icon}`}></i>
                  </div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in slide-in-from-bottom duration-500 space-y-4">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Sổ tay chi tiêu</h2>
            <div className="bg-white rounded-[24px] px-4 py-2 flex items-center gap-3 border border-gray-100 mb-6">
              <i className="fa-solid fa-magnifying-glass text-gray-300 text-sm"></i>
              <input 
                type="text" 
                placeholder="Tìm giao dịch, ghi chú..." 
                className="bg-transparent outline-none w-full text-sm font-medium py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 group transition-all hover:border-pink-200">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: CATEGORY_COLORS[exp.category as Category] || '#E5E7EB' + '40' }}>
                        {CATEGORY_ICONS[exp.category as Category] || <i className="fa-solid fa-tag text-gray-400"></i>}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">{exp.note || exp.category}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(exp.date).toLocaleDateString('vi-VN')}</p>
                          {exp.isFamily && <span className="text-[8px] bg-purple-100 text-purple-600 px-1.5 rounded uppercase font-black">Ví chung</span>}
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-black text-rose-500">-{exp.amount.toLocaleString()}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <h2 className="text-2xl font-black text-gray-800">Biểu đồ yêu thương</h2>
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-pink-50 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#E5E7EB'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={`p-6 rounded-[32px] border shadow-sm border-purple-100 bg-purple-50`}>
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Trợ lý nhận xét</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-bold italic">
                "Tháng này Mây quản lý tiền ăn rất tốt nha! Chỉ chiếm {categoryData.find(d => d.name === Category.FOOD) ? Math.round((categoryData.find(d => d.name === Category.FOOD)!.value / totalSpent) * 100) : 0}% tổng chi. ✨"
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <h2 className="text-2xl font-black text-gray-800">Gói Ghém Plus</h2>

            {/* Market Handbook */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-amber-100 relative overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-book-open text-amber-400"></i> Cẩm nang đi chợ</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button onClick={() => handleOpenHandbook('prices')} className="bg-amber-50 p-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
                  <i className="fa-solid fa-tag text-amber-500"></i>
                  <span className="text-[8px] font-black uppercase text-amber-700">Giá cả</span>
                </button>
                <button onClick={() => handleOpenHandbook('freshness')} className="bg-emerald-50 p-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
                  <i className="fa-solid fa-leaf text-emerald-500"></i>
                  <span className="text-[8px] font-black uppercase text-emerald-700">Đồ tươi</span>
                </button>
                <button onClick={() => handleOpenHandbook('recipes')} className="bg-rose-50 p-3 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
                  <i className="fa-solid fa-mortar-pestle text-rose-500"></i>
                  <span className="text-[8px] font-black uppercase text-rose-700">Món ngon</span>
                </button>
              </div>
              
              {isHandbookLoading && (
                <div className="flex items-center justify-center py-10 gap-3">
                  <div className="animate-spin text-amber-400"><i className="fa-solid fa-spinner text-2xl"></i></div>
                  <p className="text-xs font-bold text-gray-400">Mây đang tra sổ...</p>
                </div>
              )}
              
              {handbookContent && (
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-amber-200 animate-in fade-in slide-in-from-top duration-300">
                  <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{handbookContent}</p>
                  <button onClick={() => setHandbookContent(null)} className="mt-4 text-[9px] font-black text-amber-500 uppercase tracking-widest block text-center w-full">Đóng sổ 📖</button>
                </div>
              )}
            </section>
            
            {/* Food Expiry Tracker */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-emerald-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-leaf text-emerald-400"></i> Hạn thực phẩm</h3>
                <button 
                  onClick={() => {
                    const name = prompt("Tên thực phẩm?");
                    if(name) setFoodItems([...foodItems, { id: Math.random().toString(), name, expiryDate: new Date(Date.now() + 86400000*3).toISOString(), quantity: '1' }]);
                  }}
                  className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full"
                >+ Thêm</button>
              </div>
              <div className="space-y-2">
                {foodItems.map(item => {
                  const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <span className="text-sm font-bold text-gray-700">{item.name}</span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${daysLeft <= 2 ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                        {daysLeft <= 0 ? 'Hết hạn!' : `Còn ${daysLeft} ngày`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Shared Wallet Mode Toggle UI */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-purple-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-users text-purple-400"></i> Ví gia đình</h3>
                  <p className="text-[9px] text-gray-400 font-bold mt-1">Kết nối hai tài khoản (Shared Wallet)</p>
                </div>
                <div 
                  onClick={() => setWalletMode(walletMode === 'personal' ? 'family' : 'personal')}
                  className={`w-14 h-8 rounded-full relative transition-all duration-300 cursor-pointer ${walletMode === 'family' ? 'bg-purple-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${walletMode === 'family' ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
              {walletMode === 'family' && (
                <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-3">
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Husband" className="w-8 h-8 rounded-full border border-white bg-white" alt="Partner" />
                    <p className="text-[10px] font-bold text-purple-600 italic">"Gia đình mình đang cùng quản lý 10,240,000đ ngân quỹ chung."</p>
                  </div>
                </div>
              )}
            </section>

            {/* Shopping Checklist */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-blue-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-cart-shopping text-blue-400"></i> Cần mua gì nào?</h3>
                <button 
                  onClick={() => {
                    const name = prompt("Tên món đồ?");
                    if(name) setShoppingList([...shoppingList, { id: Math.random().toString(), name, completed: false }]);
                  }}
                  className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full"
                >+ Thêm</button>
              </div>
              <div className="space-y-3">
                {shoppingList.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-1" onClick={() => setShoppingList(shoppingList.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i))}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-400 border-emerald-400' : 'border-blue-200'}`}>
                      {item.completed && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    </div>
                    <span className={`text-sm font-bold transition-all ${item.completed ? 'text-gray-300 line-through' : 'text-gray-600'}`}>{item.name}</span>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Setting Section */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">Cài đặt Mây ⚙️</h3>
              <div className="space-y-6">
                 {/* Theme Picker */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">Màu áo mới cho Mây</label>
                  <div className="flex gap-4">
                    {['pink', 'mint', 'lavender'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setAppTheme(t as AppTheme)}
                        className={`w-12 h-12 rounded-2xl border-4 transition-all ${appTheme === t ? 'border-gray-800 scale-110 shadow-lg' : 'border-white shadow-sm'} ${
                          t === 'pink' ? 'bg-[#FFDEE9]' : t === 'mint' ? 'bg-[#E0FFF4]' : 'bg-[#E2E2FF]'
                        }`}
                      ></button>
                    ))}
                  </div>
                </div>

                {/* Biometric */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="text-xs font-black text-gray-700 uppercase">FaceID / Vân tay</span>
                  <button 
                    onClick={() => setIsBiometricEnabled(!isBiometricEnabled)}
                    className={`w-12 h-7 rounded-full relative transition-all duration-300 ${isBiometricEnabled ? 'bg-emerald-400' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isBiometricEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onAddClick={() => setIsFormOpen(true)} />

      {isFormOpen && <ExpenseForm onAdd={handleAddExpense} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default App;
