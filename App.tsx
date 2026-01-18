
import React, { useState, useEffect, useRef } from 'react';
import PlinkoEngine from './PlinkoEngine';

declare var firebase: any;

const App: React.FC = () => {
    const [balance, setBalance] = useState<number>(0); 
    const [user, setUser] = useState<{uid: string, fullName: string} | null>(null);
    const [bet, setBet] = useState<number>(5.00);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showJackpot, setShowJackpot] = useState(false);
    const [isBallActive, setIsBallActive] = useState(false);
    const [withdrawMethod, setWithdrawMethod] = useState<'Bank' | 'BTC' | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<PlinkoEngine | null>(null);

    // Audio helper
    const playSound = (name: string) => {
        try {
            const audio = new Audio(`sounds/${name}.mp3`);
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    };

    useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged((authUser: any) => {
            if (authUser) {
                const db = firebase.firestore();
                db.collection("users").doc(authUser.uid).onSnapshot((doc: any) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        setBalance(data.balance || 0);
                        setUser({ uid: authUser.uid, fullName: data.fullName || "User" });
                    }
                });
            } else {
                window.location.href = 'index.html'; // Fallback to your login
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            canvasRef.current.width = 600;
            canvasRef.current.height = 650;
            engineRef.current = new PlinkoEngine(canvasRef.current, {
                onWin: (betAmount, multiplier) => {
                    const winAmount = betAmount * multiplier;
                    const db = firebase.firestore();
                    const userRef = db.collection("users").doc(firebase.auth().currentUser.uid);
                    
                    userRef.update({
                        balance: firebase.firestore.FieldValue.increment(winAmount)
                    });

                    setIsBallActive(false);
                    if (multiplier === 125) {
                        playSound('jackpot');
                        setShowJackpot(true);
                    }
                },
                onCollision: () => playSound('poin')
            });
            engineRef.current.start();
        }
    }, []);

    const handleDrop = () => {
        if (isBallActive) return;
        if (balance < bet) return alert("Insufficient Balance!");
        
        playSound('count_down');
        const db = firebase.firestore();
        db.collection("users").doc(user?.uid).update({
            balance: firebase.firestore.FieldValue.increment(-bet)
        });

        setIsBallActive(true);
        engineRef.current?.dropBall(bet);
    };

    return (
        <div className="min-h-screen bg-[#050a0f] text-white font-sans flex flex-col">
            <header className="flex justify-between items-center p-4 bg-black/40 border-b border-cyan-500/30">
                <div className="flex items-center gap-3">
                    <img src="img/robo-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <button onClick={() => setShowWithdraw(true)} className="px-4 py-1 border border-cyan-500 text-cyan-400 rounded-full text-xs font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all">
                        Withdraw
                    </button>
                </div>
                
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Your Referral Link</span>
                    <div className="flex bg-black/60 border border-slate-800 rounded px-2 py-1 items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">...{user?.uid.slice(-6)}</span>
                        <button 
                            onClick={() => {
                                const link = `${window.location.origin}/index.html?ref=${user?.uid}`;
                                navigator.clipboard.writeText(link);
                                alert("Referral Link Copied!");
                            }}
                            className="text-cyan-400 text-[10px] font-bold"
                        >COPY</button>
                    </div>
                </div>

                <div className="text-right">
                    <div className="bg-black border border-slate-700 px-4 py-1 rounded-xl shadow-inner">
                        <span className="text-xl font-black">${balance.toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Balance</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto w-full">
                <div className="relative w-full mt-4">
                    <canvas ref={canvasRef} className="w-full rounded-[40px] shadow-2xl border border-white/5 bg-black/20" />
                    <img src="img/plinko.png" className="absolute top-[-20px] left-1/2 translate-x-[-50%] w-32 opacity-10 pointer-events-none" alt="" />
                </div>
                
                <div className="flex gap-1 mt-4 w-full px-2">
                    {[125, 14, 5, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 5, 14, 125].map((m, i) => (
                        <div key={i} className={`flex-1 bg-black/60 border border-slate-800 py-2 text-center text-[9px] font-black rounded ${m >= 5 ? 'text-orange-400' : 'text-slate-500'}`}>
                            {m}x
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-6 my-8">
                    <button onClick={() => setBet(b => b + 5)} className="w-12 h-12 rounded-full border border-cyan-500 text-cyan-500 text-2xl font-black hover:bg-cyan-500/10 transition-colors">+</button>
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Wager Amount</span>
                        <span className="text-4xl font-black">${bet}</span>
                    </div>
                    <button onClick={() => setBet(b => Math.max(5, b - 5))} className="w-12 h-12 rounded-full border border-cyan-500 text-cyan-500 text-2xl font-black hover:bg-cyan-500/10 transition-colors">-</button>
                </div>

                <button 
                    onClick={handleDrop} 
                    disabled={isBallActive}
                    className={`w-full py-6 rounded-[30px] font-black text-xl uppercase tracking-widest transition-all ${isBallActive ? 'bg-slate-800 text-slate-600' : 'bg-gradient-to-b from-orange-400 to-orange-600 text-black shadow-lg shadow-orange-500/20 active:scale-95'}`}
                >
                    Drop Disk
                </button>
            </main>

            {showJackpot && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-[9999] animate-in fade-in duration-300">
                    <div className="bg-[#0a1e2e] border-2 border-yellow-500 rounded-[40px] p-10 w-full max-w-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse" />
                        <h2 className="text-yellow-500 font-black text-3xl uppercase mb-4">Jackpot Winner!</h2>
                        <p className="text-slate-400 text-xs mb-6 uppercase tracking-widest">{user?.fullName}</p>
                        <div className="border-2 border-dashed border-slate-700 p-8 rounded-3xl mb-8 bg-black/30">
                            <span className="text-5xl font-black text-white">$10,000.00</span>
                        </div>
                        <button onClick={() => { setShowJackpot(false); setShowWithdraw(true); }} className="w-full py-4 bg-orange-500 text-black font-black rounded-full uppercase hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20">Claim Reward</button>
                    </div>
                </div>
            )}

            {showWithdraw && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[9999]">
                    <div className="bg-[#0a1e2e] border border-cyan-500 rounded-[30px] p-8 w-full max-w-md shadow-2xl shadow-cyan-500/10">
                        <div className="flex justify-between mb-6">
                            <h3 className="text-xl font-black uppercase text-orange-500 tracking-tighter">Withdraw Funds</h3>
                            <button onClick={() => setShowWithdraw(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 uppercase font-bold tracking-widest">Available: ${balance.toFixed(2)}</p>
                        <div className="flex gap-2 mb-6">
                            <button onClick={() => setWithdrawMethod('Bank')} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${withdrawMethod === 'Bank' ? 'bg-cyan-500 text-black border-white' : 'border-slate-700 text-slate-500'}`}>Bank Transfer</button>
                            <button onClick={() => setWithdrawMethod('BTC')} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${withdrawMethod === 'BTC' ? 'bg-cyan-500 text-black border-white' : 'border-slate-700 text-slate-500'}`}>BTC Wallet</button>
                        </div>
                        {withdrawMethod && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                <textarea className="w-full bg-black border border-slate-800 rounded-xl p-4 text-sm focus:border-cyan-500 outline-none transition-colors h-24" placeholder={withdrawMethod === 'Bank' ? 'Enter Account #, Routing, and Bank Name...' : 'Enter BTC Wallet Address...'} />
                                <button className="w-full py-4 bg-orange-600 text-black font-black rounded-full uppercase hover:bg-orange-500 transition-all" onClick={() => { alert('Withdrawal Request Submitted!'); setShowWithdraw(false); }}>Confirm Withdrawal</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
