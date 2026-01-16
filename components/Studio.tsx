
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Layout, Trash2, ArrowRight, Wand2, RefreshCcw, Layers, Download, FileText, Armchair, Palette, X, Grid, Square, Link, Info, RotateCcw, Lock, Unlock, MapPin, Plus, HelpCircle, Monitor, DollarSign, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { DesignMode, DesignState, ChatMessage, ReferenceImage, ReferenceType, GenerationFormat } from '../types';
import { generateRoomViz, generateDesignAdvice, analyzeExternalLink, generateReportText } from '../services/geminiService';
import { Button } from './Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types & Constants ---

const MODES = [
  { id: DesignMode.REDESIGN, label: 'Re-Imagine', icon: Sparkles, desc: 'Complete makeover. Option to lock walls/windows.' },
  { id: DesignMode.STYLE_TRANSFER, label: 'Style Transfer', icon: RefreshCcw, desc: 'New texture/color, same layout.' },
  { id: DesignMode.CLEAN, label: 'Deep Clean', icon: Wand2, desc: 'Remove clutter, keep furniture.' },
  { id: DesignMode.CHRISTMAS, label: 'Seasonal', icon: Sparkles, desc: 'Holiday decor, same layout.' },
];

const FORMAT_OPTIONS: {id: GenerationFormat, label: string, icon: any}[] = [
    { id: 'single', label: 'Single View', icon: Square },
    { id: 'grid_angles', label: '4 Angles', icon: Grid },
    { id: 'grid_variants', label: '4 Variations', icon: Layout }
];

const BUDGET_MAP = [
    { val: 0, label: '$0', desc: 'Strict Zero Spend. Clean & Rearrange only.' },
    { val: 1, label: '$200', desc: 'Paint, Plants & Declutter.' },
    { val: 2, label: '$500', desc: 'Small accessories, textiles, and lamps.' },
    { val: 3, label: '$1,000', desc: 'Light Refresh: Rugs and Decor.' },
    { val: 4, label: '$5,000', desc: 'Moderate Update: Key furniture replacements.' },
    { val: 5, label: '$10,000', desc: 'Major Update: Quality furniture.' },
    { val: 6, label: '$25,000', desc: 'Full Renovation.' },
    { val: 7, label: '$50,000', desc: 'High-End Luxury Overhaul.' },
    { val: 8, label: 'Unlimited', desc: 'Dream Budget. No constraints.' },
];

// --- Sub Components ---

const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-[#0a0a0c] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/20 z-50 shadow-xl">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/20"></div>
    </div>
);

const GuideSpot = ({ text, position }: { text: string, position: string }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className={`absolute z-50 ${position} pointer-events-none`}
    >
        <div className="relative">
            <span className="absolute -inset-1 rounded-full bg-indigo-500 animate-ping opacity-75"></span>
            <div className="relative bg-indigo-600 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 bg-indigo-900/90 text-white text-xs p-3 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl pointer-events-auto">
                {text}
            </div>
        </div>
    </motion.div>
);

const FormattedText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={i} className="font-bold text-orange-200 block mt-3 mb-1 text-sm tracking-wide">{part.slice(2, -2)}</span>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <span key={i} className="italic text-white/60">{part.slice(1, -1)}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// --- Main Component ---

export const Studio: React.FC = () => {
  const generateID = () => 'AU' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const initialState: DesignState = {
    projectID: generateID(),
    baseImage: null,
    referenceImages: [],
    generatedImage: null,
    mode: DesignMode.REDESIGN,
    prompt: '',
    isGenerating: false,
    budgetIndex: 4, // Default to $5,000 (Index 4)
    location: '',
    externalLinks: [],
    reportContent: '',
    format: 'single',
    structureLocked: true,
    showGuide: false
  };

  const [state, setState] = useState<DesignState>(initialState);
  const [mobileTab, setMobileTab] = useState<'assets' | 'vision'>('vision');

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'model',
    text: `**Welcome to Aura.** Project ID: #${initialState.projectID} \n\nI am your design architect. Upload a photo of your space, and I will help you re-envision it.`
  }]);

  const [linkInput, setLinkInput] = useState("");
  const [isAnalyzingLink, setIsAnalyzingLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [nextRefType, setNextRefType] = useState<ReferenceType>('style');
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleReset = () => {
      if(confirm("Start a new project? This will clear your current design.")) {
          const newId = generateID();
          setState({...initialState, projectID: newId});
          setChatHistory([{
            id: Date.now().toString(),
            role: 'model',
            text: `**New Project Started (#${newId}).** \nReady for your next transformation.`
          }]);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isRef: boolean = false) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;

    if (isRef) {
        files.forEach(file => {
            if (state.referenceImages.length >= 8) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                const newRef: ReferenceImage = {
                    id: Date.now().toString() + Math.random(),
                    url: result,
                    type: nextRefType
                };
                setState(prev => ({ ...prev, referenceImages: [...prev.referenceImages, newRef] }));
            };
            reader.readAsDataURL(file);
        });
    } else {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setState(prev => ({ ...prev, baseImage: result, generatedImage: null }));
            handleSendMessage("I've uploaded my room. Analyze the structure and potential.", result);
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAddLink = async () => {
    if (!linkInput) return;
    setIsAnalyzingLink(true);
    const analysis = await analyzeExternalLink(linkInput);
    const newLink = {
        id: Date.now().toString(),
        url: linkInput,
        analysis: analysis,
        label: `Item #${state.externalLinks.length + 1}`
    };
    setState(prev => ({
        ...prev, 
        externalLinks: [...prev.externalLinks, newLink]
    }));
    setLinkInput("");
    setIsAnalyzingLink(false);
  };

  const removeLink = (id: string) => {
      setState(prev => ({
          ...prev,
          externalLinks: prev.externalLinks.filter(l => l.id !== id)
      }));
  };

  const handleSendMessage = async (text: string, imgOverride?: string) => {
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setChatHistory(prev => [...prev, newMessage]);
    setState(prev => ({...prev, prompt: ''}));

    const aiResponse = await generateDesignAdvice(
        [...chatHistory, {role: 'user', text}], 
        imgOverride || state.baseImage
    );
    
    setChatHistory(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiResponse
    }]);
  };

  const handleGenerate = async () => {
    if (!state.baseImage) return;
    
    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const chatContext = chatHistory
        .filter(m => m.role === 'user')
        .slice(-3)
        .map(m => m.text);
      
      const budgetDesc = BUDGET_MAP[state.budgetIndex].label;

      const result = await generateRoomViz(
        state.baseImage,
        state.mode,
        state.prompt,
        state.referenceImages,
        budgetDesc,
        state.location,
        state.externalLinks,
        state.format,
        chatContext,
        state.structureLocked
      );

      if (result) {
        const report = await generateReportText(state.baseImage, result, state.mode, budgetDesc, state.location, state.prompt);
        setState(prev => ({ ...prev, generatedImage: result, isGenerating: false, reportContent: report }));
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "**Error:** The visualization field was interrupted. Please check permissions or try again."
      }]);
    }
  };

  const handleDownloadImage = () => {
      if (!state.generatedImage) return;
      const link = document.createElement('a');
      link.href = state.generatedImage;
      link.download = `Aura-Vision-${state.projectID}.png`;
      link.click();
  };
  
  const handleDownloadPDF = async () => {
      if (!printRef.current) return;
      try {
          const element = printRef.current;
          element.style.display = 'block'; 
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          element.style.display = 'none'; 

          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Aura-Blueprint-${state.projectID}.pdf`);
      } catch (err) {
          console.error("PDF generation failed", err);
      }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  };

  const triggerRefUpload = (type: ReferenceType) => {
      setNextRefType(type);
      setTimeout(() => refInputRef.current?.click(), 0);
  }

  return (
    <div className="h-[100dvh] bg-[#0a0a0c] text-white flex flex-col font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* HEADER */}
      <div className="h-16 lg:h-20 shrink-0 px-4 lg:px-8 flex items-center justify-between z-30 bg-[#0a0a0c] border-b border-white/10 relative">
        <div className="flex items-center gap-4 lg:gap-10">
            <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 tracking-tighter cursor-pointer" onClick={handleReset}>
                Aura
            </h1>
            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-2">
                {MODES.map(m => (
                    <div key={m.id} className="relative group">
                        <button
                            onClick={() => setState(p => ({...p, mode: m.id}))}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${state.mode === m.id ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white'}`}
                        >
                            <m.icon className={`w-4 h-4 ${state.mode === m.id ? 'text-black' : 'text-current'}`} />
                            {m.label}
                        </button>
                        <Tooltip text={m.desc} />
                    </div>
                ))}
            </div>
            {state.showGuide && <GuideSpot text="Select your primary transformation goal here." position="top-20 left-[250px] hidden lg:block" />}
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
             <Button variant="secondary" onClick={() => setState(p => ({...p, showGuide: !p.showGuide}))} className="px-3 lg:px-4 text-xs lg:text-sm">
                <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-0 lg:mr-2" /> <span className="hidden lg:inline">Guide</span>
             </Button>
             <div className="px-2 lg:px-4 py-1 lg:py-2 bg-white/5 rounded-xl text-xs lg:text-sm font-mono text-white/40">
                #{state.projectID}
             </div>
        </div>
      </div>

      {/* MOBILE NAV SCROLL */}
      <div className="lg:hidden overflow-x-auto flex items-center gap-2 p-3 bg-[#0c0c0e] border-b border-white/5 no-scrollbar shrink-0">
         {MODES.map(m => (
            <button
                key={m.id}
                onClick={() => setState(p => ({...p, mode: m.id}))}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${state.mode === m.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-transparent'}`}
            >
                <m.icon className="w-4 h-4" />
                {m.label}
            </button>
         ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT: REFERENCES (Assets Tab on Mobile) */}
        <div className={`
             bg-[#0c0c0e] border-r border-white/10 flex-col z-20 overflow-y-auto
             lg:w-72 xl:w-80 lg:flex
             ${mobileTab === 'assets' ? 'flex flex-1 w-full' : 'hidden'}
        `}>
            <div className="p-6">
                <h3 className="font-bold text-white/70 mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Reality Anchors
                </h3>

                {/* VISUAL DROP ZONE */}
                <div 
                    className={`border-2 border-dashed rounded-3xl p-6 transition-all relative group cursor-pointer overflow-hidden ${state.referenceImages.length === 0 ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:bg-indigo-500/20' : 'border-white/10 hover:border-white/30'}`}
                >
                    {state.referenceImages.length === 0 && (
                        <div className="text-center">
                            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-bounce" />
                            <p className="text-indigo-200 font-bold mb-1">DROP ZONE ACTIVE</p>
                            <p className="text-xs text-indigo-300/70">Drag furniture or style photos here</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {state.referenceImages.map((img) => (
                            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group/item">
                                <img src={img.url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-2 py-1 rounded">{img.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Hidden Controls for Interactions */}
                    <div className="mt-4 flex gap-2">
                        <Button variant="secondary" onClick={() => triggerRefUpload('style')} className="flex-1 text-xs py-2 px-0 h-10">
                            + Style
                        </Button>
                        <Button variant="secondary" onClick={() => triggerRefUpload('element')} className="flex-1 text-xs py-2 px-0 h-10">
                            + Furniture
                        </Button>
                    </div>
                </div>
                
                {/* EXTERNAL LINKS MANAGER */}
                <div className="mt-8">
                    <h3 className="font-bold text-white/70 mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
                        <Link className="w-4 h-4" /> Smart Links
                    </h3>
                    <div className="flex gap-2 mb-3">
                        <input 
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="Paste product URL..."
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button 
                            onClick={handleAddLink}
                            disabled={!linkInput || isAnalyzingLink}
                            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            {isAnalyzingLink ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {state.externalLinks.map(link => (
                            <div key={link.id} className="bg-white/5 rounded-lg p-3 text-xs flex justify-between items-start group">
                                <div>
                                    <span className="text-indigo-400 font-bold block mb-1">{link.label}</span>
                                    <span className="text-white/60 line-clamp-2">{link.analysis}</span>
                                </div>
                                <button onClick={() => removeLink(link.id)} className="text-white/20 hover:text-red-400">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <input type="file" ref={refInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, true)} />
            </div>
        </div>

        {/* CENTER: CANVAS (Always Top on Mobile, Centered on Desktop) */}
        <div className={`
            bg-[#050505] relative flex flex-col items-center justify-center overflow-hidden
            lg:flex-1 lg:order-none
            ${mobileTab !== 'vision' && mobileTab !== 'assets' ? 'flex-1' : 'shrink-0 aspect-video w-full order-first'}
            lg:h-full
        `}>
             {/* BACKGROUND GRID FOR DESKTOP */}
             <div className="absolute inset-0 hidden lg:block opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)', backgroundSize: '40px 40px' }}>
             </div>

             {/* Background Blur for Mobile/Desktop fill */}
             {state.baseImage && (
                 <div className="absolute inset-0 z-0 opacity-20 blur-[100px] pointer-events-none">
                     <img src={state.baseImage} className="w-full h-full object-cover" />
                 </div>
             )}

             <div className="relative z-10 w-full lg:max-w-[95%] lg:max-h-[85%] lg:aspect-video aspect-video bg-[#1a1a1c] lg:rounded-2xl border-y lg:border border-white/10 shadow-2xl overflow-hidden group transition-all duration-500">
                 {!state.baseImage ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 hover:text-white/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                         <Upload className="w-8 h-8 lg:w-16 lg:h-16 mb-3 lg:mb-6 opacity-50" />
                         <p className="text-lg lg:text-2xl font-light">Upload your space</p>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, false)} />
                     </div>
                 ) : (
                     <>
                        {/* Comparison Slider */}
                        {state.generatedImage ? (
                            <div className="absolute inset-0 select-none cursor-ew-resize" ref={sliderRef} onMouseMove={handleSliderMove} onTouchMove={handleSliderMove}>
                                <div className="absolute inset-0">
                                    <img src={state.generatedImage} className="w-full h-full object-cover" />
                                </div>
                                <div 
                                    className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)]" 
                                    style={{ width: `${sliderPos}%` }}
                                >
                                    <img src={state.baseImage} className="w-full h-full object-cover" />
                                </div>
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-black font-bold z-20"
                                    style={{ left: `calc(${sliderPos}% - 16px)` }}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                                
                                {/* Overlay Controls */}
                                <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex gap-3 z-30">
                                     <Button variant="glass" onClick={handleDownloadImage} className="rounded-full !p-2 lg:!p-3">
                                         <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                                     </Button>
                                     <Button variant="vibrant" onClick={handleDownloadPDF} className="rounded-full pl-4 pr-4 lg:pl-6 lg:pr-8 text-xs lg:text-sm">
                                         <FileText className="w-4 h-4 lg:w-5 lg:h-5 mr-2" /> <span className="hidden lg:inline">Export Blueprint PDF</span> <span className="lg:hidden">PDF</span>
                                     </Button>
                                </div>
                            </div>
                        ) : (
                            <img src={state.baseImage} className="w-full h-full object-cover" />
                        )}
                        
                        {state.showGuide && <GuideSpot text="Drag the slider to compare Before & After." position="top-1/2 left-1/2" />}
                     </>
                 )}
             </div>
             
             {/* STRUCTURE LOCK TOGGLE - FLOATING BOTTOM CENTER */}
             {state.baseImage && !state.generatedImage && (
                 <div className="absolute bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 z-20">
                     <button 
                        onClick={() => setState(p => ({...p, structureLocked: !p.structureLocked}))}
                        className={`flex items-center gap-3 px-4 py-2 lg:px-6 lg:py-3 rounded-full backdrop-blur-md border transition-all ${state.structureLocked ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}
                     >
                         {state.structureLocked ? <Lock className="w-3 h-3 lg:w-4 lg:h-4" /> : <Unlock className="w-3 h-3 lg:w-4 lg:h-4" />}
                         <span className="font-bold text-xs lg:text-sm tracking-wide">
                             {state.structureLocked ? 'STRUCTURAL LOCK ON' : 'UNLOCKED'}
                         </span>
                     </button>
                 </div>
             )}
        </div>

        {/* RIGHT: COMMAND CENTER (Vision Tab on Mobile) */}
        <div className={`
             bg-[#0c0c0e] border-l border-white/10 flex-col z-20 relative
             lg:w-96 lg:flex
             ${mobileTab === 'vision' ? 'flex flex-1 w-full' : 'hidden'}
        `}>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
                {chatHistory.map(msg => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        key={msg.id} 
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div className={`max-w-[90%] p-3 lg:p-4 rounded-2xl text-xs lg:text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white/10 text-white rounded-br-none' : 'bg-indigo-900/20 border border-indigo-500/30 text-indigo-100 rounded-bl-none'}`}>
                            <FormattedText text={msg.text} />
                        </div>
                    </motion.div>
                ))}
                <div ref={chatBottomRef} />
            </div>

            {/* Controls Area */}
            <div className="p-4 lg:p-6 bg-[#0f0f12] border-t border-white/5 space-y-4 lg:space-y-6">
                 
                 {/* 1. Format & Location Row */}
                 <div className="flex gap-2 lg:gap-3">
                     <div className="flex bg-white/5 rounded-xl p-1 flex-1">
                         {FORMAT_OPTIONS.map(opt => (
                             <div key={opt.id} className="flex-1 relative group">
                                <button
                                    onClick={() => setState(p => ({...p, format: opt.id}))}
                                    className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${state.format === opt.id ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white'}`}
                                >
                                    <opt.icon className="w-4 h-4" />
                                </button>
                                <div className="hidden lg:block">
                                    <Tooltip text={opt.label} />
                                </div>
                             </div>
                         ))}
                     </div>
                     <div className="flex-1 relative">
                         <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                         <input 
                            placeholder="Location (e.g. Miami)" 
                            value={state.location}
                            onChange={(e) => setState(p => ({...p, location: e.target.value}))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 lg:py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                         />
                     </div>
                 </div>

                 {/* 2. PRICE SLIDER (New Budget) */}
                 <div>
                     <div className="flex items-center justify-between mb-3">
                         <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                             <DollarSign className="w-3 h-3" /> Budget Cap
                             <div className="relative group cursor-pointer hidden lg:block">
                                 <Info className="w-3 h-3 text-white/30 hover:text-white" />
                                 <Tooltip text="The AI will restrict furniture choices to this budget." />
                             </div>
                         </label>
                         <span className="text-indigo-400 font-bold text-sm bg-indigo-500/10 px-2 py-1 rounded">
                             {BUDGET_MAP[state.budgetIndex].label}
                         </span>
                     </div>
                     
                     <div className="relative h-6 flex items-center">
                         <input 
                            type="range"
                            min="0"
                            max="8"
                            step="1"
                            value={state.budgetIndex}
                            onChange={(e) => setState(p => ({...p, budgetIndex: parseInt(e.target.value)}))}
                            className="w-full appearance-none bg-white/10 h-1.5 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                         />
                     </div>
                     <p className="text-xs text-white/40 mt-1 h-4">{BUDGET_MAP[state.budgetIndex].desc}</p>
                 </div>

                 {/* 3. Input & Generate */}
                 <div className="space-y-3">
                     <input 
                        className="w-full bg-[#050505] border border-white/20 rounded-xl px-4 py-3 lg:py-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-white/20"
                        placeholder="Describe your changes..."
                        value={state.prompt}
                        onChange={(e) => setState(p => ({...p, prompt: e.target.value}))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(state.prompt)}
                     />
                     <Button 
                        variant="vibrant" 
                        onClick={handleGenerate} 
                        isLoading={state.isGenerating} 
                        className="w-full rounded-xl py-3 lg:py-4 text-base shadow-lg shadow-indigo-500/20"
                     >
                        Generate Transformation
                     </Button>

                     {/* PERSISTENT PDF DOWNLOAD BUTTON (SIDEBAR) */}
                     {state.generatedImage && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Button 
                                variant="glass" 
                                onClick={handleDownloadPDF} 
                                className="w-full rounded-xl py-3 text-sm border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20"
                            >
                                <FileText className="w-4 h-4 mr-2" /> Download Design Blueprint PDF
                            </Button>
                        </motion.div>
                     )}
                 </div>
            </div>
            
            {state.showGuide && <GuideSpot text="Set your budget slider and type a prompt here." position="bottom-32 right-6 hidden lg:block" />}
        </div>

      </div>

      {/* MOBILE TAB BAR */}
      <div className="lg:hidden h-16 bg-[#0c0c0e] border-t border-white/10 flex items-center justify-around shrink-0 z-50">
          <button 
            onClick={() => setMobileTab('assets')}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${mobileTab === 'assets' ? 'text-white' : 'text-white/40'}`}
          >
              <div className={`p-1 rounded-lg ${mobileTab === 'assets' ? 'bg-indigo-500/20' : ''}`}>
                  <ImageIcon className="w-5 h-5" />
              </div>
              Assets
          </button>
          
          <button 
            onClick={() => setMobileTab('vision')}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${mobileTab === 'vision' ? 'text-white' : 'text-white/40'}`}
          >
              <div className={`p-1 rounded-lg ${mobileTab === 'vision' ? 'bg-orange-500/20' : ''}`}>
                  <MessageSquare className="w-5 h-5" />
              </div>
              Vision & Chat
          </button>
      </div>

      {/* HIDDEN PRINT AREA */}
      <div ref={printRef} style={{ display: 'none', width: '210mm', minHeight: '297mm', padding: '20mm', background: 'white', color: 'black', fontFamily: 'serif' }}>
           <div style={{ borderBottom: '2px solid black', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
               <div>
                   <h1 style={{ fontSize: '40px', margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Aura</h1>
                   <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>INTELLIGENT DESIGN BLUEPRINT</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                   <p style={{ margin: 0, fontWeight: 'bold' }}>PROJECT: #{state.projectID}</p>
                   <p style={{ margin: 0, fontSize: '12px' }}>{new Date().toLocaleDateString()}</p>
               </div>
           </div>

           <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>CURRENT STATE</p>
                    {state.baseImage && <img src={state.baseImage} style={{ width: '100%', borderRadius: '4px' }} />}
                </div>
                <div style={{ flex: 1.5 }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>FUTURE VISION</p>
                    {state.generatedImage && <img src={state.generatedImage} style={{ width: '100%', borderRadius: '4px' }} />}
                </div>
           </div>
           
           <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>Design Strategy</h3>
                <div dangerouslySetInnerHTML={{ __html: state.reportContent || '<p>Analysis pending...</p>' }} style={{ fontSize: '12px', lineHeight: '1.6' }} />
           </div>

           <div>
               <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>MOOD BOARD & REFERENCES</p>
               <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                   {state.referenceImages.map(img => (
                       <img key={img.id} src={img.url} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                   ))}
               </div>
           </div>
      </div>

    </div>
  );
};
