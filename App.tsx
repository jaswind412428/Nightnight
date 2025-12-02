
import React, { useState, useEffect, useRef } from 'react';
import { GlobalState, UserProfile, SleepLog, Reward, PointRule, Tab } from './types';
import Navigation from './components/Navigation';
import SleepTracker from './components/SleepTracker';
import Shop from './components/Shop';
import Analysis from './components/Analysis';
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
};

const createNewProfile = (username: string): UserProfile => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  username,
  userBalance: 0,
  logs: [],
  rewards: DEFAULT_REWARDS,
  pointRule: DEFAULT_RULE,
  isSleeping: false,
  currentSleepStart: null,
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRACKER);
  
  // Global State for Multiple Profiles
  const [globalState, setGlobalState] = useState<GlobalState>({
    activeProfileId: 'default',
    profiles: [createNewProfile("")] // Placeholder, will be overwritten or used for init
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
            } else {
                migratedProfile.pointRule = DEFAULT_RULE;
            }

            // Assign a stable ID if missing
            if (!migratedProfile.id) migratedProfile.id = 'legacy_user';

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
            setGlobalState(parsed);
            
            // Find active user name for boot
            const lastActive = parsed.profiles.find((p: UserProfile) => p.id === parsed.activeProfileId);
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

  const runBootSequence = (name: string) => {
    if (bootIntervalRef.current) clearInterval(bootIntervalRef.current);

    setBootStatus('processing');
    setTerminalLogs([]);

    const sequence = [
        `> 系統啟動中...`,
        `> 正在載入使用者設定檔...`,
        `> 偵測到使用者訊號: [ ${name} ]`,
        `> 正在解密生物識別特徵碼...`,
        `> 嘗試連線至 DREAM-7 神經網路...`,
        `> 資料庫同步率... [32%]`,
        `> 資料庫同步率... [89%]`,
        `> 資料庫同步率... [100%]`,
        `> 系統完整性檢查: 通過`,
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < sequence.length) {
            const line = sequence[i];
            if (line) setTerminalLogs(prev => [...prev, line]);
            i++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                setBootStatus('stage1_transition');
                setTimeout(() => {
                    setBootStatus('stage1_reveal');
                    setTimeout(() => {
                        setBootStatus('stage2_transition');
                        setTimeout(() => {
                            setBootStatus('complete');
                        }, 500); 
                    }, 2500); 
                }, 500); 
            }, 500); 
        }
    }, 300); 
    
    bootIntervalRef.current = interval;
  };

  const handleRegisterUser = () => {
    if (inputName.trim().length > 0) {
        const name = inputName.trim();
        
        setGlobalState(prev => {
            // Update the placeholder profile or create new
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
        if (activeIndex === -1) return prev; // Should not happen

        const newProfiles = [...prev.profiles];
        newProfiles[activeIndex] = updater(newProfiles[activeIndex]);
        return {
            ...prev,
            profiles: newProfiles
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
        logs: [...p.logs, {
            id: Date.now().toString(),
            startTime: p.currentSleepStart!,
            endTime: Date.now(),
            durationMinutes,
            pointsEarned: points,
            qualityRating: rating
        }]
    }));
  };

  const handleRedeem = (rewardId: string) => {
    updateActiveProfile(p => {
        const reward = p.rewards.find(r => r.id === rewardId);
        if (!reward || p.userBalance < reward.cost) return p;
        return {
            ...p,
            userBalance: p.userBalance - reward.cost,
            rewards: p.rewards.map(r => r.id === rewardId ? { ...r, redemptionCount: r.redemptionCount + 1 } : r)
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

  const handleSwitchProfile = (profileId: string) => {
    setGlobalState(prev => ({ ...prev, activeProfileId: profileId }));
  };

  // --- Import Logic (Merge or Create) ---
  const handleImportData = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      // Valid profile check
      if ('userBalance' in parsed && 'logs' in parsed && 'username' in parsed) {
        
        // Normalize Imported Data
        const importedProfile = { ...createNewProfile(parsed.username), ...parsed };
        
        // Backward compatibility for imported data
        if (!importedProfile.pointRule) importedProfile.pointRule = DEFAULT_RULE;
        if ('minDailyPoints' in (importedProfile.pointRule as any)) {
            importedProfile.pointRule.penaltyPoints = (importedProfile.pointRule as any).minDailyPoints;
        }

        setGlobalState(prev => {
            const existingIndex = prev.profiles.findIndex(p => p.username === importedProfile.username);
            
            let newProfiles = [...prev.profiles];
            let newActiveId = prev.activeProfileId;

            if (existingIndex > -1) {
                // MERGE/OVERWRITE: Update existing profile
                // Preserve ID to not break state, but update data
                const originalId = newProfiles[existingIndex].id;
                newProfiles[existingIndex] = { ...importedProfile, id: originalId };
                newActiveId = originalId;
            } else {
                // CREATE NEW: Add to list
                // Ensure unique ID
                importedProfile.id = Date.now().toString() + "_imported";
                newProfiles.push(importedProfile);
                newActiveId = importedProfile.id; // Switch to new user
            }

            return {
                activeProfileId: newActiveId,
                profiles: newProfiles
            };
        });

        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  if (!loaded) return null;

  // Boot Screen (Same as before, using activeProfile.username)
  if (bootStatus !== 'complete') {
    // ... (Keep existing boot UI logic but reference activeProfile.username)
    // For brevity, I'm just correcting the variable usage inside the render:
    
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

                    <p className="absolute bottom-10 text-[10px] text-cyan-900 font-mono tracking-[0.5em] animate-pulse">
                        ACCESS GRANTED
                    </p>
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
              onSleepStart={handleSleepStart} 
              onWakeUp={handleWakeUp} 
            />
          )}
          {activeTab === Tab.SHOP && (
            <Shop data={activeProfile} onRedeem={handleRedeem} />
          )}
          {activeTab === Tab.ANALYSIS && (
            <Analysis data={activeProfile} />
          )}
          {activeTab === Tab.SETTINGS && (
            <Settings 
              data={activeProfile} 
              onUpdateRule={handleUpdateRule}
              onAddReward={handleAddReward}
              onRemoveReward={handleRemoveReward}
              onImportData={handleImportData}
            />
          )}
        </main>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default App;
