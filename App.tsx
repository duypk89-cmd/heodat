
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppTab, Expense, Category, ShoppingItem, WalletMode, SavingGoal, AppTheme, User } from './types';
import { Navigation } from './components/Navigation';
import { ExpenseForm } from './components/ExpenseForm';
import { PiggyBank } from './components/PiggyBank';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis } from 'recharts';
import { getMarketHandbook, getShoppingAdvice, extractIngredients, analyzeSpending, suggestDailyMenu } from './services/geminiService';
import { supabase } from './services/supabase';

const GOAL_ICONS = ['🎁', '🏖️', '🏠', '🚗', '📱', '💍', '🎓', '🍱', '🚲', '🎸', '✈️', '💄', '🧸', '🍰', '🐶', '🍕', '💻', '👠', '👜', '🕶️', '🧵', '📷', '⛺', '🏝️', '💒', '👶', '🏥', '🦷'];

const GOAL_COLORS = [
  { id: 'pink', name: 'Hồng Đào', value: 'from-pink-100 to-rose-100', border: 'border-pink-200', text: 'text-pink-600', accent: 'bg-pink-500', bar: 'bg-gradient-to-r from-pink-400 to-rose-400', btn: 'bg-pink-200/50 text-pink-700', badge: 'bg-pink-500 text-pink-600' },
  { id: 'blue', name: 'Xanh Mây', value: 'from-blue-100 to-cyan-100', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500', bar: 'bg-gradient-to-r from-blue-400 to-cyan-400', btn: 'bg-blue-200/50 text-blue-700', badge: 'bg-blue-500 text-blue-600' },
  { id: 'mint', name: 'Lá Non', value: 'from-emerald-100 to-teal-100', border: 'border-emerald-200', text: 'text-emerald-600', accent: 'bg-emerald-500', bar: 'bg-gradient-to-r from-emerald-400 to-teal-400', btn: 'bg-emerald-200/50 text-emerald-700', badge: 'bg-emerald-500 text-emerald-600' },
  { id: 'lavender', name: 'Tím Biếc', value: 'from-purple-100 to-indigo-100', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500', bar: 'bg-gradient-to-r from-purple-400 to-indigo-400', btn: 'bg-purple-200/50 text-purple-700', badge: 'bg-purple-500 text-purple-600' },
  { id: 'amber', name: 'Nắng Vàng', value: 'from-orange-100 to-amber-100', border: 'border-orange-200', text: 'text-orange-600', accent: 'bg-orange-500', bar: 'bg-gradient-to-r from-orange-400 to-amber-500', btn: 'bg-orange-200/50 text-orange-700', badge: 'bg-orange-500 text-orange-600' },
];

const App: React.FC = () => {
  // App State
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [appTheme, setAppTheme] = useState<AppTheme>('pink');

  // Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Wallet & Family State
  const [walletMode, setWalletMode] = useState<WalletMode>('personal');
  const [weeklyBudget, setWeeklyBudget] = useState<number>(1500000);
  const [familyBudget, setFamilyBudget] = useState<number>(15000000);
  const [partnerInfo, setPartnerInfo] = useState<User | null>(null);
  const [familyStatus, setFamilyStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);

  // Feature Specific State
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isHandbookLoading, setIsHandbookLoading] = useState(false);
  const [handbookContent, setHandbookContent] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedHandbookTopic, setSelectedHandbookTopic] = useState<'prices' | 'freshness' | 'recipes' | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Meal Planner State
  const [menuStyle, setMenuStyle] = useState('Tiết kiệm');
  const [dailyMenu, setDailyMenu] = useState<any>(null);
  const [isMenuLoading, setIsMenuLoading] = useState(false);

  // Inputs
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState(GOAL_ICONS[0]);
  const [newShoppingName, setNewShoppingName] = useState('');
  const [shoppingAdvice, setShoppingAdvice] = useState<string | null>(null);
  const [goalContributionInputs, setGoalContributionInputs] = useState<Record<string, string>>({});

  // Helper for Vietnamese errors
  const getFriendlyErrorMessage = (error: string) => {
    if (error.includes("Invalid login credentials")) return "Email hoặc mật khẩu chưa đúng nha!";
    if (error.includes("User already registered")) return "Email này đã được đăng ký rồi!";
    if (error.includes("Password should be")) return "Mật khẩu hơi ngắn, thêm chút nữa đi!";
    if (error.includes("rate limit")) return "Thử lại sau ít phút nhé Mây ơi!";
    return "Có chút lỗi nhỏ: " + error;
  };

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(getFriendlyErrorMessage(error.message));
    setIsAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email: authEmail, 
      password: authPassword, 
      options: { data: { name: authName } } 
    });
    
    if (authError) {
      setAuthError(getFriendlyErrorMessage(authError.message));
      setIsAuthLoading(false);
      return;
    }

    if (authData.user) {
      // Manual profile creation to ensure data exists immediately for the UI
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: authData.user.id,
        email: authEmail,
        name: authName,
        weekly_budget: 1500000,
        family_budget: 15000000
      }]);
      
      if (profileError) {
        console.error("Lỗi tạo profile:", profileError);
      }
      
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
      setWeeklyBudget(1500000);
      setFamilyBudget(15000000);
      setWalletMode('personal');
      setActiveTab('home');
    }
  };

  // --- DATA FETCHING ---
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;
    
    // Fetch Profile
    const { data: profileData } = await supabase.from('profiles').select('weekly_budget, family_budget').eq('id', currentUser.id).single();
    if (profileData) {
      if (profileData.weekly_budget) setWeeklyBudget(profileData.weekly_budget);
      if (profileData.family_budget) setFamilyBudget(profileData.family_budget);
    }

    // Fetch Expenses
    let userIds = [currentUser.id];
    if (partnerInfo && familyStatus === 'connected') userIds.push(partnerInfo.id);
    const { data: expData } = await supabase.from('expenses').select('*').in('user_id', userIds).order('date', { ascending: false });
    if (expData) setExpenses(expData.filter(e => e.user_id === currentUser.id || e.is_family));
    
    // Fetch Goals with Mapping snake_case -> camelCase
    const { data: goalData } = await supabase.from('saving_goals').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (goalData) {
      const mappedGoals = goalData.map((g: any) => ({
        ...g,
        targetAmount: g.target_amount ?? g.targetAmount,
        savedAmount: g.saved_amount ?? g.savedAmount
      }));
      setSavingGoals(mappedGoals);
    }
    
    // Fetch Shopping List
    const { data: shopData } = await supabase.from('shopping_list').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
    if (shopData) setShoppingList(shopData);
  }, [currentUser, partnerInfo, familyStatus]);

  const fetchFamilyConnection = useCallback(async () => {
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
  }, [currentUser]);

  // --- EFFECTS ---
  
  // 1. Initial Session Check
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name || 'Mây' });
      }
      setIsAppLoading(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name || 'Mây' });
      } else {
        // Only set null here, logout cleanup is handled in handleLogout or manually if needed
        if (!session) setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Data Fetching & Realtime
  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      fetchFamilyConnection();

      const channel = supabase.channel('db_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            if (['expenses', 'shopping_list', 'saving_goals', 'profiles'].includes(payload.table)) {
              fetchUserData();
            }
            if (payload.table === 'family_links') {
              fetchFamilyConnection();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, fetchUserData, fetchFamilyConnection]);

  // --- LOGIC HANDLERS ---
  
  const handleSendFamilyRequest = async () => {
    if (!partnerEmailInput.trim() || !currentUser) return;
    setIsLinkingLoading(true);
    const { data: partnerData, error: findError } = await supabase.from('profiles').select('id').eq('email', partnerEmailInput.trim()).single();
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
    const { error: insertError } = await supabase.from('family_links').insert([{ user_id_1: currentUser.id, user_id_2: partnerData.id, status: 'pending' }]);
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
      setTimeout(() => fetchUserData(), 500);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Mây có chắc muốn dừng chia sẻ ví không?")) return;
    if (!currentUser) return;
    const { error } = await supabase.from('family_links').delete().eq('status', 'connected').or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`);
    if (!error) {
      setPartnerInfo(null);
      setFamilyStatus('none');
      setWalletMode('personal');
      fetchUserData();
      alert("Đã ngắt kết nối ví gia đình.");
    }
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

  const handleContributeToGoals = async (goalId: string, amount: number, showOverlay = true) => {
    if (!currentUser || amount <= 0) return;
    const goal = savingGoals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.savedAmount + amount;
    const { error } = await supabase.from('saving_goals').update({ saved_amount: newAmount }).eq('id', goalId);
    
    if (!error) {
      setSavingGoals(prev => prev.map(g => g.id === goalId ? { ...g, savedAmount: newAmount } : g));
      setGoalContributionInputs(prev => ({ ...prev, [goalId]: '' }));
      if (showOverlay) {
        setShowRewardOverlay('💰');
        setTimeout(() => setShowRewardOverlay(null), 1500);
      }
    } else {
      alert("Lỗi cập nhật: " + error.message);
    }
  };

  const handleCreateGoal = async () => {
    if (!currentUser || !newGoalName || !newGoalTarget) return;
    const randomColor = GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)].id;
    const iconToUse = newGoalIcon || GOAL_ICONS[0];
    
    // Using snake_case for DB columns
    const { data, error } = await supabase.from('saving_goals').insert([{
      user_id: currentUser.id,
      name: newGoalName,
      target_amount: parseInt(newGoalTarget),
      saved_amount: 0,
      icon: iconToUse,
      color: randomColor
    }]).select();

    if (error) {
      alert("Không thể tạo hũ mục tiêu: " + error.message);
      return;
    }

    if (data) {
      const createdGoal = data[0];
      const mappedGoal: SavingGoal = {
        ...createdGoal,
        targetAmount: createdGoal.target_amount ?? createdGoal.targetAmount,
        savedAmount: createdGoal.saved_amount ?? createdGoal.savedAmount
      };
      setSavingGoals([mappedGoal, ...savingGoals]);
      setIsAddingGoal(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalIcon(GOAL_ICONS[0]);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if(!confirm('Mây có chắc muốn đập vỡ hũ này không?')) return;
    const { error } = await supabase.from('saving_goals').delete().eq('id', id);
    if (!error) {
      setSavingGoals(prev => prev.filter(g => g.id !== id));
    } else {
      alert("Lỗi xóa: " + error.message);
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

  const handleQuestComplete = async (amount: number) => {
    if (savingGoals.length > 0) {
      const targetGoal = savingGoals[0];
      await handleContributeToGoals(targetGoal.id, amount, false);
      setShowConfetti(true);
      setShowRewardOverlay(`+${(amount/1000).toLocaleString()}k`);
      setTimeout(() => {
        setShowConfetti(false);
        setShowRewardOverlay(null);
      }, 3000);
    } else {
      if (confirm("Mây chưa có hũ tiết kiệm nào để đựng tiền thưởng. Mây có muốn tạo hũ mới ngay không? 🎯")) {
         setActiveTab('tools');
         setSelectedTool('goals');
         setIsAddingGoal(true);
      }
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

  const handleSuggestMenu = async () => {
    setIsMenuLoading(true);
    const menu = await suggestDailyMenu(menuStyle);
    setDailyMenu(menu);
    setIsMenuLoading(false);
  };

  const handleAddMenuToCart = async (ingredients: string[]) => {
    if (!ingredients || ingredients.length === 0) return;
    for (const ing of ingredients) {
      await handleAddShoppingItem(ing);
    }
    alert(`Đã thêm ${ingredients.length} nguyên liệu vào giỏ hàng! 🛒`);
  };

  const handleUpdateBudget = async (type: 'weekly' | 'family', amount: string) => {
     const value = parseInt(amount);
     if (isNaN(value) || value < 0) return;
     if (type === 'weekly') {
       setWeeklyBudget(value);
     } else {
       setFamilyBudget(value);
     }
     if (currentUser) {
        const updateData = type === 'weekly' ? { weekly_budget: value } : { family_budget: value };
        const { error } = await supabase.from('profiles').update(updateData).eq('id', currentUser.id);
        if (error) console.error("Failed to sync budget to cloud:", error);
     }
  };

  const handleAnalyzeSpending = async () => {
    const relevantExpenses = expenses.filter(e => walletMode === 'family' ? e.is_family : !e.is_family);
    const currentBudget = walletMode === 'family' ? familyBudget : weeklyBudget * 4; 
    setIsAnalyzing(true);
    const analysis = await analyzeSpending(relevantExpenses.slice(0, 30), currentBudget);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // --- MEMOS ---
  const totalSpentMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses.filter(e => e.amount > 0 && (walletMode === 'personal' ? !e.is_family : e.is_family) && new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, walletMode]);

  const totalSavedAmount = useMemo(() => {
    return savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  }, [savingGoals]);

  const weeklySpent = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    return expenses.filter(e => !e.is_family && new Date(e.date) >= startOfWeek && e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

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

  // --- RENDER ---
  
  // Loading Screen
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-blue-100 opacity-20"></div>
         <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl animate-bounce z-10 text-5xl">🐷</div>
         <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest animate-pulse">Đang tải Heo Đất...</p>
      </div>
    );
  }

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#FFF5F7]">
        {/* Decorative Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-purple-200 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-pink-200 rounded-full blur-[100px] opacity-40"></div>
        
        <div className="w-full max-w-sm relative z-10">
           <div className="flex flex-col items-center mb-8">
              <div className="w-28 h-28 bg-white/80 backdrop-blur-md rounded-[32px] flex items-center justify-center shadow-2xl mb-6 animate-soft-bounce border border-white">
                <span className="text-6xl filter drop-shadow-sm">🐷</span>
              </div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight text-center mb-2">
                {isRegistering ? 'Gia Nhập Nhà Mây' : 'Chào Mây Quay Lại!'}
              </h1>
              <p className="text-sm font-bold text-gray-400 text-center">
                {isRegistering ? 'Tạo hũ heo để bắt đầu hành trình tiết kiệm.' : 'Đăng nhập để xem "gia tài" của bạn.'}
              </p>
           </div>

           <div className="glass-morphism rounded-[40px] p-8 shadow-xl border border-white/60">
              {authError && (
                <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 flex items-center gap-2 animate-in slide-in-from-top-2">
                  <i className="fa-solid fa-triangle-exclamation"></i> {authError}
                </div>
              )}
              
              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
                {isRegistering && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tên của Mây</label>
                    <input type="text" placeholder="Ví dụ: Mây Xinh" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full p-4 bg-gray-50/80 rounded-2xl outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all shadow-inner" required />
                  </div>
                )}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email</label>
                    <input type="email" placeholder="may@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full p-4 bg-gray-50/80 rounded-2xl outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all shadow-inner" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mật khẩu</label>
                    <input type="password" placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full p-4 bg-gray-50/80 rounded-2xl outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all shadow-inner" required />
                </div>
                
                <button disabled={isAuthLoading} type="submit" className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-200/50 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
                   {isAuthLoading && <i className="fa-solid fa-spinner fa-spin"></i>}
                   {isRegistering ? 'Đăng Ký Ngay' : 'Vào Chăm Heo'}
                </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                 <p className="text-xs font-bold text-gray-400 mb-2">{isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</p>
                 <button onClick={() => setIsRegistering(!isRegistering)} className="text-pink-500 font-black text-sm hover:underline tracking-wide">
                   {isRegistering ? 'Đăng nhập tại đây' : 'Tạo tài khoản mới'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Main App Interface
  return (
    <div className={`max-w-md mx-auto min-h-screen pb-32 relative ${walletMode === 'family' ? 'bg-[#FFF9F0]' : currentTheme.bg} transition-all duration-700`}>
      {showRewardOverlay && <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[1000] animate-bounce text-9xl">{showRewardOverlay}</div>}
      
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

      {/* Header */}
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
           <div className="absolute right-12 top-0 w-48 bg-white p-3 rounded-l-2xl rounded-tr-2xl rounded-br-sm shadow-xl border border-pink-100 animate-in fade-in slide-in-from-right-4">
             <p className="text-[10px] font-bold text-gray-600 leading-tight">
               {getMascotMessage(totalSavedAmount)}
             </p>
           </div>
           <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-2xl shadow-xl p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 border border-pink-50 z-50">
             <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
               <i className="fa-solid fa-right-from-bracket mr-2"></i> Đăng xuất
             </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
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

            {/* Daily Quest */}
            <div>
              <div className="flex justify-between items-end mb-4">
                 <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                   <i className="fa-solid fa-scroll text-amber-400"></i> Nhiệm Vụ Hằng Ngày
                 </h3>
                 {savingGoals.length > 0 && (
                   <span className="text-[10px] font-bold text-gray-400 bg-white/50 px-3 py-1 rounded-full border border-white">
                     Mục tiêu: <span className="text-pink-500">{savingGoals[0].name}</span>
                   </span>
                 )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar snap-x px-1">
                {[
                  { id: 'coffee', title: 'Cai Trà Sữa', amount: 30000, icon: <div className="relative"><i className="fa-solid fa-glass-water text-blue-400 text-3xl"></i><i className="fa-solid fa-leaf text-green-400 absolute -top-1 -right-2 text-xs"></i></div>, color: 'from-orange-400 to-pink-500', bg: 'bg-orange-50', desc: 'Uống nước lọc cho healthy!' },
                  { id: 'change', title: 'Góp Tiền Lẻ', amount: 5000, icon: <i className="fa-solid fa-piggy-bank text-emerald-500 text-3xl"></i>, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', desc: 'Tích tiểu thành đại nè' },
                  { id: 'fine', title: 'Phạt Bản Thân', amount: 50000, icon: <i className="fa-solid fa-bolt text-rose-500 text-3xl"></i>, color: 'from-rose-400 to-red-500', bg: 'bg-rose-50', desc: 'Lần sau không thế nữa!' }
                ].map(quest => (
                  <div key={quest.id} className="snap-center min-w-[160px] relative group">
                     <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[32px] border-2 border-white shadow-lg flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${quest.color} bg-opacity-10 flex items-center justify-center shadow-sm border border-white`}>
                           <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                              {quest.icon}
                           </div>
                        </div>
                        <div className="text-center w-full">
                           <h4 className="font-black text-gray-700 text-xs uppercase tracking-tight mb-1">{quest.title}</h4>
                           <p className="text-[9px] font-bold text-gray-400 line-clamp-1">{quest.desc}</p>
                        </div>
                        <div className="w-full h-[1px] bg-gray-100"></div>
                        <p className={`text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${quest.color}`}>+{quest.amount.toLocaleString()}đ</p>
                        
                        <button 
                          onClick={() => handleQuestComplete(quest.amount)}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-black text-white bg-gradient-to-r ${quest.color} shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 group-hover:gap-2`}
                        >
                          <span>Thực hiện</span> <i className="fa-solid fa-arrow-right"></i>
                        </button>
                     </div>
                     <div className={`absolute -z-10 inset-4 bg-gradient-to-r ${quest.color} blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                  </div>
                ))}
              </div>
            </div>
            <PiggyBank savings={totalSavedAmount} />
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">Sổ Tay 📖</h2>
                <div className="text-[10px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  {expenses.length} giao dịch
                </div>
             </div>
             
             <div className="space-y-6">
                {Object.keys(historyGrouped).length === 0 ? (
                  <div className="text-center py-20 opacity-50">
                    <div className="text-6xl mb-4">📓</div>
                    <p className="font-bold text-gray-400">Sổ tay trống trơn à...</p>
                  </div>
                ) : (
                  Object.keys(historyGrouped).map(date => (
                    <div key={date}>
                      <div className="sticky top-20 bg-white/80 backdrop-blur-md z-30 py-2 px-4 rounded-xl shadow-sm border border-gray-100 inline-block mb-3">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{date}</span>
                      </div>
                      <div className="space-y-3">
                        {historyGrouped[date].map(exp => (
                          <div key={exp.id} className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex justify-between items-center group hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${walletMode === 'family' && exp.is_family ? 'bg-orange-100' : 'bg-gray-50'}`} style={{backgroundColor: !exp.is_family ? CATEGORY_COLORS[exp.category as Category] : undefined}}>
                                {CATEGORY_ICONS[exp.category as Category]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800 text-sm">{exp.note || exp.category}</p>
                                <p className="text-[10px] font-bold text-gray-400">{exp.category}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               <p className="font-black text-gray-800 text-sm">-{exp.amount.toLocaleString()}đ</p>
                               <div className="flex gap-3">
                                 <button onClick={() => { setEditExpense(exp); setIsFormOpen(true); }} className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity hover:underline font-bold">Sửa</button>
                                 <button onClick={() => handleDeleteExpense(exp.id)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:underline font-bold">Xóa</button>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in duration-500 pb-20">
             <h2 className="text-2xl font-black text-gray-800 mb-6">Báo Cáo Chi Tiêu 📊</h2>
             <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100 mb-6">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Phân bổ chi tiêu</h3>
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {categoryData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#ccc'} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-4">
                 {categoryData.map(d => (
                   <div key={d.name} className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: CATEGORY_COLORS[d.name as Category]}}></div>
                     <span>{d.name}: {d.value.toLocaleString()}</span>
                   </div>
                 ))}
               </div>
             </div>
             <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100 mb-8">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Xu hướng 7 ngày</h3>
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={dailyTrendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                     <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{fill: 'transparent'}} />
                     <Bar dataKey="amount" fill="#F472B6" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                       <i className="fa-solid fa-robot"></i>
                     </div>
                     <h3 className="font-black text-lg">Góc Nhìn Thỏ Mây</h3>
                   </div>
                   {isAnalyzing ? (
                     <div className="py-4 text-center text-sm font-bold opacity-80 animate-pulse">Đang suy nghĩ... 🤔</div>
                   ) : aiAnalysis ? (
                     <div className="text-sm leading-relaxed font-medium bg-white/10 p-4 rounded-2xl backdrop-blur-sm">{aiAnalysis}</div>
                   ) : (
                     <p className="text-sm opacity-80 mb-4">Mây có muốn nghe nhận xét về cách chi tiêu tháng này không?</p>
                   )}
                   {!isAnalyzing && !aiAnalysis && (
                     <button onClick={handleAnalyzeSpending} className="w-full bg-white text-indigo-600 font-black py-3 rounded-xl shadow-lg mt-2 active:scale-95 transition-all">Phân Tích Ngay ✨</button>
                   )}
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl opacity-30"></div>
             </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="animate-in fade-in duration-500 pb-20">
             <h2 className="text-2xl font-black text-gray-800 mb-6">Tiện Ích 🛠️</h2>
             
             {!selectedTool && (
             <div className="grid grid-cols-2 gap-4 mb-8">
               <button onClick={() => setSelectedTool('shopping')} className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${selectedTool === 'shopping' ? 'bg-pink-100 border-pink-300' : 'bg-white border-gray-100 hover:border-pink-200'}`}>
                 <span className="text-3xl">🛒</span>
                 <span className="text-xs font-black text-gray-600 uppercase">Đi Chợ</span>
               </button>
               <button onClick={() => setSelectedTool('goals')} className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${selectedTool === 'goals' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                 <span className="text-3xl">🎯</span>
                 <span className="text-xs font-black text-gray-600 uppercase">Mục Tiêu</span>
               </button>
               <button onClick={() => setSelectedTool('family_wallet')} className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${selectedTool === 'family_wallet' ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-100 hover:border-orange-200'}`}>
                 <span className="text-3xl">🏠</span>
                 <span className="text-xs font-black text-gray-600 uppercase">Ví Gia Đình</span>
               </button>
               <button onClick={() => setSelectedTool('budget')} className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${selectedTool === 'budget' ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-gray-100 hover:border-emerald-200'}`}>
                 <span className="text-3xl">💸</span>
                 <span className="text-xs font-black text-gray-600 uppercase">Ngân Sách</span>
               </button>
               <button onClick={() => setSelectedTool('market_handbook')} className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${selectedTool === 'market_handbook' ? 'bg-green-100 border-green-300' : 'bg-white border-gray-100 hover:border-green-200'}`}>
                 <span className="text-3xl">📒</span>
                 <span className="text-xs font-black text-gray-600 uppercase">Cẩm Nang</span>
               </button>
               <button onClick={() => setSelectedTool('meal_planner')} className={`p-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${selectedTool === 'meal_planner' ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-100 hover:border-yellow-200'}`}>
                 <span className="text-3xl">🍱</span>
                 <span className="text-xs font-black text-gray-600 uppercase">Thực Đơn</span>
               </button>
             </div>
             )}

             {selectedTool && (
               <div className="mb-4">
                 <button onClick={() => { setSelectedTool(null); setSelectedHandbookTopic(null); setHandbookContent(null); }} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                  <i className="fa-solid fa-arrow-left"></i> Quay lại
                </button>
               </div>
             )}

             <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 min-h-[300px]">
                {!selectedTool && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
                    <i className="fa-solid fa-hand-pointer text-4xl mb-4 animate-bounce"></i>
                    <p className="text-sm font-bold">Chọn một tiện ích nhé!</p>
                  </div>
                )}

                {/* Shopping List */}
                {selectedTool === 'shopping' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                       <h3 className="font-black text-gray-800 text-lg">Danh Sách Đi Chợ</h3>
                       <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                          {shoppingList.filter(i => i.completed).length}/{shoppingList.length} món
                       </div>
                    </div>
                    
                    <div className="relative">
                       <input 
                         type="text" 
                         value={newShoppingName}
                         onChange={(e) => setNewShoppingName(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddShoppingItem()}
                         placeholder="Thêm món cần mua..."
                         className="w-full bg-pink-50/50 rounded-2xl pl-12 pr-4 py-4 outline-none font-bold text-gray-600 focus:bg-white focus:ring-2 ring-pink-100 transition-all border border-transparent focus:border-pink-200 shadow-sm"
                       />
                       <i className="fa-solid fa-cart-plus absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 text-lg"></i>
                       <button 
                         onClick={() => handleAddShoppingItem()}
                         className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-pink-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-95 border border-pink-100"
                       >
                         <i className="fa-solid fa-plus"></i>
                       </button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar px-1 pb-2">
                      {shoppingList.map(item => (
                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${item.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}>
                           <div className="flex items-center gap-4 flex-1">
                             <button onClick={() => handleToggleShoppingItem(item.id, item.completed)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.completed ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 hover:border-pink-300'}`}>
                               {item.completed && <i className="fa-solid fa-check text-xs"></i>}
                             </button>
                             <span className={`font-bold text-sm transition-all ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.name}</span>
                           </div>
                           <button onClick={() => handleDeleteShoppingItem(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                             <i className="fa-solid fa-trash-can text-sm"></i>
                           </button>
                        </div>
                      ))}
                    </div>

                    {shoppingList.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                         <button onClick={handleGetShoppingAdvice} disabled={isAdviceLoading} className="w-full py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:from-purple-100 hover:to-pink-100 transition-all flex items-center justify-center gap-2 border border-purple-100/50">
                           {isAdviceLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                           Mẹo đi chợ từ AI
                         </button>
                         {shoppingAdvice && (
                           <div className="mt-3 p-4 bg-purple-50 rounded-xl text-sm text-gray-600 leading-relaxed animate-in fade-in border border-purple-100">
                             {shoppingAdvice}
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                )}

                {/* Saving Goals */}
                {selectedTool === 'goals' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center">
                        <h3 className="font-black text-gray-800 text-lg">Mục Tiêu Tiết Kiệm</h3>
                        <button onClick={() => setIsAddingGoal(!isAddingGoal)} className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm">
                          <i className={`fa-solid ${isAddingGoal ? 'fa-minus' : 'fa-plus'}`}></i>
                        </button>
                     </div>

                     {isAddingGoal && (
                       <div className="bg-blue-50/50 p-5 rounded-[28px] space-y-4 animate-in fade-in slide-in-from-top-2 border border-blue-100">
                          <input type="text" placeholder="Tên mục tiêu (vd: Du lịch)" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="w-full p-4 rounded-2xl border border-blue-100 outline-none text-sm font-bold focus:ring-2 ring-blue-100 transition-all" />
                          <input type="number" placeholder="Số tiền cần (VNĐ)" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full p-4 rounded-2xl border border-blue-100 outline-none text-sm font-bold focus:ring-2 ring-blue-100 transition-all" />
                          
                          {/* Icon Selection */}
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Chọn biểu tượng</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                              {GOAL_ICONS.map((icon, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => setNewGoalIcon(icon)}
                                  className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg bg-white border-2 transition-all ${newGoalIcon === icon ? 'border-blue-400 bg-blue-50 shadow-sm scale-110' : 'border-transparent hover:border-blue-200'}`}
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <button onClick={handleCreateGoal} className="w-full bg-blue-500 text-white py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Tạo Hũ Mới ✨</button>
                       </div>
                     )}

                     <div className="space-y-5">
                        {savingGoals.map(goal => {
                           const goalConfig = GOAL_COLORS.find(c => c.id === goal.color) || GOAL_COLORS[0];
                           const percent = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                           
                           return (
                             <div key={goal.id} className={`border-2 ${goalConfig.border} rounded-[32px] p-6 relative overflow-hidden group hover:shadow-xl transition-all bg-white`}>
                                <div className={`absolute bottom-0 left-0 h-2 ${goalConfig.bar}`} style={{width: `${percent}%`}}></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                   <div className="flex gap-4 items-center">
                                      <div onClick={() => handleCycleGoalIcon(goal.id, goal.icon)} className={`w-14 h-14 rounded-2xl ${goalConfig.badge} bg-opacity-20 flex items-center justify-center text-3xl shadow-sm border border-white cursor-pointer hover:scale-110 transition-transform`}>
                                        {goal.icon}
                                      </div>
                                      <div>
                                         <h4 className="font-black text-gray-800 text-lg">{goal.name}</h4>
                                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Mục tiêu: {goal.targetAmount.toLocaleString()}đ</p>
                                      </div>
                                   </div>
                                   <button onClick={() => handleDeleteGoal(goal.id)} className="w-8 h-8 rounded-full bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
                                </div>

                                <div className="flex justify-between items-end mb-6 pl-1">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-gray-400 mb-1">Đã tiết kiệm</span>
                                      <span className={`text-3xl font-black ${goalConfig.text} tracking-tight`}>{goal.savedAmount.toLocaleString()}đ</span>
                                   </div>
                                   <div className={`text-xs font-black px-3 py-1 rounded-full ${goalConfig.badge} bg-opacity-20`}>{Math.round(percent)}%</div>
                                </div>

                                {/* Contribution Input */}
                                <div className="flex gap-2 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                                   <input 
                                     type="number" 
                                     placeholder="Nhập số tiền góp thêm..." 
                                     value={goalContributionInputs[goal.id] || ''}
                                     onChange={(e) => setGoalContributionInputs(prev => ({...prev, [goal.id]: e.target.value}))}
                                     className="flex-1 bg-white rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-gray-200 transition-all text-gray-700"
                                   />
                                   <button 
                                     onClick={() => {
                                        const amount = parseInt(goalContributionInputs[goal.id]);
                                        if (!isNaN(amount)) handleContributeToGoals(goal.id, amount);
                                     }}
                                     className={`${goalConfig.bar} text-white w-12 rounded-xl font-black text-lg active:scale-95 transition-all shadow-md flex items-center justify-center`}
                                   >
                                     <i className="fa-solid fa-plus"></i>
                                   </button>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                )}
                
                {/* Family Wallet */}
                {selectedTool === 'family_wallet' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <h3 className="font-black text-gray-800 text-lg">Kết Nối Gia Đình 🏠</h3>
                    {familyStatus === 'none' && (
                       <div className="bg-orange-50 p-6 rounded-[24px] text-center border border-orange-100">
                          <i className="fa-solid fa-heart-circle-plus text-4xl text-orange-400 mb-4"></i>
                          <p className="text-sm font-bold text-gray-600 mb-4">Kết nối với người thương để cùng quản lý chi tiêu và tích lũy nhé!</p>
                          <div className="flex gap-2 mb-6">
                            <input type="email" value={partnerEmailInput} onChange={e => setPartnerEmailInput(e.target.value)} placeholder="Email người ấy..." className="w-full p-3 rounded-xl border border-orange-200 outline-none font-bold text-sm" />
                            <button onClick={handleSendFamilyRequest} disabled={isLinkingLoading} className="bg-orange-500 text-white px-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50"><i className="fa-solid fa-paper-plane"></i></button>
                          </div>
                          {pendingRequests.length > 0 && (
                            <div className="text-left space-y-2">
                              <p className="text-xs font-black text-gray-400 uppercase">Lời mời đang chờ</p>
                              {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                                  <div><p className="font-bold text-gray-800 text-sm">{req.profiles?.name || 'Ai đó'}</p><p className="text-[10px] text-gray-400">{req.profiles?.email}</p></div>
                                  <button onClick={() => handleAcceptRequest(req.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold">Đồng ý</button>
                                </div>
                              ))}
                            </div>
                          )}
                       </div>
                    )}
                    {familyStatus === 'pending' && (
                      <div className="bg-yellow-50 p-6 rounded-[24px] text-center border border-yellow-100">
                         <i className="fa-solid fa-clock text-4xl text-yellow-400 mb-4 animate-pulse"></i>
                         <p className="font-bold text-gray-600">Đang chờ người ấy đồng ý nha...</p>
                         <button onClick={() => setFamilyStatus('none')} className="mt-4 text-xs font-bold text-red-400 hover:underline">Hủy lời mời</button>
                      </div>
                    )}
                    {familyStatus === 'connected' && partnerInfo && (
                      <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-6 rounded-[24px] border border-orange-200 relative overflow-hidden">
                         <div className="relative z-10 text-center">
                            <div className="flex justify-center -space-x-4 mb-4">
                               <div className="w-12 h-12 rounded-full bg-pink-200 border-2 border-white flex items-center justify-center text-xl">👩</div>
                               <div className="w-12 h-12 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-xl">👨</div>
                            </div>
                            <h4 className="font-black text-gray-800 text-lg mb-1">Gia Đình Hạnh Phúc</h4>
                            <p className="text-xs font-bold text-gray-500 mb-6">Đang kết nối với {partnerInfo.name}</p>
                            <button onClick={handleUnlink} className="bg-white text-red-500 px-6 py-2 rounded-xl text-xs font-black uppercase shadow-sm hover:bg-red-50">Ngắt kết nối</button>
                         </div>
                         <div className="absolute top-0 left-0 w-full h-full bg-white/30 backdrop-blur-3xl -z-0"></div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Budget Tool */}
                {selectedTool === 'budget' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <section className="bg-white space-y-8">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg"><i className="fa-solid fa-sack-dollar"></i></div>
                          <div><h3 className="text-lg font-black text-gray-800">Cài Đặt Ngân Sách</h3></div>
                       </div>
                       <div className="space-y-6">
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Ngân sách tuần (Cá nhân)</label>
                             <div className="relative">
                                <input type="number" value={weeklyBudget} onChange={(e) => handleUpdateBudget('weekly', e.target.value)} className="w-full bg-emerald-50 p-5 rounded-[24px] outline-none font-black text-xl text-emerald-800 border-2 border-transparent focus:border-emerald-300 transition-all" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">VNĐ</span>
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">Ngân sách tháng (Gia đình)</label>
                             <div className="relative">
                                <input type="number" value={familyBudget} onChange={(e) => handleUpdateBudget('family', e.target.value)} className="w-full bg-orange-50 p-5 rounded-[24px] outline-none font-black text-xl text-orange-800 border-2 border-transparent focus:border-orange-300 transition-all" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-400">VNĐ</span>
                             </div>
                          </div>
                          <p className="text-[10px] text-gray-400 italic text-center">* Dữ liệu được lưu tự động nha Mây!</p>
                       </div>
                    </section>
                  </div>
                )}

                {/* Handbook Tool */}
                {selectedTool === 'market_handbook' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                     <h3 className="font-black text-gray-800 text-lg">Cẩm Nang Nội Trợ 📒</h3>
                     <div className="flex gap-2 overflow-x-auto pb-2">
                        <button onClick={() => handleFetchHandbook('prices')} className="whitespace-nowrap px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase hover:bg-green-100">💸 Giá cả</button>
                        <button onClick={() => handleFetchHandbook('freshness')} className="whitespace-nowrap px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase hover:bg-green-100">🥬 Chọn đồ tươi</button>
                        <button onClick={() => handleFetchHandbook('recipes')} className="whitespace-nowrap px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase hover:bg-green-100">🍳 Công thức</button>
                     </div>
                     {isHandbookLoading ? (
                        <div className="py-10 text-center text-gray-400"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>
                     ) : handbookContent ? (
                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                           <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">{handbookContent}</div>
                           {selectedHandbookTopic === 'recipes' && (
                             <button onClick={handleExtractToCart} className="w-full bg-green-500 text-white py-2 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95">Thêm nguyên liệu vào giỏ 🛒</button>
                           )}
                        </div>
                     ) : (
                        <p className="text-center text-xs text-gray-400 py-10">Chọn chủ đề để xem nhé!</p>
                     )}
                  </div>
                )}

                {/* Meal Planner Tool */}
                {selectedTool === 'meal_planner' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-400 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg"><i className="fa-solid fa-utensils"></i></div>
                        <div><h3 className="text-lg font-black text-gray-800">Thực Đơn Hôm Nay</h3></div>
                     </div>

                     <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Phong cách ăn uống</label>
                        <div className="flex gap-2 flex-wrap">
                          {['Tiết kiệm', 'Healthy', 'Món nhậu', 'Cuối tuần', 'Chay', 'Nhanh gọn'].map(style => (
                            <button 
                              key={style} 
                              onClick={() => setMenuStyle(style)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${menuStyle === style ? 'bg-yellow-400 text-white border-yellow-400 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-yellow-200'}`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={handleSuggestMenu} 
                          disabled={isMenuLoading}
                          className="w-full py-3 bg-yellow-400 text-white rounded-xl font-black text-sm uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {isMenuLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                          Gợi ý thực đơn
                        </button>
                     </div>

                     {dailyMenu && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm italic text-gray-600">
                             💡 {dailyMenu.tips}
                          </div>
                          
                          {['breakfast', 'lunch', 'dinner'].map((mealKey) => {
                             const meal = dailyMenu[mealKey];
                             const titles: Record<string, string> = { breakfast: 'Bữa Sáng ☀️', lunch: 'Bữa Trưa 🌤️', dinner: 'Bữa Tối 🌙' };
                             return (
                               <div key={mealKey} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-bl-[40px] opacity-50 -z-0"></div>
                                  <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">{titles[mealKey]}</h4>
                                  <h3 className="text-lg font-bold text-gray-800 mb-2 relative z-10">{meal.dish}</h3>
                                  <div className="flex flex-wrap gap-1 mb-3 relative z-10">
                                    {meal.ingredients.map((ing: string, i: number) => (
                                      <span key={i} className="text-[10px] bg-gray-50 px-2 py-1 rounded-md text-gray-500 border border-gray-100">{ing}</span>
                                    ))}
                                  </div>
                                  <button 
                                    onClick={() => handleAddMenuToCart(meal.ingredients)}
                                    className="text-[10px] font-bold text-yellow-600 flex items-center gap-1 hover:underline relative z-10"
                                  >
                                    <i className="fa-solid fa-plus-circle"></i> Đi chợ mua món này
                                  </button>
                               </div>
                             );
                          })}
                       </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onAddClick={() => { setEditExpense(null); setIsFormOpen(true); }} />

      {(isFormOpen || editExpense) && (
        <ExpenseForm onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onClose={() => { setIsFormOpen(false); setEditExpense(null); }} editData={editExpense} />
      )}
    </div>
  );
};

export default App;
