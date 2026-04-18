
import React from 'react';
import { Tab } from '../types';
import { Home, Gift, FileText, Settings as SettingsIcon } from 'lucide-react';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: Tab.TRACKER, label: 'HOME', icon: Home },
    { id: Tab.SHOP, label: 'SHOP', icon: Gift },
    { id: Tab.LOG, label: 'LOG', icon: FileText },
    { id: Tab.SETTINGS, label: 'SET', icon: SettingsIcon },
  ];

  const getColorClass = (id: Tab, isActive: boolean) => {
    if (!isActive) return 'text-slate-600 hover:text-slate-400';
    switch (id) {
        case Tab.SHOP: return 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]';
        case Tab.LOG: return 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]';
        case Tab.SETTINGS: return 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]';
        default: return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]';
    }
  };

  const getIconColorClass = (id: Tab, isActive: boolean) => {
    if (!isActive) return '';
    if (id === Tab.SHOP) return 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]';
    // The icon itself inherits color usually, but we can enforce if needed
    return '';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a16]/90 backdrop-blur-md border-t border-slate-800 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-16 transition-all duration-300 font-['Orbitron'] ${getColorClass(item.id, isActive)} ${isActive ? 'scale-110' : ''}`}
            >
              <div className={`p-1.5 rounded-none transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                 <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 1.5} 
                    className={getIconColorClass(item.id, isActive)}
                 />
              </div>
              <span className={`text-[10px] font-bold tracking-widest mt-1 ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;