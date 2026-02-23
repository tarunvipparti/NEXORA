import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { 
  Shield, 
  Scan, 
  Image as ImageIcon, 
  History, 
  ArrowLeft, 
  ExternalLink, 
  ShieldX, 
  ShieldAlert,
  RefreshCcw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AppState, ScanResult } from './types';
import { cn, getRiskColor } from './utils';
import { Scanner } from './components/Scanner';
import { RiskGauge } from './components/RiskGauge';
import { HistoryItem } from './components/HistoryItem';
import { analyzeUrl } from './services/gemini';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0B10] text-white flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-white/60 mb-8 max-w-md">
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          <pre className="bg-white/5 p-4 rounded-xl text-xs text-red-400 overflow-auto max-w-full text-left mb-8">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black font-bold py-3 px-8 rounded-xl"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const savedHistory = localStorage.getItem('securescan_history');
      const savedBlocked = localStorage.getItem('securescan_blocked');
      return {
        screen: 'home',
        history: savedHistory ? JSON.parse(savedHistory) : [],
        blockedUrls: savedBlocked ? JSON.parse(savedBlocked) : []
      };
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      return {
        screen: 'home',
        history: [],
        blockedUrls: []
      };
    }
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    localStorage.setItem('securescan_history', JSON.stringify(state.history));
    localStorage.setItem('securescan_blocked', JSON.stringify(state.blockedUrls));
  }, [state.history, state.blockedUrls]);

  const handleScan = async (url: string) => {
    // Check if already blocked
    if (state.blockedUrls.includes(url)) {
      const blockedResult: ScanResult = {
        id: 'blocked-' + Date.now(),
        url,
        timestamp: Date.now(),
        riskScore: 100,
        riskLevel: 'high-risk',
        indicators: ['This URL was previously blocked due to high security risks.'],
        recommendation: 'Do not attempt to access this URL.',
        analysis: 'Automatically blocked by SecureScan AI protection system.',
      };
      setState(prev => ({
        ...prev,
        screen: 'result',
        currentResult: blockedResult
      }));
      setShowAlert(true);
      return;
    }

    setState(prev => ({ ...prev, screen: 'scanning' }));
    setIsAnalyzing(true);
    
    const analysis = await analyzeUrl(url);
    
    const newResult: ScanResult = {
      id: Math.random().toString(36).substring(7),
      url,
      timestamp: Date.now(),
      riskScore: analysis.riskScore || 0,
      riskLevel: analysis.riskLevel || 'suspicious',
      indicators: analysis.indicators || [],
      recommendation: analysis.recommendation || '',
      analysis: analysis.analysis || '',
    };

    const isHighRisk = newResult.riskLevel === 'high-risk';

    setState(prev => ({
      ...prev,
      screen: 'result',
      currentResult: newResult,
      history: [newResult, ...prev.history].slice(0, 50),
      blockedUrls: isHighRisk ? [...new Set([...prev.blockedUrls, url])] : prev.blockedUrls
    }));
    setIsAnalyzing(false);

    if (isHighRisk) {
      setShowAlert(true);
    }
  };

  const navigateTo = (screen: AppState['screen'], result?: ScanResult) => {
    setState(prev => ({ ...prev, screen, currentResult: result || prev.currentResult }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleScan(code.data);
        } else {
          alert("No QR code found in this image. Please try another one.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full p-6"
    >
      <div className="flex flex-col items-center justify-center mt-12 mb-16">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 bg-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
            <Shield className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          SecureScan <span className="text-green-500">AI</span>
        </h1>
        <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">
          Scan. Analyze. Protect.
        </p>
      </div>

      <div className="space-y-4 mb-12">
        <button 
          onClick={() => navigateTo('scanning')}
          className="w-full group relative overflow-hidden bg-green-500 hover:bg-green-400 text-black font-bold py-6 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <Scan size={24} />
          <span className="text-lg">Scan QR Code</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>

        <label className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer">
          <ImageIcon size={20} className="text-white/60" />
          <span>Upload QR Image</span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload}
          />
        </label>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
            <span className="bg-[#0A0B10] px-4 text-white/20 font-bold">Or enter manually</span>
          </div>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const url = formData.get('url') as string;
            if (url) handleScan(url);
          }}
          className="flex gap-2"
        >
          <input 
            name="url"
            type="url" 
            placeholder="https://example.com" 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
            required
          />
          <button 
            type="submit"
            className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-colors"
          >
            <ExternalLink size={20} />
          </button>
        </form>
      </div>

      {state.history.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <History size={14} />
              Recent Scans
            </h2>
            <button 
              onClick={() => navigateTo('history')}
              className="text-green-500 text-xs font-bold uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {state.history.slice(0, 3).map(scan => (
              <HistoryItem 
                key={scan.id} 
                scan={scan} 
                onClick={() => navigateTo('result', scan)} 
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderResult = () => {
    const result = state.currentResult;
    if (!result) return null;

    const color = getRiskColor(result.riskLevel);
    const isHighRisk = result.riskLevel === 'high-risk';

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "flex flex-col h-full transition-colors duration-500",
          isHighRisk ? "bg-red-950/20" : ""
        )}
      >
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <button 
            onClick={() => navigateTo('home')}
            className="p-2 hover:bg-white/5 rounded-xl text-white/60 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-white font-bold text-lg">Scan Analysis</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Risk Overview */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {isHighRisk && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-red-500 rounded-full blur-2xl"
                />
              )}
              <RiskGauge score={result.riskScore} color={color} />
            </div>
            <div 
              className="mt-6 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs border shadow-lg"
              style={{ backgroundColor: `${color}10`, color, borderColor: `${color}30` }}
            >
              {result.riskLevel.replace('-', ' ')}
            </div>
          </div>

          {/* Threat Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span>Threat Level</span>
              <span>{result.riskScore}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${result.riskScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {/* URL Box */}
          <div className={cn(
            "border rounded-2xl p-4 transition-colors",
            isHighRisk ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900 border-white/10"
          )}>
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">
              Extracted URL
            </span>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex-1 truncate font-mono text-sm",
                isHighRisk ? "text-red-400" : "text-white"
              )}>
                {result.url}
              </div>
              <Lock size={14} className="text-white/20" />
            </div>
          </div>

          {/* Indicators */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} className={isHighRisk ? "text-red-500" : ""} />
              Threat Indicators
            </h3>
            <div className="space-y-2">
              {result.indicators.map((indicator, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    isHighRisk ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/5"
                  )}
                >
                  <div className="mt-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isHighRisk ? "bg-red-500" : "bg-white/40"
                    )} />
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isHighRisk ? "text-red-200/80" : "text-white/80"
                  )}>{indicator}</p>
                </div>
              ))}
              {result.indicators.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <p className="text-green-500 text-sm font-medium">No immediate threats detected.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div className="space-y-3 pb-8">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Info size={14} />
              Recommended Action
            </h3>
            <div className={cn(
              "p-4 border rounded-2xl",
              isHighRisk ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900 border-white/10"
            )}>
              <p className={cn(
                "text-sm leading-relaxed italic font-medium",
                isHighRisk ? "text-red-400" : "text-white/90"
              )}>
                "{result.recommendation}"
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-zinc-900/90 backdrop-blur-md border-t border-white/5 space-y-3">
          {result.riskLevel === 'safe' ? (
            <button 
              onClick={() => window.open(result.url, '_blank')}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ExternalLink size={20} />
              Open Secure Link
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-2xl flex items-center gap-3">
                <ShieldX className="text-red-500" size={24} />
                <div className="text-left">
                  <p className="text-red-500 font-bold text-sm uppercase tracking-wider">URL Blocked</p>
                  <p className="text-white/60 text-[10px]">Access to this link has been restricted for your safety.</p>
                </div>
              </div>
              <button 
                onClick={() => navigateTo('home')}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                <ShieldX size={20} />
                Report & Close
              </button>
            </div>
          )}
          <button 
            onClick={() => navigateTo('scanning')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RefreshCcw size={18} />
            Rescan
          </button>
        </div>
      </motion.div>
    );
  };

  const renderHistory = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      <div className="p-6 flex items-center gap-4 border-b border-white/5">
        <button 
          onClick={() => navigateTo('home')}
          className="p-2 hover:bg-white/5 rounded-xl text-white/60 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-white font-bold text-lg">Scan History</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {state.history.map(scan => (
          <HistoryItem 
            key={scan.id} 
            scan={scan} 
            onClick={() => navigateTo('result', scan)} 
          />
        ))}
        {state.history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <History size={48} className="mb-4" />
            <p className="text-white font-medium">No scan history yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0A0B10] text-white font-sans selection:bg-green-500/30">
      <div className="max-w-md mx-auto h-screen bg-zinc-950 shadow-2xl relative overflow-hidden flex flex-col border-x border-white/5">
        
        <AnimatePresence mode="wait">
          {state.screen === 'home' && renderHome()}
          {state.screen === 'scanning' && (
            <Scanner 
              onScan={handleScan} 
              onCancel={() => navigateTo('home')} 
              onImageUpload={handleImageUpload}
            />
          )}
          {state.screen === 'result' && renderResult()}
          {state.screen === 'history' && renderHistory()}
        </AnimatePresence>

        {/* Security Alert Modal */}
        <AnimatePresence>
          {showAlert && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm bg-zinc-900 border border-red-500/50 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(220,38,38,0.3)] flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-red-500 rounded-full blur-xl"
                  />
                  <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <ShieldAlert className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Security Threat Detected</h3>
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-4">High Risk Level</p>
                
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  Our AI analysis has identified multiple threat indicators in this URL. Opening this link may compromise your device security.
                </p>
                
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => setShowAlert(false)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.95]"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => {
                      setShowAlert(false);
                      navigateTo('home');
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-semibold py-4 rounded-2xl transition-all active:scale-[0.95]"
                  >
                    Back to Safety
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Loading Modal */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-8">
                  <motion.div 
                    className="absolute inset-0 border-4 border-green-500/20 rounded-full"
                  />
                  <motion.div 
                    className="absolute inset-0 border-4 border-t-green-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Deep Scan</h3>
                <p className="text-white/60 text-sm max-w-[200px]">
                  Analyzing URL patterns and checking threat databases...
                </p>
                <div className="mt-8 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      className="w-1.5 h-1.5 bg-green-500 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
