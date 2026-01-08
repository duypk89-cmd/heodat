
import React, { useState, useEffect, useMemo } from 'react';
import { AppTab, Expense, Category, FoodItem, ShoppingItem, WalletMode, SavingGoal, AppTheme, User } from './types';
import { Navigation } from './components/Navigation';
import { ExpenseForm } from './components/ExpenseForm';
import { PiggyBank } from './components/PiggyBank';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { getMarketHandbook, getShoppingAdvice, extractIngredients, analyzeSpending } from './services/geminiService';
import { supabase } from './services/supabase';

const STICKER_POOL = ['🍓', '🎀', '🍭', '🌸', '🧁', '🍦', '💎', '🌙', '🐱', '🦋', '🎈', '🎨'];
const FOOD_STICKERS = ['🥦', '🥕', '🥩', '🥚', '🥛', '🍎', '🍋', '🍞', '🧀', '🍗', '🍤', '🥣'];
const GOAL_ICONS = ['🎁', '🏖️', '🏠', '🚗', '📱', '💍', '🎓', '🍱', '🚲', '🎸', '✈️', '💄', '🧸', '🍰', '🐶', '🍕', '💻'];

const GOAL_COLORS = [
  { id: 'pink', name: 'Hồng Đào', value: 'from-pink-100 to-rose-100', border: 'border-pink-200', text: 'text-pink-600', accent: 'bg-pink-500', bar: 'bg-gradient-to-r from-pink-400 to-rose-400', btn: 'bg-pink-200/50 text-pink-700' },
  { id: 'blue', name: 'Xanh Mây', value: 'from-blue-100 to-cyan-100', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500', bar: 'bg-gradient-to-r from-blue-400 to-cyan-400', btn: 'bg-blue-200/50 text-blue-700' },
  { id: 'mint', name: 'Lá Non', value: 'from-emerald-100 to-teal-100', border: 'border-emerald-200', text: 'text-emerald-600', accent: 'bg-emerald-500', bar: 'bg-gradient-to-r from-emerald-400 to-teal-400', btn: 'bg-emerald-200/50 text-emerald-700' },
  { id: 'lavender', name: 'Tím Biếc', value: 'from-purple-100 to-indigo-100', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500', bar: 'bg-gradient-to-r from-purple-400 to-indigo-400', btn: 'bg-purple-200/50 text-purple-700' },
  { id: 'amber', name: 'Nắng Vàng', value: 'from-orange-100 to-amber-100', border: 'border-orange-200', text: 'text-orange-600', accent: 'bg-orange-500', bar: 'bg-gradient-to-r from-orange-400 to-amber-500', btn: 'bg-orange-200/50 text-orange-700' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode>('personal');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [appTheme, setAppTheme] = useState<AppTheme>('pink');
  const [showRewardOverlay, setShowRewardOverlay] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false); // New state for Quest effect
  
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isHandbookLoading, setIsHandbookLoading] = useState(false);
  const [handbookContent, setHandbookContent] = useState<string | null>(null);

  // Report & Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Family Connection State
  const [partnerInfo, setPartnerInfo] = useState<User | null>(null);
  const [familyStatus, setFamilyStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);

  // Tools Tab View State
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedHandbookTopic, setSelectedHandbookTopic] = useState<'prices' | 'freshness' | 'recipes' | null>(null);

  // New Goal State
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  // Budget States
  const [weeklyBudget, setWeeklyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('heodat_weekly_budget');
    return saved ? parseInt(saved) : 1500000;
  });
  const [familyBudget, setFamilyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('heodat_family_budget');
    return saved ? parseInt(saved) : 15000000;
  });

  // Saving Goals Form States
  const [goalContributionInputs, setGoalContributionInputs] = useState<Record<string, string>>({});

  // Shopping States
  const [newShoppingName, setNewShoppingName] = useState('');
  const [shoppingAdvice, setShoppingAdvice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    setIsAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ 
      email: authEmail, 
      password: authPassword, 
      options: { data: { name: authName } } 
    });
    if (error) setAuthError(error.message);
    else {
      alert("Đăng ký thành công! Mây có thể đăng nhập ngay.");
      setIsRegistering(false);
    }
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setCurrentUser(null);
      setExpenses([]);
      setShoppingList([]);
      setSavingGoals([]);
      setFamilyStatus('none');
      setPartnerInfo(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name || 'Mây' });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name || 'Mây' });
      } else {
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      fetchFamilyConnection();
    }
  }, [currentUser]);

  const fetchFamilyConnection = async () => {
    if (!currentUser) return;
    const { data: connectedData } = await supabase
      .from('family_links')
      .select('*')
      .eq('status', 'connected')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .single();

    if (connectedData) {
      setFamilyStatus('connected');
      const partnerId = connectedData.user_id_1 === currentUser.id ? connectedData.user_id_2 : connectedData.user_id_1;
      const { data: pData } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
      if (pData) setPartnerInfo(pData);
      return;
    }

    const { data: requests } = await supabase
      .from('family_links')
      .select('*, profiles:user_id_1(name, email)')
      .eq('user_id_2', currentUser.id)
      .eq('status', 'pending');
    
    if (requests && requests.length > 0) {
      setPendingRequests(requests);
      setFamilyStatus('none');
    } else {
      const { data: sentRequests } = await supabase
        .from('family_links')
        .select('*')
        .eq('user_id_1', currentUser.id)
        .eq('status', 'pending');
      if (sentRequests && sentRequests.length > 0) setFamilyStatus('pending');
      else setFamilyStatus('none');
    }
  };

  const handleSendFamilyRequest = async () => {
    if (!partnerEmailInput.trim() || !currentUser) return;
    setIsLinkingLoading(true);

    const { data: partnerData, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', partnerEmailInput.trim())
      .single();

    if (findError || !partnerData) {
      alert("Không tìm thấy người dùng với email này! Hãy chắc chắn họ đã đăng ký.");
      setIsLinkingLoading(false);
      return;
    }

    if (partnerData.id === currentUser.id) {
      alert("Mây không thể tự kết nối với chính mình nha!");
      setIsLinkingLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('family_links')
      .insert([{ user_id_1: currentUser.id, user_id_2: partnerData.id, status: 'pending' }]);

    if (insertError) {
      alert("Có lỗi xảy ra hoặc yêu cầu đã tồn tại!");
    } else {
      alert("Đã gửi lời mời! Chờ người ấy đồng ý nha.");
      setPartnerEmailInput('');
      fetchFamilyConnection();
    }
    setIsLinkingLoading(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await supabase.from('family_links').update({ status: 'connected' }).eq('id', requestId);
    if (!error) {
      alert("Chào mừng thành viên mới của gia đình! 🏠");
      fetchFamilyConnection();
      setTimeout(() => fetchUserData(), 500); // Reload expenses to include family
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Mây có chắc muốn dừng chia sẻ ví không?")) return;
    if (!currentUser) return;
    
    const { error } = await supabase
      .from('family_links')
      .delete()
      .eq('status', 'connected')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`);

    if (!error) {
      setPartnerInfo(null);
      setFamilyStatus('none');
      setWalletMode('personal');
      fetchUserData();
      alert("Đã ngắt kết nối ví gia đình.");
    }
  };

  const fetchUserData = async () => {
    if (!currentUser) return;
    let userIds = [currentUser.id];
    if (partnerInfo && familyStatus === 'connected') userIds.push(partnerInfo.id);

    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .in('user_id', userIds)
      .order('date', { ascending: false });
    if (expData) setExpenses(expData.filter(e => e.user_id === currentUser.id || e.is_family));

    const { data: goalData } = await supabase.from('saving_goals').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (goalData) setSavingGoals(goalData);
    
    const { data: shopData } = await supabase.from('shopping_list').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
    if (shopData) setShoppingList(shopData);
  };

  const handleAddExpense = async (newExp: any) => {
    if (!currentUser) return;
    const { data, error } = await supabase.from('expenses').insert([{ ...newExp, user_id: currentUser.id, is_family: walletMode === 'family' }]).select();
    if (!error && data) setExpenses([data[0], ...expenses]);
  };

  const handleUpdateExpense = async (id: string, updatedExp: any) => {
    const { error } = await supabase.from('expenses').update(updatedExp).eq('id', id);
    if (!error) {
       setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedExp } : e));
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if(!confirm('Mây chắc chắn muốn xóa khoản này chứ?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if(!error) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleContributeToGoals = async (goalId: string, amount: number) => {
    if (!currentUser || amount <= 0) return;
    const goal = savingGoals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.savedAmount + amount;
    const { error } = await supabase.from('saving_goals').update({ savedAmount: newAmount }).eq('id', goalId);
    
    if (!error) {
      setSavingGoals(prev => prev.map(g => g.id === goalId ? { ...g, savedAmount: newAmount } : g));
      setGoalContributionInputs(prev => ({ ...prev, [goalId]: '' }));
      setShowRewardOverlay('💰');
      setTimeout(() => setShowRewardOverlay(null), 1500);
    }
  };

  const handleCreateGoal = async () => {
    if (!currentUser || !newGoalName || !newGoalTarget) return;
    const randomColor = GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)].id;
    const randomIcon = GOAL_ICONS[Math.floor(Math.random() * GOAL_ICONS.length)];
    
    const { data, error } = await supabase.from('saving_goals').insert([{
      user_id: currentUser.id,
      name: newGoalName,
      targetAmount: parseInt(newGoalTarget),
      savedAmount: 0,
      icon: randomIcon,
      color: randomColor
    }]).select();

    if (!error && data) {
      setSavingGoals([data[0], ...savingGoals]);
      setIsAddingGoal(false);
      setNewGoalName('');
      setNewGoalTarget('');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if(!confirm('Mây có chắc muốn đập vỡ hũ này không?')) return;
    const { error } = await supabase.from('saving_goals').delete().eq('id', id);
    if (!error) {
      setSavingGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleCycleGoalIcon = async (goalId: string, currentIcon: string) => {
    const idx = GOAL_ICONS.indexOf(currentIcon);
    const nextIcon = GOAL_ICONS[(idx + 1) % GOAL_ICONS.length];
    
    const { error } = await supabase.from('saving_goals').update({ icon: nextIcon }).eq('id', goalId);
    if (!error) {
      setSavingGoals(prev => prev.map(g => g.id === goalId ? { ...g, icon: nextIcon } : g));
    }
  };

  // Quest Logic
  const handleQuestComplete = async (amount: number) => {
    if (savingGoals.length > 0) {
      await handleContributeToGoals(savingGoals[0].id, amount);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      alert("Mây tạo một hũ mục tiêu trước để đựng tiền thưởng nhiệm vụ nha! 🎯");
    }
  };

  const handleAddShoppingItem = async (name?: string) => {
    const itemName = name || newShoppingName.trim();
    if (!currentUser || !itemName) return;
    const { data, error } = await supabase.from('shopping_list').insert([{ name: itemName, completed: false, user_id: currentUser.id }]).select();
    if (data) {
      setShoppingList(prev => [...prev, data[0]]);
      if (!name) setNewShoppingName('');
    }
  };

  const handleToggleShoppingItem = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('shopping_list').update({ completed: !completed }).eq('id', id);
    if (!error) {
      setShoppingList(prev => prev.map(item => item.id === id ? { ...item, completed: !completed } : item));
      if (!completed) {
        setShowRewardOverlay('✨');
        setTimeout(() => setShowRewardOverlay(null), 1000);
      }
    }
  };

  const handleDeleteShoppingItem = async (id: string) => {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id);
    if (!error) setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const handleGetShoppingAdvice = async () => {
    if (shoppingList.length === 0) return;
    setIsAdviceLoading(true);
    const advice = await getShoppingAdvice(shoppingList.map(i => i.name));
    setShoppingAdvice(advice);
    setIsAdviceLoading(false);
  };

  const handleFetchHandbook = async (topic: 'prices' | 'freshness' | 'recipes') => {
    setIsHandbookLoading(true);
    setSelectedHandbookTopic(topic);
    const content = await getMarketHandbook(topic);
    setHandbookContent(content);
    setIsHandbookLoading(false);
  };

  const handleExtractToCart = async () => {
    if (!handbookContent) return;
    setIsAdviceLoading(true);
    const ingredients = await extractIngredients(handbookContent);
    for (const ing of ingredients) {
      await handleAddShoppingItem(ing);
    }
    alert(`Đã thêm ${ingredients.length} nguyên liệu vào giỏ hàng của Mây rồi nhé! 🛒✨`);
    setIsAdviceLoading(false);
  };

  // Budget Update Logic
  const handleUpdateBudget = (type: 'weekly' | 'family', amount: string) => {
     const value = parseInt(amount);
     if (isNaN(value) || value < 0) return;
     
     if (type === 'weekly') {
       setWeeklyBudget(value);
       localStorage.setItem('heodat_weekly_budget', value.toString());
     } else {
       setFamilyBudget(value);
       localStorage.setItem('heodat_family_budget', value.toString());
     }
  };

  const totalSpentMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses.filter(e => e.amount > 0 && (walletMode === 'personal' ? !e.is_family : e.is_family) && new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, walletMode]);

  const weeklySpent = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    return expenses.filter(e => !e.is_family && new Date(e.date) >= startOfWeek && e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const shoppingProgress = useMemo(() => {
    if (shoppingList.length === 0) return 0;
    const completed = shoppingList.filter(i => i.completed).length;
    return Math.round((completed / shoppingList.length) * 100);
  }, [shoppingList]);

  // Group expenses by date for History view
  const historyGrouped = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    const relevantExpenses = expenses.filter(e => walletMode === 'family' ? e.is_family : !e.is_family);
    
    relevantExpenses.forEach(exp => {
      const dateKey = new Date(exp.date).toLocaleDateString('vi-VN');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(exp);
    });
    return groups;
  }, [expenses, walletMode]);

  // Report Data Processing
  const categoryData = useMemo(() => {
    const relevantExpenses = expenses.filter(e => walletMode === 'family' ? e.is_family : !e.is_family);
    const data: Record<string, number> = {};
    relevantExpenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [expenses, walletMode]);

  const dailyTrendData = useMemo(() => {
    const relevantExpenses = expenses.filter(e => walletMode === 'family' ? e.is_family : !e.is_family);
    const data: Record<string, number> = {};
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('vi-VN');
    }).reverse();

    relevantExpenses.forEach(e => {
        const dateKey = new Date(e.date).toLocaleDateString('vi-VN');
        if (last7Days.includes(dateKey)) {
             data[dateKey] = (data[dateKey] || 0) + e.amount;
        }
    });

    return last7Days.map(date => ({ date: date.slice(0, 5), amount: data[date] || 0 }));
  }, [expenses, walletMode]);

  const handleAnalyzeSpending = async () => {
    const relevantExpenses = expenses.filter(e => walletMode === 'family' ? e.is_family : !e.is_family);
    const currentBudget = walletMode === 'family' ? familyBudget : weeklyBudget * 4; // Approx month budget for personal if not set
    setIsAnalyzing(true);
    const analysis = await analyzeSpending(relevantExpenses.slice(0, 30), currentBudget);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // Streak Calculation
  const streak = useMemo(() => {
    if (expenses.length === 0) return 0;
    const sortedDates = [...new Set(expenses.map(e => new Date(e.date).toDateString()))]
      .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    
    let count = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      count = 1;
      let checkDate = new Date(sortedDates[0]);
      for (let i = 1; i < sortedDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (sortedDates[i] === checkDate.toDateString()) {
          count++;
        } else {
          break;
        }
      }
    }
    return count;
  }, [expenses]);

  // Level & Mascot Message
  const getMascotMessage = (savings: number) => {
    if (savings < 500000) return "Cố lên Mây ơi, vạn sự khởi đầu nan! 🌱";
    if (savings < 2000000) return "Mây đang làm rất tốt, sắp thành Thợ Săn rồi! 🏹";
    if (savings < 10000000) return "Wow, kỹ luật của Mây thật đáng nể! 🛡️";
    if (savings < 50000000) return "Pháo đài tài chính của Mây quá vững chắc! 🏰";
    return "Mây là Huyền Thoại Đầu Tư rồi! 👑";
  };

  const themeConfig = {
    pink: { primary: 'text-pink-500', bg: 'bg-[#FFF5F7]', gradient: 'from-[#FFDEE9] to-[#FFD1FF]', accent: 'bg-pink-100 text-pink-600', btn: 'bg-gradient-to-r from-pink-400 to-rose-400' },
    lavender: { primary: 'text-purple-500', bg: 'bg-[#F5F3FF]', gradient: 'from-[#E2E2FF] to-[#D1D1FF]', accent: 'bg-purple-100 text-purple-600', btn: 'bg-gradient-to-r from-purple-400 to-indigo-400' }
  };
  const currentTheme = themeConfig[appTheme];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl mb-10 animate-soft-bounce text-5xl">🐷</div>
        <div className="bg-white w-full max-sm p-10 rounded-[48px] shadow-2xl transition-all duration-500 hover:shadow-pink-200/50">
          <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">{isRegistering ? 'Chào Mây Mới! 🌸' : 'Mây Về Rồi! ✨'}</h2>
          {authError && <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl mb-4"><i className="fa-solid fa-triangle-exclamation mr-2"></i>{authError}</div>}
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            {isRegistering && <input type="text" placeholder="Tên của Mây..." value={authName} onChange={e => setAuthName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-200 transition-all" required />}
            <input type="email" placeholder="Email..." value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-200 transition-all" required />
            <input type="password" placeholder="Mật khẩu..." value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-200 transition-all" required />
            <button disabled={isAuthLoading} type="submit" className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-4">{isAuthLoading ? 'Đang xác nhận...' : (isRegistering ? 'Tham Gia Ngay' : 'Vào Chăm Heo')}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center mt-8 text-[10px] font-black text-pink-400 uppercase tracking-widest">{isRegistering ? 'Đã có hũ heo? Đăng nhập' : 'Chưa có hũ heo? Đăng ký'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-32 relative ${walletMode === 'family' ? 'bg-[#FFF9F0]' : currentTheme.bg} transition-all duration-700`}>
      {showRewardOverlay && <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[1000] animate-bounce text-9xl">{showRewardOverlay}</div>}
      
      {/* Confetti Effect Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute animate-[fall_3s_ease-in-out_forwards]" style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              animationDelay: `${Math.random() * 1}s`,
              fontSize: `${Math.random() * 20 + 20}px`
            }}>
              {['✨', '🎉', '💰', '🌸', '💎'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
          <style>{`
            @keyframes fall {
              to { transform: translateY(110vh) rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <header className="px-6 pt-12 pb-6 flex justify-between items-start sticky top-0 bg-inherit/90 backdrop-blur-md z-40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">{walletMode === 'personal' ? `Chào ${currentUser.name}! 🌸` : "Tiệm Gia Đình 🏠"}</h1>
            {streak > 1 && (
              <span className="bg-orange-100 text-orange-500 text-[10px] font-black px-2 py-1 rounded-full border border-orange-200 flex items-center gap-1">
                <i className="fa-solid fa-fire"></i> {streak} ngày
              </span>
            )}
          </div>
          <div className="flex bg-white/60 backdrop-blur-sm rounded-full p-1 mt-3 border border-pink-100 shadow-sm w-fit">
             <button onClick={() => setWalletMode('personal')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${walletMode === 'personal' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Cá nhân</button>
             <button onClick={() => { if (familyStatus === 'connected') setWalletMode('family'); else { setActiveTab('tools'); setSelectedTool('family_wallet'); alert("Mây cần kết nối Ví Gia Đình trước nha! ✨"); } }} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${walletMode === 'family' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400'}`}>Gia đình</button>
          </div>
        </div>
        <div className="relative group">
           <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-lg hover:scale-110 transition-transform border border-pink-50">
             🐰
           </button>
           {/* Mascot Message Bubble */}
           <div className="absolute right-12 top-0 w-48 bg-white p-3 rounded-l-2xl rounded-tr-2xl rounded-br-sm shadow-xl border border-pink-100 animate-in fade-in slide-in-from-right-4">
             <p className="text-[10px] font-bold text-gray-600 leading-tight">
               {getMascotMessage(totalSpentMonth)}
             </p>
           </div>
           
           <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-2xl shadow-xl p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 border border-pink-50 z-50">
             <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
               <i className="fa-solid fa-right-from-bracket mr-2"></i> Đăng xuất
             </button>
           </div>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className={`relative overflow-hidden bg-gradient-to-br ${walletMode === 'family' ? 'from-orange-100 to-amber-100' : currentTheme.gradient} rounded-[48px] p-8 text-gray-800 shadow-xl border-2 border-white/60`}>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 opacity-60">Ngân sách {walletMode === 'family' ? 'Gia đình' : 'Tuần này'} còn</p>
                <h2 className="text-4xl font-black mb-6 tracking-tighter">{(walletMode === 'family' ? familyBudget - totalSpentMonth : weeklyBudget - weeklySpent).toLocaleString()}đ</h2>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full" style={{ width: `${Math.min((totalSpentMonth / (walletMode === 'family' ? familyBudget : weeklyBudget)) * 100, 100)}%` }}></div>
                </div>
            </div>

            {/* Daily Quest Section */}
            <div>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-scroll text-amber-400"></i> Nhiệm Vụ Hằng Ngày
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {[
                  { id: 'coffee', title: 'Cai Trà Sữa', amount: 30000, icon: '🧋', color: 'from-orange-400 to-pink-500', bg: 'bg-orange-50' },
                  { id: 'change', title: 'Góp Tiền Lẻ', amount: 5000, icon: '🪙', color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
                  { id: 'fine', title: 'Phạt Bản Thân', amount: 50000, icon: '⚡', color: 'from-rose-400 to-red-500', bg: 'bg-rose-50' }
                ].map(quest => (
                  <div key={quest.id} className={`snap-center min-w-[140px] p-4 rounded-[32px] bg-white/40 backdrop-blur-md border border-white shadow-lg flex flex-col items-center gap-3 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${quest.color}`}></div>
                    <div className="text-3xl mt-2 group-hover:scale-110 transition-transform">{quest.icon}</div>
                    <div className="text-center">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{quest.title}</p>
                       <p className={`text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${quest.color}`}>+{quest.amount.toLocaleString()}đ</p>
                    </div>
                    <button 
                      onClick={() => handleQuestComplete(quest.amount)}
                      className={`w-full py-2 rounded-xl text-[9px] font-black text-white bg-gradient-to-r ${quest.color} shadow-md active:scale-90 transition-transform`}
                    >
                      Thực hiện
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <PiggyBank savings={totalSpentMonth} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
             <h2 className="text-2xl font-black text-gray-800 tracking-tight">Sổ Tay Chi Tiêu 📖</h2>
             {Object.keys(historyGrouped).length === 0 ? (
               <div className="text-center py-20 opacity-40">
                 <i className="fa-solid fa-note-sticky text-4xl mb-4"></i>
                 <p className="text-xs font-bold uppercase tracking-widest">Chưa có dòng nhật ký nào...</p>
               </div>
             ) : (
               Object.keys(historyGrouped).sort((a: string, b: string) => new Date(b.split('/').reverse().join('-')).getTime() - new Date(a.split('/').reverse().join('-')).getTime()).map(date => (
                 <div key={date} className="space-y-3">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-24 bg-inherit/90 backdrop-blur-sm py-2 z-10">{date}</p>
                   {historyGrouped[date].map(exp => (
                     <div key={exp.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50 flex items-center justify-between group hover:border-pink-200 transition-all">
                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => { setEditExpense(exp); setIsFormOpen(true); }}>
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${CATEGORY_COLORS[exp.category as Category] ? '' : 'bg-gray-100'}`} style={{ backgroundColor: CATEGORY_COLORS[exp.category as Category] + '40' }}>
                              {CATEGORY_ICONS[exp.category as Category]}
                           </div>
                           <div>
                              <p className="font-bold text-sm text-gray-800">{exp.category}</p>
                              <p className="text-[10px] text-gray-500 font-bold">{exp.note || 'Không có ghi chú'}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-black text-gray-800">-{exp.amount.toLocaleString()}đ</span>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="text-[9px] text-red-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">Xóa</button>
                        </div>
                     </div>
                   ))}
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 pb-10">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Báo Cáo Thông Thái 📊</h2>
            
            {/* Gamification Card */}
            <div className={`p-6 rounded-[32px] border-2 relative overflow-hidden flex items-center gap-6 ${weeklySpent <= weeklyBudget ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
               <div className="text-4xl animate-soft-bounce">{weeklySpent <= weeklyBudget ? '🐷🎉' : '🐷💸'}</div>
               <div className="flex-1">
                  <h3 className={`font-black text-sm uppercase tracking-widest ${weeklySpent <= weeklyBudget ? 'text-emerald-600' : 'text-red-500'}`}>
                    {weeklySpent <= weeklyBudget ? 'Heo Đất Đang Lớn!' : 'Cẩn thận vỡ hũ!'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 mt-1">
                    {weeklySpent <= weeklyBudget 
                      ? 'Mây đang chi tiêu rất hợp lý. Tiếp tục phát huy nhé!' 
                      : 'Mây đã tiêu lố ngân sách tuần này rồi. Hãm phanh lại nào!'}
                  </p>
               </div>
               {weeklySpent <= weeklyBudget && (
                 <div className="absolute top-2 right-2 rotate-12 bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-200">
                    <span className="text-xs">🏆</span>
                 </div>
               )}
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Phân bổ chi tiêu</h3>
                  <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#ccc'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                     {categoryData.map(item => (
                       <div key={item.name} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name as Category] }}></div>
                          <span className="text-[8px] font-bold text-gray-500">{item.name}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Xu hướng 7 ngày</h3>
                  <div className="h-40 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyTrendData}>
                          <XAxis dataKey="date" tick={{fontSize: 8}} axisLine={false} tickLine={false} />
                          <Tooltip 
                             cursor={{fill: '#f3f4f6'}}
                             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="amount" fill="#FBCFE8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[32px] border border-white shadow-inner relative">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-indigo-100">🐰</div>
                   <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Thỏ Mây Nhận Xét</h3>
                </div>
                
                {aiAnalysis ? (
                   <p className="text-xs font-bold text-gray-700 leading-relaxed bg-white/60 p-4 rounded-2xl border border-white">
                     {aiAnalysis}
                   </p>
                ) : (
                   <div className="text-center py-4">
                     <p className="text-[10px] text-gray-500 mb-3">Chưa có dữ liệu phân tích mới.</p>
                     <button 
                       onClick={handleAnalyzeSpending}
                       disabled={isAnalyzing}
                       className="bg-indigo-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-600 transition-all disabled:opacity-50"
                     >
                       {isAnalyzing ? 'Đang suy nghĩ...' : 'Nhờ Mây Phân Tích'}
                     </button>
                   </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="animate-in fade-in duration-500 space-y-6 pb-24">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Tiệm của Mây 🐰</h2>
            {!selectedTool ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'shopping', name: 'Mua sắm', icon: '🛒', bg: 'bg-purple-50', text: 'text-purple-600' },
                  { id: 'goals', name: 'Mục tiêu', icon: '🎯', bg: 'bg-amber-50', text: 'text-amber-600' },
                  { id: 'handbook', name: 'Sổ tay AI', icon: '📖', bg: 'bg-blue-50', text: 'text-blue-600' },
                  { id: 'family_wallet', name: 'Ví Gia Đình', icon: '👨‍👩‍👧', bg: 'bg-orange-50', text: 'text-orange-600' },
                  { id: 'budget', name: 'Ngân sách', icon: '💸', bg: 'bg-emerald-50', text: 'text-emerald-600' },
                ].map((tool) => (
                  <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`${tool.bg} p-8 rounded-[40px] flex flex-col items-center gap-3 shadow-sm border border-white hover:scale-[1.03] transition-all relative`}>
                    {tool.id === 'family_wallet' && pendingRequests.length > 0 && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                    <span className="text-4xl">{tool.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${tool.text}`}>{tool.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => { setSelectedTool(null); setSelectedHandbookTopic(null); setHandbookContent(null); }} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                  <i className="fa-solid fa-arrow-left"></i> Quay lại
                </button>

                {selectedTool === 'budget' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <section className="bg-white p-8 rounded-[48px] border border-emerald-100 shadow-xl space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg"><i className="fa-solid fa-sack-dollar"></i></div>
                          <div><h3 className="text-xl font-black text-gray-800">Cài Đặt Ngân Sách</h3></div>
                       </div>
                       
                       <div className="space-y-6">
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Ngân sách tuần (Cá nhân)</label>
                             <div className="relative">
                                <input 
                                   type="number" 
                                   defaultValue={weeklyBudget}
                                   onBlur={(e) => handleUpdateBudget('weekly', e.target.value)}
                                   className="w-full bg-emerald-50 p-5 rounded-[24px] outline-none font-black text-xl text-emerald-800 border-2 border-transparent focus:border-emerald-300 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">VNĐ</span>
                             </div>
                          </div>

                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Ngân sách tháng (Gia đình)</label>
                             <div className="relative">
                                <input 
                                   type="number" 
                                   defaultValue={familyBudget}
                                   onBlur={(e) => handleUpdateBudget('family', e.target.value)}
                                   className="w-full bg-orange-50 p-5 rounded-[24px] outline-none font-black text-xl text-orange-800 border-2 border-transparent focus:border-orange-300 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-400">VNĐ</span>
                             </div>
                          </div>
                          
                          <p className="text-[10px] text-gray-400 italic text-center">* Nhập số và bấm ra ngoài để lưu tự động nha Mây!</p>
                       </div>
                    </section>
                  </div>
                )}

                {selectedTool === 'family_wallet' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 pb-10">
                    <section className="bg-white p-8 rounded-[48px] border border-orange-100 shadow-xl space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg"><i className="fa-solid fa-house-chimney"></i></div>
                         <div>
                            <h3 className="text-xl font-black text-gray-800">Tổ Ấm Nhỏ</h3>
                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                              {familyStatus === 'connected' ? 'Đang chia sẻ' : 'Kết nối yêu thương'}
                            </p>
                         </div>
                      </div>

                      {familyStatus === 'connected' && partnerInfo ? (
                        <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 space-y-6 text-center">
                           <div className="flex justify-center -space-x-4">
                              <div className="w-16 h-16 rounded-full bg-pink-200 border-4 border-white flex items-center justify-center text-2xl">👩</div>
                              <div className="w-16 h-16 rounded-full bg-blue-200 border-4 border-white flex items-center justify-center text-2xl">👦</div>
                           </div>
                           <div>
                             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Đang kết nối với</p>
                             <h4 className="text-xl font-black text-gray-800">{partnerInfo.name}</h4>
                             <p className="text-[10px] text-gray-400">{partnerInfo.email}</p>
                           </div>
                           <button onClick={handleUnlink} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors border-b border-red-200 pb-1">Ngắt kết nối ví</button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email người ấy</label>
                              <div className="flex gap-2">
                                <input 
                                  type="email" 
                                  value={partnerEmailInput}
                                  onChange={e => setPartnerEmailInput(e.target.value)}
                                  placeholder="nhap.email@nguoi.ay..."
                                  className="flex-1 bg-gray-50 p-4 rounded-2xl outline-none font-bold text-xs border focus:border-orange-300 transition-all"
                                  disabled={familyStatus === 'pending'}
                                />
                                <button 
                                  onClick={handleSendFamilyRequest}
                                  disabled={isLinkingLoading || familyStatus === 'pending'}
                                  className="bg-orange-500 text-white px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50"
                                >
                                  {isLinkingLoading ? '...' : (familyStatus === 'pending' ? 'Đã gửi' : 'Mời')}
                                </button>
                              </div>
                              {familyStatus === 'pending' && <p className="text-[10px] text-orange-500 italic ml-2">* Đang chờ phản hồi...</p>}
                           </div>

                           {pendingRequests.length > 0 && (
                             <div className="space-y-3 mt-6">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Lời mời đã nhận</p>
                               {pendingRequests.map(req => (
                                 <div key={req.id} className="bg-white border-2 border-orange-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                    <div>
                                      <p className="font-bold text-xs text-gray-800">{req.profiles?.name || 'Ai đó'}</p>
                                      <p className="text-[9px] text-gray-400">{req.profiles?.email}</p>
                                    </div>
                                    <button onClick={() => handleAcceptRequest(req.id)} className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 transition-all">
                                      Đồng ý
                                    </button>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {selectedTool === 'goals' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 pb-10">
                    <section className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-xl space-y-8">
                       <div className="flex justify-between items-center px-2">
                         <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">🎯 Hũ Mục Tiêu Tiết Kiệm</h3>
                         <button onClick={() => setIsAddingGoal(!isAddingGoal)} className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors shadow-sm">
                           <i className={`fa-solid ${isAddingGoal ? 'fa-minus' : 'fa-plus'} text-xs`}></i>
                         </button>
                       </div>

                       {isAddingGoal && (
                         <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 space-y-4 animate-in slide-in-from-top-2">
                            <h4 className="text-sm font-black text-amber-600">Mục tiêu mới ✨</h4>
                            <input 
                              type="text" 
                              placeholder="Tên mục tiêu (vd: Mua xe)" 
                              value={newGoalName}
                              onChange={e => setNewGoalName(e.target.value)}
                              className="w-full p-3 bg-white rounded-xl text-xs font-bold outline-none border border-amber-100 focus:border-amber-300"
                            />
                            <input 
                              type="number" 
                              placeholder="Số tiền cần (VNĐ)" 
                              value={newGoalTarget}
                              onChange={e => setNewGoalTarget(e.target.value)}
                              className="w-full p-3 bg-white rounded-xl text-xs font-bold outline-none border border-amber-100 focus:border-amber-300"
                            />
                            <button onClick={handleCreateGoal} className="w-full bg-amber-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md">Tạo ngay</button>
                         </div>
                       )}

                       <div className="space-y-10">
                         {savingGoals.map(goal => {
                           const theme = GOAL_COLORS.find(c => c.id === goal.color) || GOAL_COLORS[0];
                           const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
                           return (
                             <div key={goal.id} className={`space-y-6 p-6 rounded-[44px] bg-gradient-to-br ${theme.value} border-2 border-white shadow-lg relative group overflow-hidden transition-all hover:scale-[1.02]`}>
                                {progress >= 100 && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></div>}
                                <button onClick={() => handleDeleteGoal(goal.id)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20"><i className="fa-solid fa-xmark"></i></button>
                                
                                <div className="flex items-center gap-5">
                                  <button 
                                    onClick={() => handleCycleGoalIcon(goal.id, goal.icon)}
                                    className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center text-4xl shadow-md transition-transform active:scale-90 hover:rotate-6"
                                  >
                                    {goal.icon}
                                  </button>
                                  <div className="flex-1">
                                    <span className={`text-sm font-black block tracking-tight ${theme.text}`}>{goal.name}</span>
                                    <div className="flex justify-between items-end mt-1">
                                      <span className="text-[10px] font-bold text-gray-500">{goal.savedAmount.toLocaleString()}đ / {goal.targetAmount.toLocaleString()}đ</span>
                                      <span className={`text-[10px] font-black ${theme.text}`}>{progress}%</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden p-0.5 border border-white/40">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${theme.bar}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                </div>

                                <div className="pt-2 space-y-4">
                                   <div className="flex flex-wrap gap-2">
                                      {[10000, 50000, 100000].map(amt => (
                                        <button 
                                          key={amt} 
                                          onClick={() => handleContributeToGoals(goal.id, amt)}
                                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${theme.btn} shadow-sm border border-white hover:bg-white transition-all active:scale-95`}
                                        >
                                          +{amt/1000}k
                                        </button>
                                      ))}
                                   </div>
                                   
                                   <div className="flex gap-2">
                                      <div className="relative flex-1">
                                        <input 
                                          type="number"
                                          value={goalContributionInputs[goal.id] || ''}
                                          onChange={(e) => setGoalContributionInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                          placeholder="Nhập số khác..."
                                          className="w-full bg-white/60 p-3 px-4 rounded-2xl outline-none font-bold text-[10px] border border-white/50 focus:border-white transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400">đ</span>
                                      </div>
                                      <button 
                                        onClick={() => handleContributeToGoals(goal.id, parseInt(goalContributionInputs[goal.id] || '0'))}
                                        className={`px-5 rounded-2xl ${theme.accent} text-white text-[9px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95`}
                                      >
                                        Góp ngay
                                      </button>
                                   </div>
                                </div>
                             </div>
                           );
                         })}
                       </div>
                    </section>
                  </div>
                )}

                {selectedTool === 'shopping' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
                    <header className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-[48px] text-white shadow-xl relative overflow-hidden">
                       <div className="relative z-10">
                          <h3 className="text-xl font-black tracking-tight mb-2">Giỏ Hàng Thông Thái 🛒</h3>
                          <div className="flex justify-between items-end">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Hoàn thành {shoppingProgress}%</span>
                             <span className="text-xs font-bold">{shoppingList.filter(i => i.completed).length}/{shoppingList.length} món</span>
                          </div>
                          <div className="w-full h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                             <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${shoppingProgress}%` }}></div>
                          </div>
                       </div>
                    </header>
                    <div className="flex gap-3">
                        <input type="text" value={newShoppingName} onChange={e => setNewShoppingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddShoppingItem()} placeholder="Mây cần mua gì?..." className="flex-1 p-5 bg-white rounded-[24px] outline-none font-bold text-sm border-2 border-transparent focus:border-purple-200 shadow-lg transition-all" />
                        <button onClick={() => handleAddShoppingItem()} className="w-14 h-14 bg-purple-500 text-white rounded-[20px] flex items-center justify-center text-xl shadow-lg active:scale-90 transition-all"><i className="fa-solid fa-plus"></i></button>
                    </div>
                    <div className="space-y-3">
                        {shoppingList.map((item, idx) => (
                           <div key={item.id} className={`bg-white p-5 rounded-[28px] border-2 flex items-center gap-4 transition-all duration-500 group ${item.completed ? 'border-transparent opacity-60 scale-95' : 'border-purple-50 shadow-sm'}`}>
                              <button onClick={() => handleToggleShoppingItem(item.id, item.completed)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 text-white shadow-lg rotate-[360deg]' : 'bg-purple-50 text-purple-200 group-hover:bg-purple-100'}`}>
                                 <i className={`fa-solid ${item.completed ? 'fa-check' : 'fa-circle'} text-[10px]`}></i>
                              </button>
                              <div className="flex-1 min-w-0">
                                 <p className={`font-black text-sm truncate ${item.completed ? 'line-through text-gray-400 italic' : 'text-gray-700'}`}>{item.name}</p>
                              </div>
                              <button onClick={() => handleDeleteShoppingItem(item.id)} className="text-gray-200 hover:text-rose-400 transition-colors p-2"><i className="fa-solid fa-trash-can text-xs"></i></button>
                           </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedTool === 'handbook' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
                    <section className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-xl space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg"><i className="fa-solid fa-book-open"></i></div>
                          <div><h3 className="text-xl font-black text-gray-800">Sổ Tay Đi Chợ 3D</h3></div>
                       </div>
                       <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'prices', name: 'Giá Cả', icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
                            { id: 'freshness', name: 'Tươi Ngon', icon: '🥦', color: 'bg-orange-50 text-orange-600' },
                            { id: 'recipes', name: 'Gợi Ý Món', icon: '🥘', color: 'bg-rose-50 text-rose-600' },
                          ].map(topic => (
                            <button key={topic.id} onClick={() => handleFetchHandbook(topic.id as any)} className={`${topic.color} p-5 rounded-[32px] flex flex-col items-center gap-2 border-2 border-white shadow-sm hover:scale-105 transition-all`}>
                               <span className="text-2xl">{topic.icon}</span>
                               <span className="text-[8px] font-black uppercase tracking-tight">{topic.name}</span>
                            </button>
                          ))}
                       </div>
                       {handbookContent && (
                         <div className="bg-blue-50/50 p-6 rounded-[40px] border border-blue-100 max-h-[400px] overflow-y-auto custom-scrollbar text-xs leading-relaxed whitespace-pre-wrap font-bold text-gray-700">
                            {handbookContent}
                         </div>
                       )}
                    </section>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onAddClick={() => setIsFormOpen(true)} />
      {(isFormOpen || editExpense) && <ExpenseForm onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onClose={() => { setIsFormOpen(false); setEditExpense(null); }} editData={editExpense} />}
    </div>
  );
};

export default App;
