
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, SleepLog } from '../types';
import { Bot, Moon, ChevronDown, Pencil, Trash2, X, Check, Award, Clock, Star, Activity, ScanLine, Terminal, AlertTriangle, Settings2 } from 'lucide-react';
import Button from './Button';

interface SleepTrackerProps {
  data: UserProfile;
  profiles: UserProfile[]; // List of all available profiles
  onSwitchProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onSleepStart: () => void;
  onWakeUp: (points: number, duration: number, rating: number) => void;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, start: number, end: number) => void;
}

interface DailyReportData {
    points: number;
    duration: number;
    rating: number;
    wakeTime: string;
    sleepDebt: number; // Added sleepDebt
}

const SleepTracker: React.FC<SleepTrackerProps> = ({ 
  data, profiles, onSwitchProfile, onDeleteProfile, onSleepStart, onWakeUp, onDeleteLog, onEditLog 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [showRating, setShowRating] = useState(false);
  const [tempDuration, setTempDuration] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Daily Report Modal State
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [isReportClosing, setIsReportClosing] = useState(false);

  // Edit/Delete State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  
  // Profile Delete State
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);

  // Modal Closing States for Animations
  const [isDeleteLogClosing, setIsDeleteLogClosing] = useState(false);
  const [isDeleteProfileClosing, setIsDeleteProfileClosing] = useState(false);
  const [isEditLogClosing, setIsEditLogClosing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (data.isSleeping && data.currentSleepStart) {
      const interval = setInterval(() => {
        const diff = Date.now() - data.currentSleepStart!;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data.isSleeping, data.currentSleepStart]);

  // Generate Weekly Data for Chart
  const weeklyData = useMemo(() => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(date => {
      const dateStr = date.toLocaleDateString();
      const dayLogs = data.logs.filter(log => {
        if (!log.endTime) return false;
        // Attribute to the day the sleep STARTED
        return new Date(log.startTime).toLocaleDateString() === dateStr;
      });
      const totalHours = dayLogs.reduce((acc, log) => acc + (log.durationMinutes / 60), 0);
      return {
        day: days[date.getDay()],
        hours: totalHours
      };
    });
  }, [data.logs]);

  // Get recent logs (last 7)
  const recentLogs = useMemo(() => {
    // Assuming logs are already sorted in App.tsx
    return [...data.logs].reverse().slice(0, 7);
  }, [data.logs]);

  // Helper for Date Input (datetime-local format: YYYY-MM-DDTHH:mm)
  const toLocalISO = (timestamp: number) => {
    const d = new Date(timestamp);
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    const localISOTime = (new Date(d.getTime() - offsetMs)).toISOString().slice(0, 16);
    return localISOTime;
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
    }, 200); // 200ms matches animate-holo-pop-out duration
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

  const closeDeleteProfile = () => {
    setIsDeleteProfileClosing(true);
    setTimeout(() => {
      setDeletingProfileId(null);
      setIsDeleteProfileClosing(false);
    }, 200);
  };

  const confirmDeleteProfile = () => {
    if (deletingProfileId) {
      onDeleteProfile(deletingProfileId);
      setShowProfileMenu(false);
      closeDeleteProfile();
    }
  };

  const handleCloseReport = () => {
    setIsReportClosing(true);
    setTimeout(() => {
        setDailyReport(null);
        setIsReportClosing(false);
    }, 200); // Wait for holographic animation
  };

  // SVG Chart Helper
  const renderChart = () => {
    const height = 60; 
    const width = 280;
    const maxHours = Math.max(...weeklyData.map(d => d.hours), 8); 
    
    const points = weeklyData.map((d, i) => {
      const x = (i / 6) * width;
      const y = height - (d.hours / maxHours) * height;
      return `${x},${y}`;
    }).join(' ');

    const areaPath = `${points} ${width},${height} 0,${height}`;

    return (
      <div className="w-full h-20 relative px-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M0,${height} ${areaPath}`} fill="url(#chartGradient)" />
          <polyline 
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="2" 
            points={points}
            className="drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]"
          />
          {weeklyData.map((d, i) => {
            const x = (i / 6) * width;
            const y = height - (d.hours / maxHours) * height;
            return (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#020617" stroke="#d946ef" strokeWidth="1.5"/>
            );
          })}
        </svg>
        <div className="flex justify-between mt-1 text-[9px] text-slate-500 font-mono">
          {weeklyData.map((d, i) => (
            <span key={i}>{d.day}</span>
          ))}
        </div>
      </div>
    );
  };

  const handleWakeUpClick = () => {
    if (!data.currentSleepStart) return;
    const now = Date.now();
    const durationMs = now - data.currentSleepStart;
    const durationMins = Math.floor(durationMs / 1000 / 60);
    setTempDuration(durationMins);
    setShowRating(true);
  };

  const submitWakeUp = (rating: number) => {
    if (!data.currentSleepStart) return;
    const sleepDate = new Date(data.currentSleepStart);
    const hour = sleepDate.getHours();
    
    const { maxDailyPoints, penaltyPoints } = data.pointRule;
    let earned = 0;
    
    // Updated Logic
    if (hour >= 19 && hour < 22) earned = maxDailyPoints;
    else if (hour >= 22 && hour < 23) earned = Math.floor(maxDailyPoints * 0.9);
    else if (hour >= 23 && hour <= 23) earned = Math.floor(maxDailyPoints * 0.5);
    else if (hour >= 0 && hour < 1) earned = -Math.floor(penaltyPoints * 0.5);
    else if (hour >= 1 && hour < 6) earned = -penaltyPoints;
    else earned = 0; // Anomaly

    onWakeUp(earned, tempDuration, rating);
    
    // Calculate daily sleep debt
    const targetDuration = data.pointRule.targetDurationHours || 7.5;
    const actualDurationHours = tempDuration / 60;
    const currentSleepDebt = targetDuration - actualDurationHours;

    // Set Daily Report Data to trigger modal
    setDailyReport({
        points: earned,
        duration: tempDuration,
        rating: rating,
        wakeTime: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true }),
        sleepDebt: currentSleepDebt
    });

    setShowRating(false);
  };

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-24 max-w-md mx-auto overflow-y-auto no-scrollbar relative">
      
      {/* ----------------- HOLOGRAPHIC HUD OVERLAYS ----------------- */}

      {/* RATING OVERLAY (HUD Style) */}
      {showRating && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] animate-holo-pop-in">
           <div className="w-[85%] max-w-sm relative p-8">
              {/* HUD Frame */}
              <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-md border border-cyan-500/10"></div>
              <div className="absolute inset-0 hologram-grid opacity-30"></div>
              
              {/* Corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

              <div className="relative z-10 text-center">
                  <div className="flex justify-center mb-6">
                     <Bot size={40} className="text-cyan-400 animate-pulse" strokeWidth={1.5} />
                  </div>
                  
                  <h2 className="text-xl font-['Orbitron'] font-bold text-white mb-2 tracking-widest text-glow-blue">SYSTEM ONLINE</h2>
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6"></div>

                  <p className="text-cyan-400 mb-8 font-mono text-xs">
                      DURATION: <span className="text-white text-lg font-bold">{(tempDuration / 60).toFixed(1)}</span> HR
                  </p>
                  
                  <p className="text-[10px] text-cyan-500/80 mb-4 tracking-[0.2em] uppercase">[ INPUT RATING ]</p>
                  <div className="grid grid-cols-5 gap-3 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => submitWakeUp(star)}
                        className="aspect-square flex items-center justify-center border border-cyan-500/30 bg-cyan-900/10 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all font-mono text-lg text-cyan-300 group"
                      >
                        <Star size={14} className={`group-hover:fill-black`} />
                      </button>
                    ))}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* DAILY REPORT OVERLAY (HUD Projection Style) */}
      {dailyReport && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
            <div className={`w-full max-w-sm relative p-6 
                ${isReportClosing ? 'animate-holo-pop-out' : 'animate-holo-pop-in'}`}>
                
                {/* HUD Background & Grid */}
                <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-md border border-cyan-500/10"></div>
                <div className="absolute inset-0 hologram-grid opacity-30"></div>
                
                {/* Scan Line Animation (Cyan) */}
                <div className="absolute left-0 right-0 h-[2px] animate-scan-line z-0"></div>

                {/* Tactical Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400"></div>
                
                {/* Side Markers */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-12 bg-cyan-500/30"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-cyan-500/30"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-4">
                        <div>
                            <h2 className="text-lg font-['Orbitron'] font-bold text-white text-glow-blue italic">MISSION REPORT</h2>
                            <p className="text-[9px] text-cyan-400 tracking-[0.3em] uppercase">SLEEP CYCLE COMPLETE</p>
                        </div>
                        <Activity size={24} className="text-cyan-500 animate-pulse"/>
                    </div>

                    {/* Data Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Duration */}
                        <div className="col-span-1 border-r border-cyan-500/20 pr-4">
                            <span className="text-[9px] text-cyan-500/70 font-mono block mb-1">DURATION</span>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-mono text-white leading-none">{(dailyReport.duration / 60).toFixed(1)}</span>
                                <span className="text-[10px] text-cyan-400 mb-1">HR</span>
                            </div>
                        </div>

                         {/* Sleep Debt */}
                         <div className="col-span-1 pl-2">
                            <span className="text-[9px] text-cyan-500/70 font-mono block mb-1">DEBT / SURPLUS</span>
                            <div className="flex items-end gap-1">
                                <span className={`text-2xl font-mono leading-none ${dailyReport.sleepDebt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {Math.abs(dailyReport.sleepDebt).toFixed(1)}
                                </span>
                                <span className="text-[10px] text-cyan-400 mb-1">HR</span>
                            </div>
                        </div>
                        
                        {/* Rating */}
                        <div className="col-span-2 pt-2 border-t border-cyan-500/20">
                            <span className="text-[9px] text-cyan-500/70 font-mono block mb-1">QUALITY</span>
                            <div className="flex gap-1">
                                {Array.from({length: dailyReport.rating}).map((_, i) => (
                                    <div key={i} className="w-1.5 h-4 bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]"></div>
                                ))}
                                {Array.from({length: 5 - dailyReport.rating}).map((_, i) => (
                                    <div key={i} className="w-1.5 h-4 bg-cyan-900/40"></div>
                                ))}
                            </div>
                        </div>

                        {/* Points (Full Width Box) */}
                        <div className="col-span-2 bg-cyan-900/10 border border-cyan-500/30 p-3 flex items-center justify-between mt-2 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400"></div>
                             <span className="text-[10px] text-cyan-300 font-mono tracking-widest uppercase flex items-center gap-2">
                                <Terminal size={12}/> CREDITS EARNED
                             </span>
                             {dailyReport.points !== 0 ? (
                                <span className={`text-3xl font-bold font-mono ${dailyReport.points >= 0 ? 'text-white text-glow-blue' : 'text-red-400'}`}>
                                    {dailyReport.points >= 0 ? '+' : ''}{dailyReport.points}
                                </span>
                             ) : (
                                <span className="text-xl font-bold font-mono text-slate-500">ANOMALY</span>
                             )}
                        </div>
                    </div>

                    <Button variant="secondary" fullWidth onClick={handleCloseReport} className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black h-10 text-xs">
                        CONFIRM DATA
                    </Button>
                </div>
            </div>
        </div>
      )}

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

      {/* Delete Profile Modal (Red HUD) */}
      {deletingProfileId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
            <div className={`w-full max-w-xs relative p-6 ${isDeleteProfileClosing ? 'animate-holo-pop-out' : 'animate-holo-pop-in'}`}>
                
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
                        <h3 className="text-red-500 font-bold font-['Orbitron'] tracking-wider">USER DELETION</h3>
                    </div>

                    <div className="bg-red-900/20 border border-red-500/30 p-3 mb-4 rounded text-center">
                        <p className="text-[10px] text-red-400 tracking-widest uppercase mb-1">TARGET USER</p>
                        <p className="text-white font-bold font-mono text-lg">{profiles.find(p => p.id === deletingProfileId)?.username}</p>
                    </div>
                    
                    <p className="text-red-300/80 text-xs mb-6 font-mono text-center">
                        此操作將永久清除該使用者所有數據且無法復原。
                    </p>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={closeDeleteProfile} className="flex-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-900/20">
                            ABORT
                        </Button>
                        <Button variant="danger" onClick={confirmDeleteProfile} className="flex-1 text-xs shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                            CONFIRM
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

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center bg-black/60 border border-slate-700 rounded-lg">
             <Bot className="text-fuchsia-400" size={20} />
          </div>
          <div>
             <h1 className="text-lg font-['Orbitron'] font-bold text-white tracking-wider">DREAM-7</h1>
             <p className="text-[9px] text-cyan-400 tracking-[0.2em] font-mono">SYSTEM READY</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 relative" ref={menuRef}>
          <button 
             onClick={() => setShowProfileMenu(!showProfileMenu)}
             className="flex items-center gap-2 group cursor-pointer hover:bg-slate-900/50 rounded px-2 py-0.5 transition-colors"
          >
              <span className="text-indigo-500 text-[10px] font-['Orbitron'] tracking-widest uppercase font-bold drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                {data.username}
              </span>
              <ChevronDown size={12} className={`text-indigo-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute top-6 right-0 w-48 bg-[#0a0a16] border border-indigo-500/50 rounded shadow-[0_0_20px_rgba(99,102,241,0.3)] z-50 overflow-hidden animate-fade-in-up">
                <div className="bg-indigo-900/20 px-3 py-2 border-b border-indigo-500/30">
                    <p className="text-[9px] text-indigo-300 tracking-widest font-bold">USER DATABASE</p>
                </div>
                <div className="max-h-40 overflow-y-auto">
                    {profiles.map(p => (
                        <div
                            key={p.id}
                            className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-indigo-900/30 transition-colors
                                ${p.id === data.id ? 'text-white bg-indigo-900/10' : 'text-slate-400'}`}
                        >
                            <button 
                                onClick={() => { onSwitchProfile(p.id); setShowProfileMenu(false); }}
                                className="flex-1 text-left truncate mr-2"
                            >
                                {p.username}
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {p.id === data.id && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_5px_#6366f1]"></div>}
                                {profiles.length > 1 && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingProfileId(p.id);
                                            setShowProfileMenu(false);
                                        }} 
                                        className="text-slate-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          <div className="bg-black/40 border border-cyan-500/30 px-3 py-1 rounded flex items-center gap-2 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse"></div>
            <span className={`font-mono text-xs font-bold ${data.userBalance < 0 ? 'text-red-500' : 'text-cyan-300'}`}>
                {data.userBalance} PT
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center">
        
        <div className="text-center mb-6">
            <h2 className="text-3xl font-['Share_Tech_Mono'] text-white tracking-wider">
                {currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </h2>
            <p className="font-mono text-cyan-600 text-[10px] tracking-[0.2em] mt-1 uppercase">
                {currentTime.toLocaleDateString('zh-TW', {month: 'long', day: 'numeric', weekday: 'long'})}
            </p>
        </div>

        <div className="relative mb-10 cursor-pointer group select-none" onClick={data.isSleeping ? handleWakeUpClick : onSleepStart}>
            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 
                ${data.isSleeping ? 'bg-fuchsia-900/30' : 'bg-cyan-900/30'}`}></div>
            <div className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center border-[4px] bg-[#050510] transition-all
                ${data.isSleeping 
                    ? 'animate-breathe-pink border-fuchsia-500 text-fuchsia-50' 
                    : 'animate-breathe-cyan border-cyan-400 text-cyan-50'
                }`}>
                
                {data.isSleeping ? (
                <>
                    <Moon size={28} className="mb-3 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(236,72,153,1)]" />
                    <span className="text-2xl font-mono font-bold tracking-widest text-white text-glow-pink">
                    {elapsedTime}
                    </span>
                    <div className="mt-3 px-2 py-0.5 bg-fuchsia-900/30 border border-fuchsia-500/30 rounded text-[9px] text-fuchsia-300 tracking-widest animate-pulse">
                    RECORDING
                    </div>
                </>
                ) : (
                <>
                    <div className="text-3xl font-['Orbitron'] font-bold mb-1 text-white text-glow-blue tracking-wider">
                        SLEEP
                    </div>
                    <span className="text-cyan-500 font-bold tracking-[0.3em] text-[10px] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                        CHECK-IN
                    </span>
                </>
                )}
            </div>
        </div>

        <div className="w-full space-y-4">
            <div className="p-4 rounded-xl border border-slate-800/60 bg-[#080c1e]/50 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 px-1">
                   <div className="w-1 h-1 bg-cyan-500"></div>
                   <span className="text-[10px] font-['Orbitron'] tracking-widest text-slate-400">WEEKLY SYNC (HOURS)</span>
                </div>
                {renderChart()}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50"></div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/60 bg-[#080c1e]/50 relative">
                <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1 h-1 bg-cyan-500"></div>
                    <span className="text-[10px] font-['Orbitron'] tracking-widest text-slate-400">RECENT logs</span>
                </div>
                
                <div className="space-y-2">
                    {recentLogs.length > 0 ? (
                        recentLogs.map((log) => (
                            <div key={log.id} className="group relative flex justify-between items-center text-xs font-mono py-2 border-b border-slate-800/50 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded transition-colors">
                                <div className="text-slate-400 flex flex-col gap-0.5">
                                    <span>{new Date(log.startTime).toLocaleDateString('zh-TW')}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span>IN: {new Date(log.startTime).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit', hour12: true})}</span>
                                        <span className="text-slate-700">|</span>
                                        <span>OUT: {log.endTime ? new Date(log.endTime).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit', hour12: true}) : '--:--'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {log.pointsEarned !== 0 ? (
                                        <div className={`font-bold ${log.pointsEarned >= 0 ? 'text-fuchsia-400' : 'text-red-500'}`}>
                                            {log.pointsEarned >= 0 ? '+' : ''}{log.pointsEarned} <span className="text-[9px] opacity-70">PT</span>
                                        </div>
                                    ) : (
                                        <div className="font-bold text-slate-600 text-[9px] tracking-wide">DATA ANOMALY</div>
                                    )}
                                    <div className="flex gap-1 opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(log)} className="p-1 hover:text-cyan-400 text-slate-600 transition-colors" title="修正">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={() => setDeletingLogId(log.id)} className="p-1 hover:text-red-500 text-slate-600 transition-colors" title="刪除">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-[10px] text-slate-600 py-2">
                            NO DATA RECORDS FOUND
                        </div>
                    )}
                </div>

                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50"></div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SleepTracker;
