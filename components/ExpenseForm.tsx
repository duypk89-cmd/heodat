
import React, { useState, useEffect, useRef } from 'react';
import { Category, Expense } from '../types';
import { scanReceipt, processVoiceInput } from '../services/geminiService';
import { CATEGORY_ICONS } from '../constants';

interface ExpenseFormProps {
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate?: (id: string, expense: Omit<Expense, 'id'>) => void;
  onClose: () => void;
  editData?: Expense | null;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, onUpdate, onClose, editData }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [note, setNote] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (editData) {
      setAmount(editData.amount.toString());
      setCategory(editData.category);
      setNote(editData.note);
    }
  }, [editData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    const data = {
      amount: parseFloat(amount),
      category: category as Category,
      note,
      date: editData ? editData.date : new Date().toISOString(),
      is_family: editData ? editData.is_family : false 
    };

    if (editData && onUpdate) {
      onUpdate(editData.id, data);
    } else {
      onAdd(data);
    }
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

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const text = prompt("Trình duyệt không hỗ trợ ghi âm trực tiếp. Mây hãy nhập tay yêu cầu nhé (vd: Mua thịt 50k)...");
      if (text) handleProcessVoiceText(text);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleProcessVoiceText(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleProcessVoiceText = async (text: string) => {
    setIsProcessingVoice(true);
    try {
      const results = await processVoiceInput(text);
      if (results && results.length > 0) {
        const item = results[0];
        setAmount(item.amount.toString());
        setCategory(item.category);
        setNote(item.note);
      }
    } catch (error) {
      console.error("Lỗi xử lý giọng nói:", error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[48px] sm:rounded-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-800">{editData ? 'Sửa Bỏ Ống' : 'Bỏ Ống Mới'} 🌸</h2>
            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mt-1">Smart UX - Nhập liệu thông minh</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {!editData && (
          <div className="grid grid-cols-2 gap-4 mb-10">
            <label className="cursor-pointer bg-blue-50/50 hover:bg-blue-100 transition-all p-6 rounded-[32px] flex flex-col items-center gap-3 border-2 border-dashed border-blue-200/50 group">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm group-active:scale-90 transition-transform">
                 <i className={`fa-solid ${isScanning ? 'fa-spinner fa-spin' : 'fa-receipt'} text-2xl`}></i>
              </div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{isScanning ? 'Đang đọc...' : 'Quét hóa đơn'}</span>
            </label>
            <button 
              type="button"
              onClick={startVoiceRecording} 
              className={`transition-all p-6 rounded-[32px] flex flex-col items-center gap-3 border-2 border-dashed group ${
                isRecording 
                ? 'bg-rose-100 border-rose-300 animate-pulse' 
                : 'bg-purple-50/50 hover:bg-purple-100 border-purple-200/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-active:scale-90 transition-transform ${isRecording ? 'text-rose-500' : 'text-purple-500'}`}>
                 <i className={`fa-solid ${isProcessingVoice ? 'fa-spinner fa-spin' : isRecording ? 'fa-stop' : 'fa-microphone'} text-2xl`}></i>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isRecording ? 'text-rose-600' : 'text-purple-600'}`}>
                {isProcessingVoice ? 'Đang phân tích...' : isRecording ? 'Đang nghe Mây...' : 'Ghi âm'}
              </span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Số tiền chi tiêu (VNĐ)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-5xl font-black text-gray-800 bg-transparent border-b-4 border-pink-100 focus:border-pink-400 outline-none pb-5 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Chọn danh mục</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(Category).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-4 px-1 rounded-[24px] text-[10px] font-black uppercase transition-all border-2 flex flex-col items-center gap-2 ${
                    category === cat 
                      ? 'bg-pink-500 border-pink-500 text-white shadow-xl' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-pink-200'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="truncate w-full px-1">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Ghi chú nhỏ</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mây mua gì thế?"
              className="w-full p-6 bg-gray-50/50 rounded-[28px] outline-none font-bold text-gray-700 border-2 border-transparent focus:border-pink-100 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black py-6 rounded-[32px] shadow-xl hover:shadow-2xl transition-all active:scale-95 text-xl"
          >
            {editData ? 'Lưu thay đổi ✨' : 'Bỏ vào heo ✨'}
          </button>
        </form>
      </div>
    </div>
  );
};
