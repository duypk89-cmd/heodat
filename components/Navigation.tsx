
import React from 'react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onAddClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onAddClick }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-morphism border-t border-pink-100 px-6 py-3 flex justify-between items-center z-50">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center ${activeTab === 'home' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <i className="fa-solid fa-house text-xl"></i>
        <span className="text-xs mt-1">Trang chủ</span>
      </button>
      
      <button 
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center ${activeTab === 'history' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <i className="fa-solid fa-book text-xl"></i>
        <span className="text-xs mt-1">Sổ tay</span>
      </button>

      <div className="relative -top-8">
        <button 
          onClick={onAddClick}
          className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-2xl floating-btn transition-transform active:scale-90"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <button 
        onClick={() => onTabChange('reports')}
        className={`flex flex-col items-center ${activeTab === 'reports' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <i className="fa-solid fa-chart-pie text-xl"></i>
        <span className="text-xs mt-1">Báo cáo</span>
      </button>

      <button 
        onClick={() => onTabChange('tools')}
        className={`flex flex-col items-center ${activeTab === 'tools' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <i className="fa-solid fa-toolbox text-xl"></i>
        <span className="text-xs mt-1">Tiện ích</span>
      </button>
    </nav>
  );
};
