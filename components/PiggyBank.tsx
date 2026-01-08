
import React from 'react';

interface PiggyBankProps {
  savings: number;
}

export const PiggyBank: React.FC<PiggyBankProps> = ({ savings }) => {
  // Định nghĩa hệ thống cấp độ chuyên sâu
  const levels = [
    { 
      threshold: 0, 
      name: "Mầm Non Tiết Kiệm", 
      icon: "🌱", 
      piggy: "🐷",
      skill: "Thói quen khởi đầu",
      desc: "Mây đang làm rất tốt việc gieo mầm những đồng tiền đầu tiên!",
      theme: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-200",
      badge: "bg-emerald-100 text-emerald-600"
    },
    { 
      threshold: 500000, 
      name: "Thợ Săn Ước Mơ", 
      icon: "🏹", 
      piggy: "🐷🎀",
      skill: "Kiểm soát ham muốn",
      desc: "Mây đã biết nói 'không' với những chi tiêu thừa thãi rồi nè.",
      theme: "from-blue-400 to-indigo-500",
      glow: "shadow-blue-200",
      badge: "bg-blue-100 text-blue-600"
    },
    { 
      threshold: 2000000, 
      name: "Chiến Binh Kỷ Luật", 
      icon: "🛡️", 
      piggy: "🛡️🐷",
      skill: "Kế hoạch vững chãi",
      desc: "Không gì có thể làm lung lay ý chí tiết kiệm của Mây!",
      theme: "from-purple-400 to-fuchsia-600",
      glow: "shadow-purple-200",
      badge: "bg-purple-100 text-purple-600"
    },
    { 
      threshold: 10000000, 
      name: "Bậc Thầy Dự Phòng", 
      icon: "🏰", 
      piggy: "🏰🐷",
      skill: "An tâm tài chính",
      desc: "Mây đã xây dựng được một pháo đài tài chính cực kỳ kiên cố.",
      theme: "from-amber-400 to-orange-600",
      glow: "shadow-amber-200",
      badge: "bg-amber-100 text-amber-600"
    },
    { 
      threshold: 50000000, 
      name: "Huyền Thoại Đầu Tư", 
      icon: "👑", 
      piggy: "👑🐷✨",
      skill: "Tiền tự sinh sôi",
      desc: "Chúc mừng Huyền Thoại! Mây đã làm chủ hoàn toàn dòng tiền.",
      theme: "from-rose-500 to-red-600",
      glow: "shadow-rose-300",
      badge: "bg-rose-100 text-rose-600"
    },
  ];

  const currentLevelIndex = levels.slice().reverse().findIndex(l => savings >= l.threshold);
  const currentLevel = levels[levels.length - 1 - (currentLevelIndex === -1 ? 0 : currentLevelIndex)];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1] || null;
  
  const progress = nextLevel 
    ? ((savings - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100 
    : 100;

  return (
    <div className={`bg-white rounded-[56px] p-10 shadow-2xl border border-gray-50 mb-10 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]`}>
      {/* Background Decor */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${currentLevel.theme} opacity-5 blur-3xl rounded-full`}></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Piggy Display */}
        <div className={`relative mb-6 transform transition-transform duration-700 group-hover:rotate-6`}>
           <div className={`absolute inset-0 bg-gradient-to-br ${currentLevel.theme} rounded-full blur-2xl opacity-20 scale-150`}></div>
           <span className="text-8xl select-none block drop-shadow-xl animate-soft-bounce">
             {currentLevel.piggy}
           </span>
           <div className="absolute -bottom-2 -right-2 bg-white shadow-lg w-10 h-10 rounded-2xl flex items-center justify-center text-xl">
             {currentLevel.icon}
           </div>
        </div>

        {/* Level Badge */}
        <div className={`mb-4 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-sm ${currentLevel.badge} border border-white`}>
          Cấp {levels.indexOf(currentLevel) + 1}: {currentLevel.name}
        </div>

        <h3 className="text-2xl font-black text-gray-800 tracking-tight mb-2">Hũ Heo Mây 🌸</h3>
        <p className="text-xs font-bold text-gray-400 text-center px-4 mb-8 leading-relaxed italic">
          "{currentLevel.desc}"
        </p>

        {/* Progress System */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-end px-2">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Đã tích lũy</span>
                <span className="text-xl font-black text-gray-800">{savings.toLocaleString()}đ</span>
             </div>
             <div className="text-right">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Kỹ năng: {currentLevel.skill}</span>
                <span className="text-[10px] font-bold text-gray-400">
                  {nextLevel ? `+${(nextLevel.threshold - savings).toLocaleString()}đ thăng cấp` : 'Đã đạt đỉnh cao! 🏆'}
                </span>
             </div>
          </div>

          <div className="h-5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1 shadow-inner relative">
            <div 
              className={`h-full bg-gradient-to-r ${currentLevel.theme} rounded-full transition-all duration-1000 shadow-lg relative`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {/* Energy Glow Effect */}
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-sm animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-tighter pt-1">
             <span>{currentLevel.threshold.toLocaleString()}đ</span>
             {nextLevel && <span>{nextLevel.threshold.toLocaleString()}đ</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
