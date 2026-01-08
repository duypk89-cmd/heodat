
import React, { useState } from 'react';
import { Category, Expense } from '../types';
import { scanReceipt, processVoiceInput } from '../services/geminiService';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface ExpenseFormProps {
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onClose: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, onClose }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [note, setNote] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onAdd({
      amount: parseFloat(amount),
      category: category as Category,
      note,
      date: new Date().toISOString(),
    });
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const data = await scanReceipt(base64);
      if (data) {
        setAmount(data.amount.toString());
        setCategory(data.category);
        setNote(data.note);
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceInput = async () => {
    const text = prompt("Nói nhỏ với Mây nè (ví dụ: 'Mua thịt 50k, rau 20k')");
    if (!text) return;
    setIsProcessingVoice(true);
    const results = await processVoiceInput(text);
    if (results && results.length > 0) {
      setAmount(results[0].amount.toString());
      setCategory(results[0].category);
      setNote(results[0].note);
      if (results.length > 1) {
        alert(`Mây đã nhận diện ${results.length} món. Hiện đã điền món đầu tiên vào hũ!`);
      }
    }
    setIsProcessingVoice(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[48px] sm:rounded-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Gói Ghém Mới 🌸</h2>
            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mt-1">Nhập chi tiêu nhanh chóng</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <label className="cursor-pointer bg-blue-50/50 hover:bg-blue-100 transition-all p-5 rounded-[32px] flex flex-col items-center gap-3 border-2 border-dashed border-blue-200/50">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
               <i className={`fa-solid ${isScanning ? 'fa-spinner fa-spin' : 'fa-camera'} text-xl`}></i>
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{isScanning ? 'Đang đọc...' : 'Quét hóa đơn'}</span>
          </label>
          <button 
            onClick={handleVoiceInput}
            className="bg-purple-50/50 hover:bg-purple-100 transition-all p-5 rounded-[32px] flex flex-col items-center gap-3 border-2 border-dashed border-purple-200/50"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-purple-500 shadow-sm">
               <i className={`fa-solid ${isProcessingVoice ? 'fa-spinner fa-spin' : 'fa-microphone'} text-xl`}></i>
            </div>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{isProcessingVoice ? 'Đang nghe...' : 'Nói với Mây'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Số tiền chi tiêu (VNĐ)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-4xl font-black text-gray-800 bg-transparent border-b-4 border-pink-100 focus:border-pink-400 outline-none pb-4 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Bỏ vào hũ nào?</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(Category).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-1 rounded-[20px] text-[10px] font-black uppercase transition-all border-2 ${
                    category === cat 
                      ? 'bg-pink-500 border-pink-500 text-white shadow-lg scale-105' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-pink-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ghi chú nhỏ</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mây mua gì thế? (vd: Thịt lợn, rau muống...)"
              className="w-full p-5 bg-gray-50/50 rounded-[28px] outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-100 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black py-5 rounded-[32px] shadow-xl hover:shadow-2xl transition-all active:scale-95 text-lg"
          >
            Gói ghém lại ✨
          </button>
        </form>
      </div>
    </div>
  );
};
