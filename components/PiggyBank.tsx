
import React from 'react';

interface PiggyBankProps {
  savings: number;
}

export const PiggyBank: React.FC<PiggyBankProps> = ({ savings }) => {
  const level = Math.min(Math.floor(savings / 100000), 5); // Example: 100k per level
  const sizeClasses = ["scale-75", "scale-80", "scale-90", "scale-100", "scale-110", "scale-125"];
  
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 flex items-center justify-between mb-6">
      <div className="flex-1">
        <h3 className="font-bold text-gray-800">Heo Đất Tiết Kiệm 🐷</h3>
        <p className="text-sm text-gray-500 mt-1">
          {savings > 0 
            ? `Tháng này bạn đã tiết kiệm được ${savings.toLocaleString()}đ. Giỏi quá!`
            : "Bắt đầu tiết kiệm để chú heo lớn hơn nhé!"}
        </p>
        <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-pink-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((savings / 1000000) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
      <div className={`transition-all duration-500 ml-4 ${sizeClasses[level]}`}>
        <span className="text-5xl">🐷</span>
      </div>
    </div>
  );
};
