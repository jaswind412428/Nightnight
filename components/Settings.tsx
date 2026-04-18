
import React, { useState } from 'react';
import { UserProfile, Reward, PointRule, ReportWeights } from '../types';
import { Share2, Download, Trash2, Plus, Database, Terminal, CheckCircle2, AlertTriangle, Bell, Info, Gift, Sliders, FileJson, Cpu, Zap, Activity, Clock, Star, Moon, Target, Wrench, Settings as SettingsIcon } from 'lucide-react';
import Button from './Button';

interface SettingsProps {
  data: UserProfile;
  onUpdateRule: (rule: PointRule) => void;
  onAddReward: (reward: Reward) => void;
  onRemoveReward: (id: string) => void;
  onImportData: (json: string) => boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

type SettingsTab = 'config' | 'rewards' | 'data' | 'info';

const Settings: React.FC<SettingsProps> = ({ 
    data, onUpdateRule, onAddReward, onRemoveReward, onImportData, onToggleNotifications 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('config');

  // Export/Import State
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  
  // New Reward State
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardCost, setNewRewardCost] = useState(100);
  const [newRewardEmoji, setNewRewardEmoji] = useState("📦");
  
  // Point Rules State
  const [maxDailyPoints, setMaxDailyPoints] = useState(data.pointRule.maxDailyPoints);
  const [penaltyPoints, setPenaltyPoints] = useState(data.pointRule.penaltyPoints);
  const [targetDuration, setTargetDuration] = useState(data.pointRule.targetDurationHours || 7.5);

  // Custom Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
        setToast(null);
    }, 2000);
  };

  const handleExport = () => {
    const json = JSON.stringify(data);
    setExportText(json);
    navigator.clipboard.writeText(json).then(() => {
        showToast(">> DATA_EXPORT: CLIPBOARD_SYNC_COMPLETE", 'success');
    });
  };

  const handleImport = () => {
    if (!importText) return;
    if (onImportData(importText)) {
      showToast(">> SYSTEM_RESTORE: DATA_SYNC_SUCCESSFUL", 'success');
      setImportText("");
    } else {
      showToast(">> ERROR: CORRUPT_DATA_DETECTED", 'error');
    }
  };

  const handleSaveRules = () => {
    onUpdateRule({
      maxDailyPoints: Number(maxDailyPoints),
      penaltyPoints: Number(penaltyPoints),
      reportWeights: data.pointRule.reportWeights || { bedtime: 30, duration: 40, rating: 30 },
      targetDurationHours: Number(targetDuration)
    });
    showToast(">> CONFIG_UPDATE: PARAMETERS_SAVED", 'success');
  };
  
  const handleUpdateWeights = (weights: ReportWeights) => {
    onUpdateRule({
        ...data.pointRule,
        reportWeights: weights
    });
    showToast(">> ALGORITHM_UPDATE: NEW_PROTOCOL_LOADED", 'success');
  };

  const handleCreateReward = () => {
    if (!newRewardName) return;
    const newReward: Reward = {
      id: Date.now().toString(),
      name: newRewardName,
      cost: Number(newRewardCost),
      emoji: newRewardEmoji,
      redemptionCount: 0,
    };
    onAddReward(newReward);
    setNewRewardName("");
    setNewRewardEmoji("📦");
    showToast(">> DATABASE: NEW_REWARD_ENTRY_ADDED", 'success');
  };

  // --- Render Sections ---

  const renderConfigTab = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Compact Notification Toggle - Cyan Theme */}
        <div className="bg-[#0d1126] border border-cyan-500/30 p-3 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${data.notificationsEnabled ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                    <Bell size={16} />
                </div>
                <div>
                    <span className="block text-xs font-bold text-cyan-100">睡眠提醒通知</span>
                    <span className="text-[10px] text-cyan-500/60 block">允許網頁發送背景通知</span>
                </div>
            </div>
            <div 
                onClick={() => onToggleNotifications(!data.notificationsEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-300 relative ${data.notificationsEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
                <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${data.notificationsEnabled ? 'translate-x-5 bg-black' : 'bg-slate-400'}`}></div>
            </div>
        </div>

        {/* Point Rules - Cyan Theme */}
        <div>
            <h2 className="font-['Orbitron'] text-cyan-400 mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Database size={12} /> 點數規則參數
            </h2>
            <div className="space-y-3 border border-cyan-500/30 p-4 bg-[#0d1126] rounded-lg">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] text-cyan-200 block mb-1 uppercase tracking-wider">完美獎勵 (PTS)</label>
                        <input 
                            type="number" 
                            value={maxDailyPoints} 
                            onChange={(e) => setMaxDailyPoints(Number(e.target.value))}
                            className="w-full p-2 bg-black/50 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors rounded"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-red-300 block mb-1 uppercase tracking-wider">熬夜懲罰 (PTS)</label>
                        <input 
                            type="number" 
                            value={penaltyPoints} 
                            onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                            className="w-full p-2 bg-black/50 border border-slate-700 text-white text-xs font-mono focus:border-red-500 focus:outline-none transition-colors rounded"
                        />
                    </div>
                </div>

                <div>
                     <label className="text-[10px] text-cyan-200 block mb-1 uppercase tracking-wider flex items-center gap-1">
                        <Target size={10} /> 目標睡眠時數 (HRS)
                     </label>
                     <input 
                        type="number" 
                        step="0.1"
                        value={targetDuration} 
                        onChange={(e) => setTargetDuration(Number(e.target.value))}
                        className="w-full p-2 bg-black/50 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors rounded"
                        placeholder="7.5"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">此數值將作為月度評分的滿分基準。</p>
                </div>

                <Button variant="ghost" onClick={handleSaveRules} className="w-full text-xs rounded py-2 mt-2 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black text-cyan-400">更新核心規則</Button>
            </div>
        </div>
    </div>
  );

  const renderRewardsTab = () => (
    <div className="space-y-4 animate-fade-in">
        <h2 className="font-['Orbitron'] text-fuchsia-400 mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Plus size={12} /> 新增獎勵項目
        </h2>
        <div className="border border-fuchsia-900/50 p-4 bg-[#0d1126] rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.1)]">
          <div className="flex gap-2 mb-2">
            <input 
              type="text" 
              placeholder="名稱" 
              value={newRewardName}
              onChange={(e) => setNewRewardName(e.target.value)}
              className="flex-1 p-2 bg-black/50 border border-slate-700 text-white text-xs font-mono focus:border-fuchsia-500 focus:outline-none rounded"
            />
            <input 
              type="text" 
              placeholder="圖示" 
              value={newRewardEmoji}
              onChange={(e) => setNewRewardEmoji(e.target.value)}
              className="w-12 text-center p-2 bg-black/50 border border-slate-700 text-white text-xs focus:border-fuchsia-500 focus:outline-none rounded"
            />
          </div>
          <div className="flex gap-2 mb-2">
            <input 
              type="number" 
              placeholder="花費" 
              value={newRewardCost}
              onChange={(e) => setNewRewardCost(Number(e.target.value))}
              className="w-full p-2 bg-black/50 border border-slate-700 text-white text-xs font-mono focus:border-fuchsia-500 focus:outline-none rounded"
            />
          </div>
          <Button variant="primary" onClick={handleCreateReward} className="w-full whitespace-nowrap px-4 py-2 border-fuchsia-500 text-fuchsia-400 rounded text-xs">新增至商店</Button>
        </div>

        <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto pr-1">
            {data.rewards.map(r => (
              <div key={r.id} className="flex justify-between items-center bg-black/30 border border-slate-800 p-2 px-3 text-xs text-slate-300 font-mono rounded group hover:border-fuchsia-500/50 transition-colors">
                <span>
                    {r.emoji} {r.name} <span className="text-fuchsia-400 ml-2">[{r.cost}]</span>
                </span>
                <button onClick={() => onRemoveReward(r.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {data.rewards.length === 0 && <p className="text-center text-[10px] text-slate-600 py-4">NO REWARDS CONFIGURED</p>}
        </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-indigo-900/10 border border-indigo-500/30 p-4 rounded-lg">
            <h2 className="font-['Orbitron'] text-indigo-400 mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Share2 size={12} /> 資料同步
            </h2>
            
            <div className="mb-4">
                <label className="text-[10px] text-indigo-300 block mb-1 uppercase tracking-wider">匯出個人資料 (JSON)</label>
                <Button variant="ghost" onClick={handleExport} fullWidth className="text-xs py-2 border border-indigo-500/50 text-indigo-400 bg-indigo-900/20 rounded hover:bg-indigo-900/40">
                    複製完整代碼
                </Button>
            </div>

            <div>
                <label className="text-[10px] text-indigo-300 block mb-1 uppercase tracking-wider">匯入資料</label>
                <textarea 
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full h-24 p-2 bg-black/50 border border-indigo-800 text-xs text-indigo-400 mb-2 focus:outline-none font-mono rounded placeholder:text-indigo-900"
                    placeholder="貼上代碼 (相同ID將覆蓋，不同ID將新增)..."
                />
                <Button variant="ghost" onClick={handleImport} fullWidth className="text-xs py-2 border border-indigo-500/50 text-indigo-400 bg-indigo-900/20 rounded hover:bg-indigo-900/40">
                    <Download size={14} className="mr-2" /> 執行匯入
                </Button>
            </div>
        </div>
    </div>
  );

  const renderInfoTab = () => {
    const currentWeights = data.pointRule.reportWeights || { bedtime: 30, duration: 40, rating: 30 };
    const currentTarget = data.pointRule.targetDurationHours || 7.5;

    // Check preset type
    let protocolName = "CUSTOM";
    if (currentWeights.bedtime === 30 && currentWeights.duration === 40 && currentWeights.rating === 30) protocolName = "BALANCED";
    if (currentWeights.bedtime === 60 && currentWeights.duration === 20 && currentWeights.rating === 20) protocolName = "DISCIPLINE";
    if (currentWeights.bedtime === 20 && currentWeights.duration === 60 && currentWeights.rating === 20) protocolName = "RECOVERY";

    return (
    <div className="space-y-4 animate-fade-in">
         <h2 className="font-['Orbitron'] text-slate-400 mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Info size={12} /> 系統評分標準
        </h2>
        <div className="bg-[#0a0a16] border border-slate-700 p-4 rounded-lg text-xs font-mono space-y-5 shadow-inner leading-relaxed">
           
           <div>
              <p className="text-white font-bold mb-2 border-b border-white/20 pb-1 tracking-wider">[ 時間區段判定協議 ]</p>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex justify-between">
                    <span>19:00 - 21:59</span>
                    <span className="text-fuchsia-400 font-bold">100% (+{data.pointRule.maxDailyPoints})</span>
                </li>
                <li className="flex justify-between">
                    <span>22:00 - 22:59</span>
                    <span className="text-fuchsia-300">90% (+{Math.floor(data.pointRule.maxDailyPoints * 0.9)})</span>
                </li>
                <li className="flex justify-between">
                    <span>23:00 - 23:59</span>
                    <span className="text-fuchsia-200">50% (+{Math.floor(data.pointRule.maxDailyPoints * 0.5)})</span>
                </li>
                <li className="flex justify-between">
                    <span>00:00 - 00:59</span>
                    <span className="text-red-300">50% 懲罰 (-{Math.floor(data.pointRule.penaltyPoints * 0.5)})</span>
                </li>
                <li className="flex justify-between">
                    <span>01:00 - 05:59</span>
                    <span className="text-red-500 font-bold">100% 懲罰 (-{data.pointRule.penaltyPoints})</span>
                </li>
                <li className="flex justify-between">
                    <span>06:00 - 18:59</span>
                    <span className="text-slate-600">數據異常 (0 分)</span>
                </li>
              </ul>
              <p className="text-[10px] text-slate-600 mt-2">* 系統以按下「SLEEP」按鈕的時間為準。</p>
           </div>

           <div>
              <p className="text-white font-bold mb-2 border-b border-white/20 pb-1 tracking-wider">[ 睡眠時數判定 ]</p>
              <p className="text-slate-400 mb-2">
                  滿分基準：<span className="text-white font-bold">{currentTarget} 小時</span>
              </p>
              <p className="text-slate-500 text-[10px]">
                  計算方式：以目標時數為中心，每相差 1 小時扣除 20 分。若睡眠時數少於目標值過多，系統將發出蓄電量不足警告。
              </p>
           </div>

           <div>
              <p className="text-white font-bold mb-2 border-b border-white/20 pb-1 tracking-wider">[ 睡眠品質判定 ]</p>
              <ul className="space-y-1 text-slate-400">
                  <li className="flex justify-between"><span>⭐⭐⭐⭐⭐</span> <span className="text-fuchsia-400">100 分</span></li>
                  <li className="flex justify-between"><span>⭐⭐⭐⭐</span> <span className="text-fuchsia-300">80 分</span></li>
                  <li className="flex justify-between"><span>⭐⭐⭐</span> <span className="text-fuchsia-200">60 分</span></li>
                  <li className="flex justify-between"><span>⭐⭐</span> <span className="text-slate-500">40 分</span></li>
                  <li className="flex justify-between"><span>⭐</span> <span className="text-red-500">20 分</span></li>
              </ul>
              <p className="text-[10px] text-slate-600 mt-2">* 此為使用者的主觀感受輸入。</p>
           </div>

           <div>
              <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-3">
                  <p className="text-white font-bold tracking-wider">[ 演算法配置核心 ]</p>
                  <p className="text-[10px] text-fuchsia-400 font-bold border border-fuchsia-500/50 px-2 py-0.5 rounded bg-fuchsia-900/20 animate-pulse">
                      {protocolName}_MODE
                  </p>
              </div>

              {/* Visualization Bars */}
              <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-slate-800 mb-3">
                   <div className="bg-fuchsia-500 transition-all duration-500" style={{width: `${currentWeights.bedtime}%`}}></div>
                   <div className="bg-cyan-500 transition-all duration-500" style={{width: `${currentWeights.duration}%`}}></div>
                   <div className="bg-yellow-500 transition-all duration-500" style={{width: `${currentWeights.rating}%`}}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-4 font-mono">
                  <span className="text-fuchsia-400">BEDTIME {currentWeights.bedtime}%</span>
                  <span className="text-cyan-400">DURATION {currentWeights.duration}%</span>
                  <span className="text-yellow-400">RATING {currentWeights.rating}%</span>
              </div>

              {/* Protocol Switcher */}
              <div className="grid grid-cols-3 gap-2">
                 <button 
                    onClick={() => handleUpdateWeights({ bedtime: 30, duration: 40, rating: 30 })}
                    className={`p-2 border rounded flex flex-col items-center gap-1 transition-all
                        ${protocolName === 'BALANCED' 
                            ? 'bg-indigo-900/30 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                            : 'bg-black/40 border-slate-800 text-slate-500 hover:border-indigo-800'}`}
                 >
                    <Activity size={16} />
                    <span className="text-[9px] font-bold">均衡協定</span>
                 </button>
                 <button 
                    onClick={() => handleUpdateWeights({ bedtime: 60, duration: 20, rating: 20 })}
                    className={`p-2 border rounded flex flex-col items-center gap-1 transition-all
                        ${protocolName === 'DISCIPLINE' 
                            ? 'bg-fuchsia-900/30 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_10px_rgba(236,72,153,0.3)]' 
                            : 'bg-black/40 border-slate-800 text-slate-500 hover:border-fuchsia-800'}`}
                 >
                    <Moon size={16} />
                    <span className="text-[9px] font-bold">嚴格作息</span>
                 </button>
                  <button 
                    onClick={() => handleUpdateWeights({ bedtime: 20, duration: 60, rating: 20 })}
                    className={`p-2 border rounded flex flex-col items-center gap-1 transition-all
                        ${protocolName === 'RECOVERY' 
                            ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                            : 'bg-black/40 border-slate-800 text-slate-500 hover:border-cyan-800'}`}
                 >
                    <Clock size={16} />
                    <span className="text-[9px] font-bold">深度休眠</span>
                 </button>
              </div>
              
              <p className="text-[10px] text-slate-600 mt-2 italic">
                  點擊上方按鈕可即時切換月度報告的評分權重，以符合您目前的訓練目標。
              </p>
           </div>

        </div>
    </div>
  )};

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-24 max-w-md mx-auto overflow-hidden relative">
      
      {/* Toast Overlay */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-3/4 z-[60] animate-fade-in-up">
            <div className={`bg-[#020617]/95 border-l-4 p-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-sm rounded-r-md flex items-center gap-3 border-y border-r border-slate-800 ${
                toast.type === 'success' ? 'border-l-cyan-500' : 'border-l-red-500'
            }`}>
                <div className={`${toast.type === 'success' ? 'text-cyan-400' : 'text-red-500'} animate-pulse`}>
                    {toast.type === 'success' ? <Terminal size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div>
                    <p className={`text-[10px] font-bold tracking-widest uppercase mb-0.5 ${toast.type === 'success' ? 'text-cyan-600' : 'text-red-600'}`}>
                        SYSTEM_LOG
                    </p>
                    <p className="text-xs font-mono text-white text-shadow-sm">
                        {toast.message}
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Header matching Shop height */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
         <div>
             <h1 className="text-3xl font-['Orbitron'] font-bold text-white text-glow-white flex items-center gap-3">
                 SET <Wrench size={28} className="text-white opacity-80" />
             </h1>
             <p className="text-slate-400 text-xs tracking-widest mt-1">SYSTEM CONFIGURATION</p>
         </div>
         
         {/* Invisible Spacer to match Shop's Balance Box height */}
         <div className="text-right px-4 py-2 opacity-0 select-none pointer-events-none">
            <p className="text-[10px] uppercase tracking-wider mb-1">BALANCE</p>
            <div className="flex items-center gap-2 justify-end">
                <span className="text-xl font-bold font-mono">0</span>
                <span className="text-sm font-mono">PT</span>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d1126] p-1 rounded-lg mb-4 shrink-0 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('config')} 
            className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold tracking-widest rounded transition-all flex flex-col items-center justify-center gap-1
            ${activeTab === 'config' ? 'bg-cyan-900/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Sliders size={14} /> 配置
          </button>
          <button 
            onClick={() => setActiveTab('rewards')} 
            className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold tracking-widest rounded transition-all flex flex-col items-center justify-center gap-1
            ${activeTab === 'rewards' ? 'bg-fuchsia-900/30 text-fuchsia-400 shadow-[0_0_8px_rgba(236,72,153,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Gift size={14} /> 獎勵
          </button>
          <button 
            onClick={() => setActiveTab('data')} 
            className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold tracking-widest rounded transition-all flex flex-col items-center justify-center gap-1
            ${activeTab === 'data' ? 'bg-indigo-900/30 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <FileJson size={14} /> 數據
          </button>
           <button 
            onClick={() => setActiveTab('info')} 
            className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold tracking-widest rounded transition-all flex flex-col items-center justify-center gap-1
            ${activeTab === 'info' ? 'bg-slate-700/30 text-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Info size={14} /> 說明
          </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {activeTab === 'config' && renderConfigTab()}
          {activeTab === 'rewards' && renderRewardsTab()}
          {activeTab === 'data' && renderDataTab()}
          {activeTab === 'info' && renderInfoTab()}
      </div>
      
      <p className="text-center text-[9px] text-slate-800 pt-6 pb-2 font-mono">Nightnight v2.2 | DREAM-7 SYSTEM</p>
    </div>
  );
};

export default Settings;
