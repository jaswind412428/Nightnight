
import React, { useState } from 'react';
import { UserProfile, SleepLog } from '../types';
import { FileClock, ShoppingBag, BarChart2, Pencil, Trash2, Calendar, Star, Clock, Trophy, Moon, ChevronLeft, ChevronRight, Bot, AlertTriangle, Settings2 } from 'lucide-react';
import Button from './Button';

interface HistoryLogProps {
  data: UserProfile;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, start: number, end: number) => void;
}

type SubTab = 'history' | 'redeem' | 'report';

const HistoryLog: React.FC<HistoryLogProps> = ({ data, onDeleteLog, onEditLog }) => {
  const [currentTab, setCurrentTab] = useState<SubTab>('history');
  
  // Report Date Navigation State
  const [reportDate, setReportDate] = useState(new Date());
  
  // Edit/Delete State for History Tab
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  // Animation States
  const [isDeleteLogClosing, setIsDeleteLogClosing] = useState(false);
  const [isEditLogClosing, setIsEditLogClosing] = useState(false);

  const toLocalISO = (timestamp: number) => {
    const d = new Date(timestamp);
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    return (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 16);
  };

  const startEdit = (log: SleepLog) => {
    setEditingLogId(log.id);
    setEditStartTime(toLocalISO(log.startTime));
    setEditEndTime(log.endTime ? toLocalISO(log.endTime) : toLocalISO(Date.now()));
  };

  const closeEdit = () => {
    setIsEditLogClosing(true);
    setTimeout(() => {
        setEditingLogId(null);
        setIsEditLogClosing(false);
    }, 200);
  };

  const saveEdit = () => {
    if (editingLogId && editStartTime && editEndTime) {
      onEditLog(editingLogId, new Date(editStartTime).getTime(), new Date(editEndTime).getTime());
      closeEdit();
    }
  };

  const closeDeleteLog = () => {
    setIsDeleteLogClosing(true);
    setTimeout(() => {
        setDeletingLogId(null);
        setIsDeleteLogClosing(false);
    }, 200);
  };

  const confirmDelete = () => {
    if (deletingLogId) {
      onDeleteLog(deletingLogId);
      closeDeleteLog();
    }
  };

  // Report Navigation Handlers
  const prevMonth = () => {
    setReportDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() - 1);
        return d;
    });
  };

  const nextMonth = () => {
    setReportDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + 1);
        return d;
    });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
  };

  // --- Render Functions ---

  const renderHistory = () => (
    <div className="space-y-3 animate-fade-in">
        {[...data.logs].reverse().map(log => (
            <div key={log.id} className="bg-[#0d1126] border border-indigo-500/30 p-3 rounded-lg flex justify-between items-center group">
                <div className="text-xs font-mono">
                    <div className="text-indigo-400 mb-1">{new Date(log.startTime).toLocaleDateString()}</div>
                    <div className="text-slate-400">
                        {new Date(log.startTime).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit', hour12: true})} - 
                        {log.endTime ? new Date(log.endTime).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit', hour12: true}) : '...'}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                        時長: {(log.durationMinutes/60).toFixed(1)}h | 評分: {log.qualityRating || '-'}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {log.pointsEarned !== 0 ? (
                        <span className={`text-xs font-bold font-mono ${log.pointsEarned >= 0 ? 'text-fuchsia-400' : 'text-red-500'}`}>
                            {log.pointsEarned >= 0 ? '+' : ''}{log.pointsEarned}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold font-mono text-slate-600">ANOMALY</span>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => startEdit(log)} className="text-slate-600 hover:text-indigo-400"><Pencil size={14}/></button>
                        <button onClick={() => setDeletingLogId(log.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                </div>
            </div>
        ))}
        {data.logs.length === 0 && <div className="text-center text-slate-600 text-xs py-10">NO DATA</div>}
    </div>
  );

  const renderRedeems = () => (
    <div className="space-y-3 animate-fade-in">
        {data.redemptionLogs && data.redemptionLogs.length > 0 ? (
            [...data.redemptionLogs].reverse().map(log => (
                <div key={log.id} className="bg-[#0d1126] border border-indigo-500/30 p-3 rounded-lg flex justify-between items-center">
                    <div className="text-xs font-mono">
                        <div className="text-fuchsia-400 mb-1">
                            {/* Use preserved emoji, fallback to looking it up (if reward still exists), fallback to default */}
                            {log.emoji} {log.rewardName}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleString('zh-TW', { hour12: true })}
                        </div>
                    </div>
                    <div className="text-red-400 font-mono text-xs font-bold">
                        -{log.cost}
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center text-slate-600 text-xs py-10">NO REDEMPTIONS</div>
        )}
    </div>
  );

  const renderMonthlyReport = () => {
    // 1. Calculate Monthly Stats based on reportDate
    const targetMonth = reportDate.getMonth();
    const targetYear = reportDate.getFullYear();
    
    // Group logs by START TIME to ensure correct attribution
    const monthlyLogs = data.logs.filter(l => {
        const d = new Date(l.startTime);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const totalDays = new Set(monthlyLogs.map(l => new Date(l.startTime).getDate())).size;
    const totalDurationMins = monthlyLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    // Denominator is log count, not days
    const avgDurationHours = monthlyLogs.length ? (totalDurationMins / monthlyLogs.length / 60) : 0;
    
    // Avg Rating
    const ratedLogs = monthlyLogs.filter(l => l.qualityRating);
    const avgRating = ratedLogs.length 
        ? (ratedLogs.reduce((acc, l) => acc + (l.qualityRating || 0), 0) / ratedLogs.length) 
        : 0;

    // Avg Bedtime Calculation
    let avgBedtimeDisplay = "--:--";
    let avgBedtimeValue = 0; 

    if (monthlyLogs.length > 0) {
        const totalBedtimeHours = monthlyLogs.reduce((acc, l) => {
            const d = new Date(l.startTime);
            let h = d.getHours() + d.getMinutes() / 60;
            // If time is between 00:00 and 12:00, add 24 to treat it as "late night" of previous day concept
            if (h < 12) h += 24;
            return acc + h;
        }, 0);
        
        const rawAvg = totalBedtimeHours / monthlyLogs.length;
        avgBedtimeValue = rawAvg;
        
        let displayH = Math.floor(rawAvg);
        const displayM = Math.round((rawAvg - displayH) * 60);
        if (displayH >= 24) displayH -= 24;
        
        avgBedtimeDisplay = `${String(displayH).padStart(2, '0')}:${String(displayM).padStart(2, '0')}`;
    }

    // --- Scoring Logic (Weighted) ---
    const weights = data.pointRule.reportWeights || { bedtime: 30, duration: 40, rating: 30 };
    const targetDuration = data.pointRule.targetDurationHours || 7.5;
    
    let score = 0;
    let durationScore = 0;
    let ratingScore = 0;
    let bedtimeScore = 0;

    if (monthlyLogs.length > 0) {
        // Duration: 100 - distance from target * 20
        durationScore = Math.max(0, 100 - Math.abs(avgDurationHours - targetDuration) * 20);
        
        // Rating: Simple percentage
        ratingScore = (avgRating / 5) * 100;

        // Bedtime
        if (avgBedtimeValue <= 22) bedtimeScore = 100;
        else if (avgBedtimeValue <= 23) bedtimeScore = 90;
        else if (avgBedtimeValue <= 24) bedtimeScore = 70;
        else if (avgBedtimeValue <= 25) bedtimeScore = 50;
        else bedtimeScore = 20;

        score = Math.round(
            (bedtimeScore * (weights.bedtime / 100)) + 
            (durationScore * (weights.duration / 100)) + 
            (ratingScore * (weights.rating / 100))
        );
    }

    // --- AI Comment Logic ---
    let comment = "等待數據輸入...";
    let colorClass = "text-slate-500";
    
    if (monthlyLogs.length > 0) {
        if (score >= 90) {
            comment = "S級 睡眠指揮官！系統運作完美。";
            colorClass = "text-fuchsia-400";
        } else {
            const lowest = Math.min(durationScore, ratingScore, bedtimeScore);
            if (lowest === bedtimeScore) {
                comment = "警告：延遲關機模式。建議提早啟動睡眠程序。";
                colorClass = "text-red-400";
            } else if (lowest === durationScore) {
                if (avgDurationHours < targetDuration) {
                    comment = "警告：電池蓄電量不足。建議延長充電週期。";
                    colorClass = "text-yellow-400";
                } else {
                    comment = "提示：過度充電可能影響效能。請調整時長。";
                    colorClass = "text-cyan-400";
                }
            } else if (lowest === ratingScore) {
                comment = "提示：系統維護品質不穩。請檢測環境干擾。";
                colorClass = "text-indigo-400";
            } else {
                comment = "系統運作效能尚可。持續優化中。";
                colorClass = "text-slate-300";
            }
        }
    }

    // --- New Metrics Calculations ---
    
    // 1. Sleep Debt (Target vs Actual for the logged days)
    // Positive = Debt (Under slept), Negative = Surplus (Over slept)
    // Debt calculation compares total duration against expected duration for NUMBER OF LOGS
    const totalSleepHours = totalDurationMins / 60;
    const totalTargetHours = monthlyLogs.length * targetDuration;
    const sleepDebt = totalTargetHours - totalSleepHours; 

    // 2. Redemption Count
    const monthlyRedemptions = data.redemptionLogs.filter(r => {
        const d = new Date(r.timestamp);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    }).length;

    // 3. Consecutive Streak (Max consecutive days in this month)
    const daysArray = monthlyLogs.map(l => new Date(l.startTime).getDate()).sort((a, b) => a - b);
    const uniqueDays = [...new Set(daysArray)];
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDay = -1;

    uniqueDays.forEach(day => {
        if (prevDay === -1) {
            currentStreak = 1;
        } else if (day === prevDay + 1) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        prevDay = day;
    });
    if (monthlyLogs.length === 0) maxStreak = 0;


    return (
        <div className="animate-fade-in pb-10">
            {/* Header Date with Navigation */}
            <div className="mb-4 bg-[#080c1e] border border-indigo-500/50 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-white font-['Orbitron'] font-bold text-lg leading-none">
                            {targetYear} / {String(targetMonth + 1).padStart(2, '0')}
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">MONTHLY STATS</p>
                    </div>
                    <button 
                        onClick={nextMonth} 
                        disabled={isCurrentMonth()}
                        className={`p-1 rounded transition-colors ${isCurrentMonth() ? 'text-slate-700 cursor-not-allowed' : 'hover:bg-slate-800 text-indigo-400 hover:text-white'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className={`text-2xl font-bold font-mono ${colorClass} drop-shadow-[0_0_10px_currentColor]`}>
                    {monthlyLogs.length > 0 ? score : "--"}
                    <span className="text-[10px] ml-1 opacity-70">/100</span>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Bedtime */}
                <div className="col-span-2 bg-[#0d1126] p-3 border border-indigo-500/30 rounded-lg flex items-center justify-between relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 bg-indigo-500 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                     <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-slate-900 rounded-full border border-indigo-500/50">
                             <Moon size={18} className="text-fuchsia-400" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider">平均入睡時間 <span className="text-fuchsia-500/50 ml-1">[{weights.bedtime}%]</span></p>
                            <p className="text-2xl font-bold text-white font-['Orbitron'] text-glow-pink">
                                {avgBedtimeDisplay}
                            </p>
                        </div>
                     </div>
                     <div className="text-right">
                         <span className={`text-xs font-bold font-mono ${bedtimeScore >= 80 ? 'text-cyan-400' : 'text-slate-600'}`}>
                            {monthlyLogs.length > 0 ? `SCR:${bedtimeScore}` : ''}
                         </span>
                     </div>
                </div>

                <div className="bg-[#0d1126] p-3 border border-indigo-500/30 rounded-lg flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-20"><Clock size={24} className="text-cyan-500"/></div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider">平均時數 <span className="text-cyan-500/50">[{weights.duration}%]</span></p>
                    <p className="text-xl font-bold text-white font-['Orbitron']">
                        {avgDurationHours.toFixed(1)} <span className="text-[10px] text-slate-600">HRS</span>
                    </p>
                     <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (avgDurationHours/(targetDuration+2))*100)}%` }}></div>
                    </div>
                </div>

                 <div className="bg-[#0d1126] p-3 border border-indigo-500/30 rounded-lg flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-20"><Star size={24} className="text-yellow-500"/></div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider">平均品質 <span className="text-yellow-500/50">[{weights.rating}%]</span></p>
                    <p className="text-xl font-bold text-white font-['Orbitron']">
                        {avgRating.toFixed(1)} <span className="text-[10px] text-slate-600">★</span>
                    </p>
                     <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${(avgRating/5)*100}%` }}></div>
                    </div>
                </div>

                <div className="bg-[#0d1126] p-3 border border-indigo-500/30 rounded-lg flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-20"><Calendar size={24} className="text-indigo-400"/></div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider">紀錄天數</p>
                    <p className="text-xl font-bold text-white font-['Orbitron']">
                        {totalDays} <span className="text-[10px] text-slate-600">DAYS</span>
                    </p>
                    <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (totalDays/30)*100)}%` }}></div>
                    </div>
                </div>

                 <div className="bg-[#0d1126] p-3 border border-indigo-500/30 rounded-lg flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-20"><Trophy size={24} className="text-fuchsia-500"/></div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider">總獲點數</p>
                    <p className="text-xl font-bold text-white font-['Orbitron']">
                        {monthlyLogs.reduce((acc,l)=> acc + Math.max(0, l.pointsEarned), 0)}
                    </p>
                     <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                         <div className="h-full bg-fuchsia-500 w-full opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* Auto-Generated Summary */}
            <div className="bg-[#0d1126] border border-indigo-500/50 p-4 relative overflow-hidden rounded-xl shrink-0 mt-4">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Bot size={80} className="text-indigo-400 rotate-12" />
                </div>
                
                <h2 className="text-sm font-['Orbitron'] font-bold text-white mb-2 flex items-center gap-2">
                   <Bot size={16} className="text-indigo-400" />
                   DREAM-7 月度評估
                </h2>
                
                {monthlyLogs.length > 0 ? (
                    <div className="relative z-10 font-mono text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded border border-indigo-500/30">
                        {/* Comment Block */}
                        <div className="mb-3">
                            <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1 font-bold">AI 評語</p>
                            <p className={`${colorClass} font-bold border-l-2 border-current pl-2`}>{comment}</p>
                        </div>
                        
                        <div className="h-[1px] bg-slate-700/50 my-2"></div>

                        {/* 3 Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            {/* Streak */}
                            <div>
                                <p className="text-[9px] text-slate-500 mb-1">連續登記</p>
                                <p className="text-white font-bold text-lg font-['Orbitron']">{maxStreak}<span className="text-[9px] ml-1 text-slate-600">DAY</span></p>
                            </div>
                            
                            {/* Sleep Debt */}
                            <div>
                                <p className="text-[9px] text-slate-500 mb-1">睡眠債</p>
                                <p className={`font-bold text-lg font-['Orbitron'] ${sleepDebt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {Math.abs(sleepDebt).toFixed(1)}<span className="text-[9px] ml-1 text-slate-600">HR</span>
                                </p>
                            </div>

                            {/* Redemption */}
                            <div>
                                <p className="text-[9px] text-slate-500 mb-1">商店兌換</p>
                                <p className="text-fuchsia-400 font-bold text-lg font-['Orbitron']">{monthlyRedemptions}<span className="text-[9px] ml-1 text-slate-600">次</span></p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-500 text-xs text-center py-4 font-mono">
                        [ 此月份無紀錄數據 ]
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-24 max-w-md mx-auto overflow-hidden relative">
      
      {/* ----------------- RED HUD MODALS (Delete) ----------------- */}

      {/* Delete Log Modal (Red HUD) */}
      {deletingLogId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
            <div className={`w-full max-w-xs relative p-6 ${isDeleteLogClosing ? 'animate-holo-pop-out' : 'animate-holo-pop-in'}`}>
                
                {/* Red HUD Layers */}
                <div className="absolute inset-0 bg-red-950/20 backdrop-blur-md border border-red-500/10"></div>
                <div className="absolute inset-0 hologram-grid opacity-30"></div>
                {/* Red Scan Line */}
                <div className="absolute left-0 right-0 h-[2px] animate-scan-line-red z-0"></div>

                {/* Red Tactical Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 border-b border-red-500/30 pb-2">
                        <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                        <h3 className="text-red-500 font-bold font-['Orbitron'] tracking-wider">SYSTEM ALERT</h3>
                    </div>
                    
                    <p className="text-white text-sm font-bold font-mono mb-2">CONFIRM DELETE?</p>
                    <p className="text-red-300/80 text-xs mb-6 font-mono leading-relaxed">
                        警告：資料刪除後無法復原。該次睡眠紀錄獲得的點數將被全數收回。
                    </p>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={closeDeleteLog} className="flex-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-900/20">
                            CANCEL
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="flex-1 text-xs shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                            DELETE
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ----------------- PURPLE HUD MODAL (Edit) ----------------- */}

      {/* Edit Modal (Purple/Fuchsia HUD) */}
      {editingLogId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
            <div className={`w-full max-w-xs relative p-6 ${isEditLogClosing ? 'animate-holo-pop-out' : 'animate-holo-pop-in'}`}>
                
                {/* Purple HUD Layers */}
                <div className="absolute inset-0 bg-fuchsia-950/20 backdrop-blur-md border border-fuchsia-500/10"></div>
                <div className="absolute inset-0 hologram-grid opacity-30"></div>
                {/* Purple Scan Line */}
                <div className="absolute left-0 right-0 h-[2px] animate-scan-line-purple z-0"></div>

                {/* Purple Tactical Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-fuchsia-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-fuchsia-500"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6 border-b border-fuchsia-500/30 pb-2">
                        <Settings2 className="text-fuchsia-400 animate-spin-slow" size={20} />
                        <h3 className="text-fuchsia-400 font-bold font-['Orbitron'] tracking-wider">MODIFY DATA</h3>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="text-[10px] text-fuchsia-300/70 font-mono uppercase tracking-widest mb-1 block">SLEEP_START_TIME</label>
                            <input 
                                type="datetime-local" 
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                className="w-full bg-fuchsia-900/10 border border-fuchsia-500/30 text-white text-xs p-2 rounded focus:border-fuchsia-400 focus:shadow-[0_0_10px_rgba(232,121,249,0.3)] focus:outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-fuchsia-300/70 font-mono uppercase tracking-widest mb-1 block">WAKE_UP_TIME</label>
                            <input 
                                type="datetime-local" 
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="w-full bg-fuchsia-900/10 border border-fuchsia-500/30 text-white text-xs p-2 rounded focus:border-fuchsia-400 focus:shadow-[0_0_10px_rgba(232,121,249,0.3)] focus:outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={closeEdit} className="flex-1 text-xs border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-900/20">
                            DISCARD
                        </Button>
                        <Button variant="primary" onClick={saveEdit} className="flex-1 text-xs border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                            SAVE CHANGES
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Header matching Shop height */}
      <div className="flex justify-between items-end mb-6 border-b border-indigo-500/30 pb-2">
        <div>
            <h1 className="text-3xl font-['Orbitron'] font-bold text-white text-glow-indigo flex items-center gap-3">
                LOG <Bot size={28} className="text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)] -rotate-15" />
            </h1>
            <p className="text-indigo-400/70 text-xs tracking-widest mt-1">DATA ARCHIVES</p>
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
      <div className="flex gap-1 bg-[#0d1126] p-1 rounded-lg mb-4 shrink-0">
          <button 
            onClick={() => setCurrentTab('history')} 
            className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded transition-all flex items-center justify-center gap-1
            ${currentTab === 'history' ? 'bg-indigo-900/40 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FileClock size={12} /> 紀錄
          </button>
          <button 
            onClick={() => setCurrentTab('redeem')} 
            className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded transition-all flex items-center justify-center gap-1
            ${currentTab === 'redeem' ? 'bg-fuchsia-900/40 text-fuchsia-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ShoppingBag size={12} /> 兌換
          </button>
          <button 
            onClick={() => setCurrentTab('report')} 
            className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded transition-all flex items-center justify-center gap-1
            ${currentTab === 'report' ? 'bg-indigo-900/20 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BarChart2 size={12} /> 報告
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {currentTab === 'history' && renderHistory()}
          {currentTab === 'redeem' && renderRedeems()}
          {currentTab === 'report' && renderMonthlyReport()}
      </div>

    </div>
  );
};

export default HistoryLog;
