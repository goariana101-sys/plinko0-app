import React, { useState, useEffect, useRef } from 'react';
import PlinkoEngine from './PlinkoEngine.ts';

declare var firebase: any;

const App: React.FC = () => {
    // Auth State
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState<{uid: string, fullName: string} | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', referral: '' });

    // Game State
    const [balance, setBalance] = useState<number>(0);
    const [bet, setBet] = useState<number>(5.00);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showJackpot, setShowJackpot] = useState(false);
    const [isBallActive, setIsBallActive] = useState(false);
    const [withdrawMethod, setWithdrawMethod] = useState<'Bank' | 'BTC' | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<any>(null);

    const playSound = (name: string) => {
        try {
            const audio = new Audio(`sounds/${name}.mp3`);
            audio.volume = 0.4;
            audio.play().catch(() => {});
        } catch (e) {}
    };

    // Firebase Auth & Data Listener
    useEffect(() => {
        if (typeof firebase === 'undefined') return;
        const unsubscribe = firebase.auth().onAuthStateChanged((authUser: any) => {
            if (authUser) {
                const db = firebase.firestore();
                db.collection("users").doc(authUser.uid).onSnapshot((doc: any) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        setBalance(data.balance || 0);
                        setUser({ uid: authUser.uid, fullName: data.fullName || "Player" });
                    }
                });
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Plinko Engine Lifecycle
    useEffect(() => {
        if (user && canvasRef.current && !engineRef.current) {
            canvasRef.current.width = 600;
            canvasRef.current.height = 650;
            engineRef.current = new PlinkoEngine(canvasRef.current, {
                onWin: (betAmount, multiplier) => {
                    const winAmount = betAmount * multiplier;
                    const db = firebase.firestore();
                    db.collection("users").doc(firebase.auth().currentUser.uid).update({
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
    }, [user]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await firebase.auth().signInWithEmailAndPassword(formData.email, formData.password);
            } else {
                const cred = await firebase.auth().createUserWithEmailAndPassword(formData.email, formData.password);
                
                // REFERRAL LOGIC: If referral box has text, user gets $25 instead of $20
                const initialBalance = formData.referral.trim() !== '' ? 25.00 : 20.00;
                
                await firebase.firestore().collection("users").doc(cred.user.uid).set({
                    fullName: formData.fullName,
                    email: formData.email,
                    balance: initialBalance,
                    referralCode: cred.user.uid.slice(-6).toUpperCase(),
                    usedReferral: formData.referral || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDrop = () => {
        if (isBallActive || balance < bet) {
            if (balance < bet) alert("Insufficient Balance!");
            return;
        }
        playSound('count_down');
        setIsBallActive(true);
        firebase.firestore().collection("users").doc(user?.uid).update({
            balance: firebase.firestore.FieldValue.increment(-bet)
        });
        engineRef.current?.dropBall(bet);
    };

    if (authLoading) return <div className="flex items-center justify-center h-screen text-cyan-500 font-bold uppercase tracking-widest animate-pulse">Initializing...</div>;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#050a0f]">
                <div className="bg-[#0a1e2e] border border-cyan-500/30 p-8 rounded-[30px] w-full max-w-sm shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-tighter">TURBO PLINKO</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Ref Bonus Available: $5.00</p>
                    </div>
                    
                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <input 
                                type="text" placeholder="Full Name" required
                                className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                        )}
                        <input 
                            type="email" placeholder="Email Address" required
                            className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                        <input 
                            type="password" placeholder="Password" required
                            className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                        {!isLogin && (
                            <div className="relative">
                                <input 
                                    type="text" placeholder="Referral Code (Optional)" 
                                    className="w-full bg-black/50 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none transition-all"
                                    onChange={e => setFormData({...formData, referral: e.target.value})}
                                />
                                <span className="absolute right-3 top-3 text-[10px] text-orange-500 font-bold uppercase">+$5.00</span>
                            </div>
                        )}
                        <button className="w-full py-4 bg-cyan-500 text-black font-black rounded-xl uppercase hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
                            {isLogin ? 'Enter Casino' : 'Claim $20.00 & Register'}
                        </button>
                    </form>
                    
                    <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                        {isLogin ? "Need an account? Sign Up" : "Back to Sign In"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050a0f] text-white flex flex-col">
            <header className="flex justify-between items-center p-4 bg-black/40 border-b border-cyan-500/30 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowWithdraw(true)} className="px-4 py-1.5 border border-cyan-500 text-cyan-400 rounded-full text-[10px] font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all">
                        Withdraw
                    </button>
                    <button onClick={() => firebase.auth().signOut()} className="text-slate-500 text-[10px] uppercase font-bold hover:text-white">Logout</button>
                </div>
                
                <div className="hidden sm:flex flex-col items-center">
                    <span className="text-[9px] text-cyan-400 font-bold uppercase mb-1">Affiliate Code</span>
                    <button 
                        onClick={() => {
                            const link = `${window.location.origin}/index.html?ref=${user?.uid.slice(-6).toUpperCase()}`;
                            navigator.clipboard.writeText(link);
                            alert("Link copied!");
                        }}
                        className="bg-black/60 border border-slate-800 rounded px-3 py-1 text-[9px] text-slate-400 font-mono hover:border-cyan-500"
                    >{user?.uid.slice(-6).toUpperCase()}</button>
                </div>

                <div className="text-right">
                    <div className="bg-black border border-slate-700 px-4 py-1 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                        <span className="text-xl font-black text-cyan-400">${balance.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto w-full">
                <div className="relative w-full mt-2">
                    <canvas ref={canvasRef} className="relative w-full rounded-[40px] border border-white/5 bg-black/10 shadow-2xl" />
                </div>
                
                <div className="flex gap-1 mt-6 w-full px-2">
                    {[125, 14, 5, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 5, 14, 125].map((m, i) => (
                        <div key={i} className={`flex-1 bg-black/60 border border-slate-800 py-2.5 text-center text-[9px] font-black rounded-lg ${m >= 5 ? 'text-orange-400' : 'text-slate-500'}`}>
                            {m}x
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between w-full mt-8 bg-black/40 p-4 rounded-3xl border border-slate-800">
                    <button onClick={() => setBet(b => Math.max(5, b - 5))} className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-white text-2xl font-black hover:border-cyan-500 transition-all">-</button>
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Bet Amount</span>
                        <span className="text-4xl font-black text-white">${bet}</span>
                    </div>
                    <button onClick={() => setBet(b => b + 5)} className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-white text-2xl font-black hover:border-cyan-500 transition-all">+</button>
                </div>

                <button 
                    onClick={handleDrop} 
                    disabled={isBallActive}
                    className={`w-full mt-6 py-6 rounded-[30px] font-black text-xl uppercase tracking-widest transition-all ${isBallActive ? 'bg-slate-800 text-slate-600' : 'bg-gradient-to-b from-orange-400 to-orange-600 text-black shadow-xl active:scale-95'}`}
                >
                    {isBallActive ? 'Dropping...' : 'Drop Disk'}
                </button>
            </main>

            {showJackpot && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-[9999] backdrop-blur-md">
                    <div className="bg-[#0a1e2e] border-2 border-yellow-500 rounded-[40px] p-10 w-full max-w-sm text-center">
                        <h2 className="text-yellow-500 font-black text-3xl uppercase mb-4">JACKPOT!</h2>
                        <div className="bg-black/40 border-2 border-dashed border-slate-700 p-8 rounded-3xl mb-8">
                            <span className="text-5xl font-black text-white">$10,000</span>
                        </div>
                        <button onClick={() => { setShowJackpot(false); setShowWithdraw(true); }} className="w-full py-4 bg-orange-500 text-black font-black rounded-full uppercase">Claim Now</button>
                    </div>
                </div>
            )}

            {showWithdraw && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[9999]">
                    <div className="bg-[#0a1e2e] border border-cyan-500/50 rounded-[30px] p-8 w-full max-w-md">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase text-orange-500 italic">Withdraw Funds</h3>
                            <button onClick={() => setShowWithdraw(false)} className="text-slate-500 text-2xl hover:text-white">âœ•</button>
                        </div>
                        <div className="flex gap-3 mb-8">
                            <button onClick={() => setWithdrawMethod('Bank')} className={`flex-1 py-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${withdrawMethod === 'Bank' ? 'bg-cyan-500 text-black border-white' : 'border-slate-800 text-slate-600'}`}>ðŸ¦ Bank</button>
                            <button onClick={() => setWithdrawMethod('BTC')} className={`flex-1 py-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${withdrawMethod === 'BTC' ? 'bg-cyan-500 text-black border-white' : 'border-slate-800 text-slate-600'}`}>â‚¿ BTC</button>
                        </div>
                        {withdrawMethod && (
                            <div className="space-y-4">
                                <textarea className="w-full bg-black border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-cyan-500 outline-none h-32" placeholder="Enter details..." />
                                <button className="w-full py-5 bg-orange-600 text-black font-black rounded-full uppercase shadow-lg shadow-orange-500/20" onClick={() => { alert('Submitted!'); setShowWithdraw(false); }}>Verify & Send</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
