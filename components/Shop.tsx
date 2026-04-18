
import React, { useState } from 'react';
import { UserProfile, Reward } from '../types';
import { Lock, Zap, Gift, Moon, CheckCircle2, Crosshair } from 'lucide-react';
import Button from './Button';

interface ShopProps {
  data: UserProfile;
  onRedeem: (rewardId: string) => void;
}

const Shop: React.FC<ShopProps> = ({ data, onRedeem }) => {
  const [redeemedItem, setRedeemedItem] = useState<Reward | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleRedeemClick = (reward: Reward) => {
    onRedeem(reward.id);
    setRedeemedItem(reward);
    // Removed auto close sequence
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
        setRedeemedItem(null);
        setIsClosing(false);
    }, 200); // Wait for holographic animation
  };

  const today = new Date().toLocaleDateString();

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-24 max-w-md mx-auto overflow-y-auto no-scrollbar relative">
      
      {/* Redemption Success Modal (HUD Projection Style - Neon Purple) */}
      {redeemedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
             <div className={`w-full max-w-xs relative p-6 ${isClosing ? 'animate-holo-pop-out' : 'animate-holo-pop-in'}`}>
                
                {/* Purple HUD Frame */}
                <div className="absolute inset-0 bg-fuchsia-950/20 backdrop-blur-md border border-fuchsia-500/10"></div>
                <div className="absolute inset-0 hologram-grid opacity-30"></div>
                
                {/* Purple Scan Line */}
                <div className="absolute left-0 right-0 h-[2px] animate-scan-line-purple z-0"></div>

                {/* Purple Tactical Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-fuchsia-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-fuchsia-500"></div>
                
                {/* Decorative Indicators */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-fuchsia-500/50"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-fuchsia-500/50"></div>

                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 text-fuchsia-400 mb-4 animate-pulse">
                        <Crosshair size={16} />
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">ITEM ACQUIRED</span>
                    </div>

                    <div className="relative mb-4">
                        <div className="text-7xl drop-shadow-[0_0_20px_rgba(236,72,153,0.4)] animate-bounce">
                            {redeemedItem.emoji}
                        </div>
                        {/* Fake floor shadow */}
                        <div className="w-16 h-2 bg-fuchsia-500/30 blur-md rounded-full mx-auto mt-2"></div>
                    </div>

                    <h2 className="text-xl font-bold font-['Orbitron'] text-white text-glow-pink uppercase mb-1 tracking-wider">
                        {redeemedItem.name}
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-2 bg-fuchsia-900/30 px-3 py-1 rounded border border-fuchsia-500/30 mb-6">
                        <span className="text-[10px] text-fuchsia-300 font-mono tracking-widest">COST</span>
                        <div className="h-3 w-[1px] bg-fuchsia-500/50"></div>
                        <span className="text-sm font-bold font-mono text-white">{redeemedItem.cost} PT</span>
                    </div>

                    <Button variant="primary" fullWidth onClick={handleCloseModal} className="border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white h-10 text-xs shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                        CONFIRM
                    </Button>
                </div>
             </div>
        </div>
      )}

      {/* Header with Balance Box */}
      <div className="flex justify-between items-end mb-6 border-b border-fuchsia-500/30 pb-2 relative z-10">
        <div>
          <h1 className="text-3xl font-['Orbitron'] font-bold text-fuchsia-500 text-glow-pink flex items-center gap-3">
             SHOP <Moon size={28} strokeWidth={2.5} className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] -rotate-15" />
          </h1>
          <p className="text-fuchsia-800 text-xs tracking-widest font-mono mt-1">REDEEM YOUR POINTS</p>
        </div>
        <div className="text-right bg-slate-900/80 px-4 py-2 border-r-2 border-fuchsia-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">BALANCE</p>
          <div className="flex items-center gap-2 justify-end">
              <span className={`text-xl font-bold font-mono ${data.userBalance < 0 ? 'text-red-500' : 'text-white'}`}>
                {data.userBalance}
              </span>
              <span className="text-sm text-fuchsia-500 font-mono">PT</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        {data.rewards.map((reward) => {
          const canAfford = data.userBalance >= reward.cost;
          const isDisabled = !canAfford;

          return (
            <div key={reward.id} className="relative bg-[#0d1126] border border-slate-800 p-4 flex items-center justify-between group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/0 to-fuchsia-900/0 group-hover:from-fuchsia-900/10 group-hover:to-cyan-900/10 transition-all duration-500"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                 <div className="w-12 h-12 bg-black border border-slate-700 rounded-lg flex items-center justify-center text-2xl group-hover:border-fuchsia-500 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all">
                    {reward.emoji}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-200 font-['Orbitron'] text-sm mb-1 group-hover:text-fuchsia-300 transition-colors flex items-center gap-2">
                        {reward.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Gift size={10} /> 累計兌換: {reward.redemptionCount}
                    </p>
                 </div>
              </div>
              
              <Button
                variant={isDisabled ? 'ghost' : 'primary'}
                disabled={isDisabled}
                onClick={() => handleRedeemClick(reward)}
                className={`relative z-10 text-xs px-4 py-2 ${isDisabled ? 'opacity-50 text-slate-600 border-slate-800 cursor-not-allowed' : ''}`}
              >
                {isDisabled ? (
                    <><Lock size={12} className="mr-1" /> {reward.cost}</>
                ) : (
                  <>
                    {reward.cost} PT
                  </>
                )}
              </Button>
            </div>
          );
        })}
        
        {data.rewards.length === 0 && (
            <div className="py-12 text-center text-slate-600 border border-dashed border-slate-800 font-mono text-xs rounded-lg bg-slate-900/30">
                [ 商店目前空空如也 ]
            </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
