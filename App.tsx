
import React, { useState, useEffect, useRef } from 'react';
import { GlobalState, UserProfile, SleepLog, Reward, PointRule, Tab, RedemptionLog } from './types';
import Navigation from './components/Navigation';
import SleepTracker from './components/SleepTracker';
import Shop from './components/Shop';
import HistoryLog from './components/HistoryLog';
import Settings from './components/Settings';
import { Terminal, Loader2, Bot } from 'lucide-react';

const DEFAULT_REWARDS: Reward[] = [
  { id: '1', name: '能量飲料', cost: 100, emoji: '⚡', redemptionCount: 0 },
  { id: '2', name: '熬夜贖罪券', cost: 500, emoji: '🎫', redemptionCount: 0 },
  { id: '3', name: '賴床 10 分鐘', cost: 50, emoji: '⏰', redemptionCount: 0 },
  { id: '4', name: '購買新皮膚', cost: 1000, emoji: '🎨', redemptionCount: 0 },
];

const DEFAULT_RULE: PointRule = {
  maxDailyPoints: 100,
  penaltyPoints: 50,
  reportWeights: { bedtime: 30, duration: 40, rating: 30 }, // Default Balanced Weights
  targetDurationHours: 7.5
};

const createNewProfile = (username: string, specificId?: string): UserProfile => ({
  id: specificId || Date.now().toString() + Math.random().toString(36).substr(2, 9),
  username,
  userBalance: 0,
  logs: [],
  rewards: DEFAULT_REWARDS,
  redemptionLogs: [],
  pointRule: DEFAULT_RULE,
  isSleeping: false,
  currentSleepStart: null,
  notificationsEnabled: false,
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRACKER);
  
  // Global State for Multiple Profiles
  // FIX: Initialize with a matching ID so the app works immediately upon boot
  const [globalState, setGlobalState] = useState<GlobalState>(() => {
    const defaultId = 'user_default_01';
    return {
        activeProfileId: defaultId,
        profiles: [createNewProfile("", defaultId)] 
    };
  });

  const [loaded, setLoaded] = useState(false);
  
  // Login/Boot Sequence State
  const [inputName, setInputName] = useState("");
  const [bootStatus, setBootStatus] = useState<'idle' | 'processing' | 'stage1_transition' | 'stage1_reveal' | 'stage2_transition' | 'complete'>('processing'); 
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const bootIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation State
  const [entryAnimationDone, setEntryAnimationDone] = useState(false);

  // Helper to get active profile
  const activeProfile = globalState.profiles.find(p => p.id === globalState.activeProfileId) || globalState.profiles[0];

  // Helper to sort logs by startTime
  const sortLogs = (logs: SleepLog[]) => {
    return [...logs].sort((a, b) => a.startTime - b.startTime);
  };

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexusSleepData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // MIGRATION LOGIC
        // Case 1: Old Single User Data (Has 'logs' at root)
        if ('logs' in parsed && !('profiles' in parsed)) {
            let migratedProfile: UserProfile = {
                ...createNewProfile(parsed.username || ""),
                ...parsed // Overwrite defaults with saved data
            };
            
            // Fix rules if needed
            if (migratedProfile.pointRule) {
                if ('minDailyPoints' in (migratedProfile.pointRule as any)) {
                    migratedProfile.pointRule.penaltyPoints = (migratedProfile.pointRule as any).minDailyPoints || 50;
                }
                // Ensure reportWeights exists
                if (!migratedProfile.pointRule.reportWeights) {
                    migratedProfile.pointRule.reportWeights = DEFAULT_RULE.reportWeights;
                }
                // Ensure targetDurationHours exists
                if (migratedProfile.pointRule.targetDurationHours === undefined) {
                    migratedProfile.pointRule.targetDurationHours = 7.5;
                }
            } else {
                migratedProfile.pointRule = DEFAULT_RULE;
            }

            // Assign a stable ID if missing
            if (!migratedProfile.id) migratedProfile.id = 'legacy_user';
            
            // Ensure redemptionLogs exists
            if (!migratedProfile.redemptionLogs) migratedProfile.redemptionLogs = [];

            // Sort logs on load
            migratedProfile.logs = sortLogs(migratedProfile.logs);

            setGlobalState({
                activeProfileId: migratedProfile.id,
                profiles: [migratedProfile]
            });

            if (migratedProfile.username) {
                runBootSequence(migratedProfile.username);
            } else {
                setBootStatus('idle');
            }
        } 
        // Case 2: New GlobalState Data
        else if ('profiles' in parsed) {
            // Ensure all profiles have new fields
            const migratedProfiles = parsed.profiles.map((p: any) => {
                const updatedP = {
                    ...p,
                    redemptionLogs: p.redemptionLogs || [],
                    notificationsEnabled: p.notificationsEnabled || false,
                    logs: sortLogs(p.logs || []) // Sort logs on load
                };
                
                // Ensure pointRule and reportWeights exist
                if (!updatedP.pointRule) {
                    updatedP.pointRule = DEFAULT_RULE;
                } else {
                    if (!updatedP.pointRule.reportWeights) {
                        updatedP.pointRule.reportWeights = DEFAULT_RULE.reportWeights;
                    }
                    if (updatedP.pointRule.targetDurationHours === undefined) {
                        updatedP.pointRule.targetDurationHours = 7.5;
                    }
                }
                
                return updatedP;
            });
            
            // Validate activeProfileId
            let validActiveId = parsed.activeProfileId;
            if (!migratedProfiles.find((p: UserProfile) => p.id === validActiveId)) {
                validActiveId = migratedProfiles[0]?.id || 'user_default_01';
            }

            setGlobalState({ ...parsed, activeProfileId: validActiveId, profiles: migratedProfiles });
            
            // Find active user name for boot
            const lastActive = migratedProfiles.find((p: UserProfile) => p.id === validActiveId);
            if (lastActive && lastActive.username) {
                runBootSequence(lastActive.username);
            } else {
                setBootStatus('idle');
            }
        }
      } catch (e) {
        console.error("Failed to load save data", e);
        setBootStatus('idle');
      }
    } else {
        // No data, new user
        setBootStatus('idle');
    }
    setLoaded(true);

    return () => {
      if (bootIntervalRef.current) clearInterval(bootIntervalRef.current);
    };
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('nexusSleepData', JSON.stringify(globalState));
    }
  }, [globalState, loaded]);

  // Auto-scroll terminal
  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Notification Permission Logic
  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      if (!("Notification" in window)) {
        alert("此瀏覽器不支援通知功能");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("DREAM-7 SYSTEM", { body: "通知系統連線成功。指揮官，請記得按時休息。" });
        updateActiveProfile(p => ({ ...p, notificationsEnabled: true }));
      } else {
        alert("無法啟用通知，請檢查瀏覽器設定");
        updateActiveProfile(p => ({ ...p, notificationsEnabled: false }));
      }
    } else {
      updateActiveProfile(p => ({ ...p, notificationsEnabled: false }));
    }
  };

  const runBootSequence = (name: string) => {
    if (bootIntervalRef.current) clearInterval(bootIntervalRef.current);

    // Skip terminal logs and go straight to transition
    setBootStatus('stage1_transition');
    
    setTimeout(() => {
        setBootStatus('stage1_reveal');
        setTimeout(() => {
            setBootStatus('stage2_transition');
            setTimeout(() => {
                setBootStatus('complete');
            }, 400); 
        }, 1200); // Give user time to see the name
    }, 400); 
  };

  const handleRegisterUser = () => {
    if (inputName.trim().length > 0) {
        const name = inputName.trim();
        setGlobalState(prev => {
            const current = prev.profiles[0];
            const updatedProfile = { ...current, username: name };
            return {
                ...prev,
                profiles: [updatedProfile]
            };
        });
        runBootSequence(name);
    }
  };

  // --- Profile Actions Wrapper ---

  const updateActiveProfile = (updater: (profile: UserProfile) => UserProfile) => {
    setGlobalState(prev => {
        const activeIndex = prev.profiles.findIndex(p => p.id === prev.activeProfileId);
        // Fallback: update first profile if ID not found (shouldn't happen with fix)
        const targetIndex = activeIndex === -1 ? 0 : activeIndex;

        const newProfiles = [...prev.profiles];
        newProfiles[targetIndex] = updater(newProfiles[targetIndex]);
        return {
            ...prev,
            profiles: newProfiles
        };
    });
  };

  const handleSwitchProfile = (profileId: string) => {
    setGlobalState(prev => ({ ...prev, activeProfileId: profileId }));
  };

  const handleDeleteProfile = (profileId: string) => {
    setGlobalState(prev => {
        // Prevent deleting the last profile
        if (prev.profiles.length <= 1) {
            alert("SYSTEM ERROR: CANNOT DELETE LAST USER. DATA INTEGRITY REQUIRED.");
            return prev;
        }

        const newProfiles = prev.profiles.filter(p => p.id !== profileId);
        
        // If we deleted the active profile, switch to the first available one
        let newActiveId = prev.activeProfileId;
        if (profileId === prev.activeProfileId) {
            newActiveId = newProfiles[0].id;
        }

        return {
            ...prev,
            profiles: newProfiles,
            activeProfileId: newActiveId
        };
    });
  };

  const handleSleepStart = () => {
    updateActiveProfile(p => ({
        ...p,
        isSleeping: true,
        currentSleepStart: Date.now()
    }));
  };

  const handleWakeUp = (points: number, durationMinutes: number, rating: number) => {
    updateActiveProfile(p => ({
        ...p,
        isSleeping: false,
        currentSleepStart: null,
        userBalance: p.userBalance + points,
        logs: sortLogs([...p.logs, {
            id: Date.now().toString(),
            startTime: p.currentSleepStart!,
            endTime: Date.now(),
            durationMinutes,
            pointsEarned: points,
            qualityRating: rating
        }])
    }));
  };

  // Calculate points helper (shared logic)
  // Updated Rules: 
  // 19:00 - 22:00 -> Max
  // 22:00 - 23:00 -> 90%
  // 23:00 - 00:00 -> 50%
  // 00:00 - 01:00 -> -50%
  // 01:00 - 06:00 -> -100%
  // 06:00 - 19:00 -> 0 (Anomaly)
  const calculatePoints = (start: number, pointRule: PointRule): number => {
    const sleepDate = new Date(start);
    const hour = sleepDate.getHours();
    const { maxDailyPoints, penaltyPoints } = pointRule;
    
    // 19:00 (7 PM) to 22:00 (10 PM) -> 100%
    if (hour >= 19 && hour < 22) return maxDailyPoints;
    
    // 22:00 (10 PM) to 23:00 (11 PM) -> 90%
    if (hour >= 22 && hour < 23) return Math.floor(maxDailyPoints * 0.9);
    
    // 23:00 (11 PM) to 00:00 (12 AM) -> 50%
    if (hour >= 23 && hour <= 23) return Math.floor(maxDailyPoints * 0.5);
    
    // 00:00 (12 AM) to 01:00 (1 AM) -> -50%
    if (hour >= 0 && hour < 1) return -Math.floor(penaltyPoints * 0.5);
    
    // 01:00 (1 AM) to 06:00 (6 AM) -> -100%
    if (hour >= 1 && hour < 6) return -penaltyPoints;

    // 06:00 to 19:00 -> 0 (Anomaly)
    return 0;
  };

  const handleDeleteLog = (logId: string) => {
    updateActiveProfile(p => {
        const log = p.logs.find(l => l.id === logId);
        if (!log) return p;
        // Deduct/Revert the points earned from this log (handle negative points correctly)
        return {
            ...p,
            userBalance: p.userBalance - log.pointsEarned,
            logs: sortLogs(p.logs.filter(l => l.id !== logId))
        };
    });
  };

  const handleEditLog = (logId: string, newStartTime: number, newEndTime: number) => {
    updateActiveProfile(p => {
        const oldLog = p.logs.find(l => l.id === logId);
        if (!oldLog) return p;

        // Recalculate duration
        const durationMs = newEndTime - newStartTime;
        const durationMinutes = Math.floor(durationMs / 1000 / 60);

        // Recalculate points based on NEW start time
        const newPoints = calculatePoints(newStartTime, p.pointRule);
        
        // Adjust balance: remove old points, add new points
        const balanceAdjustment = newPoints - oldLog.pointsEarned;

        const updatedLogs = p.logs.map(l => {
            if (l.id === logId) {
                return {
                    ...l,
                    startTime: newStartTime,
                    endTime: newEndTime,
                    durationMinutes: durationMinutes,
                    pointsEarned: newPoints
                };
            }
            return l;
        });

        return {
            ...p,
            userBalance: p.userBalance + balanceAdjustment,
            logs: sortLogs(updatedLogs)
        };
    });
  };

  const handleRedeem = (rewardId: string) => {
    updateActiveProfile(p => {
        const reward = p.rewards.find(r => r.id === rewardId);
        if (!reward || p.userBalance < reward.cost) return p;

        // REMOVED DAILY LIMIT CHECK AS PER REQUEST

        const newRedemptionLog: RedemptionLog = {
            id: Date.now().toString(),
            rewardId: reward.id,
            rewardName: reward.name,
            cost: reward.cost,
            timestamp: Date.now(),
            emoji: reward.emoji // Persist the emoji
        };

        return {
            ...p,
            userBalance: p.userBalance - reward.cost,
            rewards: p.rewards.map(r => r.id === rewardId ? { ...r, redemptionCount: r.redemptionCount + 1 } : r),
            redemptionLogs: [newRedemptionLog, ...p.redemptionLogs]
        };
    });
  };

  const handleUpdateRule = (newRule: PointRule) => {
    updateActiveProfile(p => ({ ...p, pointRule: newRule }));
  };

  const handleAddReward = (reward: Reward) => {
    updateActiveProfile(p => ({ ...p, rewards: [...p.rewards, reward] }));
  };

  const handleRemoveReward = (id: string) => {
    updateActiveProfile(p => ({ ...p, rewards: p.rewards.filter(r => r.id !== id) }));
  };

  const handleImportData = (json: string): boolean => {
    try {
      // Reverted strict string cleaning to preserve format as requested. 
      // Assuming user pastes valid JSON.
      const parsed = JSON.parse(json);
      
      if ('userBalance' in parsed && 'logs' in parsed && 'username' in parsed) {
        const importedProfile = { ...createNewProfile(parsed.username), ...parsed };
        
        // Ensure new fields
        importedProfile.redemptionLogs = importedProfile.redemptionLogs || [];
        
        // Ensure point rule weights
        if(!importedProfile.pointRule) importedProfile.pointRule = DEFAULT_RULE;
        if(!importedProfile.pointRule.reportWeights) importedProfile.pointRule.reportWeights = DEFAULT_RULE.reportWeights;
        if(importedProfile.pointRule.targetDurationHours === undefined) importedProfile.pointRule.targetDurationHours = 7.5;

        // Sort logs on import
        importedProfile.logs = sortLogs(importedProfile.logs || []);

        setGlobalState(prev => {
            const existingIndex = prev.profiles.findIndex(p => p.username === importedProfile.username);
            let newProfiles = [...prev.profiles];
            let newActiveId = prev.activeProfileId;

            if (existingIndex > -1) {
                const originalId = newProfiles[existingIndex].id;
                newProfiles[existingIndex] = { ...importedProfile, id: originalId };
                newActiveId = originalId;
            } else {
                importedProfile.id = Date.now().toString() + "_imported";
                newProfiles.push(importedProfile);
                newActiveId = importedProfile.id; 
            }
            return { activeProfileId: newActiveId, profiles: newProfiles };
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import Error:", e);
      return false;
    }
  };

  if (!loaded) return null;

  if (bootStatus !== 'complete') {
    return (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-8 text-center z-[100] overflow-hidden min-h-[100dvh]">
            {(bootStatus === 'idle' || bootStatus === 'processing' || bootStatus === 'stage1_transition') && (
                <div className={`max-w-xs w-full flex flex-col items-center transition-all ${bootStatus === 'stage1_transition' ? 'animate-glitch-shutdown' : ''}`}>
                    <div className="mb-8 flex justify-center">
                        <div className={`w-16 h-16 bg-cyan-900/10 rounded-lg flex items-center justify-center transition-all duration-500 relative`}>
                            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500"></div>
                            {bootStatus === 'processing' ? (
                                <Loader2 size={32} className="text-cyan-400 animate-spin drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            ) : (
                                <Terminal size={32} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-['Orbitron'] font-bold text-white mb-2 tracking-[0.2em] text-glow-blue">NIGHTNIGHT</h1>
                    <p className="text-cyan-700 font-mono text-[10px] tracking-widest mb-10">SYSTEM INITIALIZATION_</p>
                    
                    {bootStatus === 'idle' && (
                        <div className="w-full animate-fade-in-up">
                            <p className="text-cyan-500 font-mono text-xs mb-4">請輸入指揮官代號</p>
                            <input 
                                type="text" 
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                placeholder="CODENAME..."
                                className="w-full bg-transparent border-b border-cyan-700 text-cyan-100 p-2 text-center font-['Orbitron'] focus:border-fuchsia-500 focus:outline-none transition-colors mb-6 placeholder:text-cyan-900"
                                maxLength={10}
                            />
                            <button 
                                onClick={handleRegisterUser}
                                disabled={inputName.trim().length === 0}
                                className="group relative w-full overflow-hidden bg-cyan-900/20 text-cyan-400 py-3 font-bold hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider font-['Share_Tech_Mono']"
                            >
                                <span className="relative z-10 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">ESTABLISH LINK</span>
                                <div className="absolute inset-0 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 opacity-20"></div>
                            </button>
                        </div>
                    )}

                    {(bootStatus === 'processing' || bootStatus === 'stage1_transition') && (
                        <div className="w-full h-48 flex flex-col justify-end items-start font-mono text-xs overflow-hidden relative">
                            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#020617] to-transparent z-10"></div>
                            <div className="w-full space-y-1.5 z-0">
                                {terminalLogs.map((log, i) => {
                                    if (!log) return null;
                                    return (
                                    <div key={i} className="text-left animate-fade-in-up leading-relaxed">
                                        <span className="text-cyan-700 mr-2">{'>'}</span>
                                        <span className={
                                            log.includes('100%') ? 'text-fuchsia-400 font-bold' : 
                                            log.includes('指揮官') ? 'text-white font-bold' : 
                                            'text-cyan-500/80'
                                        }>
                                            {log.replace('>', '').trim()}
                                        </span>
                                    </div>
                                )})}
                                <div ref={logsEndRef}></div>
                                <div className="text-left text-fuchsia-500 animate-pulse pl-3">_</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(bootStatus === 'stage1_reveal' || bootStatus === 'stage2_transition') && (
                <div className={`w-full h-full flex flex-col items-center justify-center ${bootStatus === 'stage2_transition' ? 'animate-glitch-shutdown' : 'animate-boot-sequence'}`}>
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-cyan-500 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
                        <Bot size={64} className="text-cyan-400 relative z-10" strokeWidth={1} />
                    </div>
                    
                    <h1 className="text-3xl font-['Orbitron'] font-black text-white mb-4 tracking-[0.2em] text-glow-blue scale-y-110">
                        NIGHTNIGHT
                    </h1>
                    
                    <div className="flex items-center gap-3 mt-4">
                        <div className="h-[1px] w-12 bg-fuchsia-500/50"></div>
                        <p className="text-fuchsia-400 font-mono text-base tracking-widest uppercase">
                            WELCOME, <span className="font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{activeProfile.username}</span>
                        </p>
                        <div className="h-[1px] w-12 bg-fuchsia-500/50"></div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#020617] text-slate-200 selection:bg-fuchsia-500 selection:text-white overflow-hidden">
      <div 
        className={`mx-auto max-w-md bg-[#020617] h-[100dvh] shadow-2xl overflow-hidden relative border-x border-slate-900 flex flex-col ${!entryAnimationDone ? 'animate-glitch-entry' : ''}`}
        onAnimationEnd={() => setEntryAnimationDone(true)}
      >
        <main className="flex-1 overflow-hidden relative">
          {activeTab === Tab.TRACKER && (
            <SleepTracker 
              data={activeProfile} 
              profiles={globalState.profiles}
              onSwitchProfile={handleSwitchProfile}
              onDeleteProfile={handleDeleteProfile}
              onSleepStart={handleSleepStart} 
              onWakeUp={handleWakeUp}
              onDeleteLog={handleDeleteLog}
              onEditLog={handleEditLog}
            />
          )}
          {activeTab === Tab.SHOP && (
            <Shop data={activeProfile} onRedeem={handleRedeem} />
          )}
          {activeTab === Tab.LOG && (
            <HistoryLog data={activeProfile} onDeleteLog={handleDeleteLog} onEditLog={handleEditLog} />
          )}
          {activeTab === Tab.SETTINGS && (
            <Settings 
              data={activeProfile} 
              onUpdateRule={handleUpdateRule}
              onAddReward={handleAddReward}
              onRemoveReward={handleRemoveReward}
              onImportData={handleImportData}
              onToggleNotifications={handleToggleNotifications}
            />
          )}
        </main>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default App;
