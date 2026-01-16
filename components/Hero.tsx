import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, DollarSign, Wand2, Palette, Home, Users, Smile, Star, FileText, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

interface HeroProps {
  onStart: () => void;
}

// Drifting Orb Animation Component
const FloatingOrb = ({ color, size, top, left, delay, duration }: any) => (
  <motion.div
    animate={{
      y: [0, -40, 0],
      x: [0, 30, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3]
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }}
    className={`absolute rounded-full blur-[100px] pointer-events-none ${color}`}
    style={{ 
        width: size, 
        height: size, 
        top: top, 
        left: left,
        filter: 'blur(80px)' 
    }}
  />
);

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleStart = () => {
    window.scrollTo(0, 0);
    onStart();
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#0a0a0c] text-white overflow-x-hidden font-sans selection:bg-orange-500/30">
      
      {/* LIVING BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <FloatingOrb color="bg-indigo-600" size="40vw" top="-10%" left="-10%" delay={0} duration={15} />
        <FloatingOrb color="bg-orange-500" size="35vw" top="20%" left="60%" delay={2} duration={18} />
        <FloatingOrb color="bg-purple-600" size="45vw" top="50%" left="10%" delay={4} duration={20} />
        <FloatingOrb color="bg-pink-500" size="30vw" top="80%" left="50%" delay={1} duration={16} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 backdrop-blur-md bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-orange-400 via-pink-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="text-2xl font-display font-bold text-white tracking-tighter">Aura</div>
        </div>
        <Button variant="glass" onClick={handleStart} className="hidden md:flex rounded-full px-6">
          Open Studio
        </Button>
      </nav>

      {/* HERO HEADER */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 flex flex-col items-center text-center z-10 max-w-6xl mx-auto">
         <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-orange-200/90 text-sm font-medium mb-10 shadow-lg"
         >
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="tracking-wide uppercase text-xs font-bold">The Future of Interior Design</span>
         </motion.div>

         <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-[7rem] font-display font-extrabold leading-[0.95] mb-8 tracking-tighter text-glow"
         >
            Design your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-pink-300 to-indigo-300">future self.</span>
         </motion.h1>

         <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
         >
            Aura isn't just a design tool. It's a mirror. <br className="hidden md:block"/>
            Re-imagine your space to reflect the person you are becoming.
         </motion.p>

         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col md:flex-row gap-6 items-center"
         >
             <Button variant="vibrant" onClick={handleStart} className="h-16 px-12 text-lg rounded-full shadow-2xl shadow-pink-500/20">
                Start Your Transformation
             </Button>
         </motion.div>

         {/* Hero Image Float */}
         <motion.div 
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.8, type: "spring" }}
            className="mt-20 w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(100,50,255,0.25)] border border-white/10"
         >
            <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2874&auto=format&fit=crop" alt="Interior" className="w-full h-auto opacity-90" />
         </motion.div>
      </section>

      {/* USE CASES - GLASS CARDS */}
      <section className="py-32 px-6 relative z-10">
           <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-display font-bold mb-4">Who is Aura for?</h2>
                        <p className="text-xl text-white/50">Designing for the dreamers, the pros, and the playful.</p>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full md:w-1/3 mb-4" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <UserCard 
                        icon={Home}
                        title="The Dreamers"
                        desc="Visualize a $200 budget refresh or a complete renovation instantly. See what a specific piece of furniture or a carpet would look like. See the potential in your mess."
                        gradient="from-cyan-500 via-blue-500 to-indigo-500"
                    />
                    <UserCard 
                        icon={Users}
                        title="The Professionals"
                        desc="Show clients 4 concept layouts in seconds without moving a single chair. Create professional design briefs and close deals faster."
                        gradient="from-purple-500 via-pink-500 to-rose-500"
                    />
                    <UserCard 
                        icon={Smile}
                        title="The Playful"
                        desc="For kids (and adults) who want to see their room on Mars, inside of Minecraft or what it looks like clean! Change themes weekly."
                        gradient="from-orange-500 via-amber-500 to-yellow-500"
                    />
                </div>
           </div>
      </section>

      {/* FEATURE GRID */}
      <section className="py-24 px-6 relative z-10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                   <span className="text-orange-400 font-bold tracking-widest uppercase text-xs mb-4 block">Powered by Gemini 3 Pro</span>
                   <h2 className="text-4xl md:text-7xl font-display font-bold">The Aura Advantage</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureBox 
                      icon={ShieldCheck}
                      title="Structural Trust"
                      desc="We don't hallucinate new walls. Aura respects your architecture, keeping doors, windows, and pillars exactly where they belong."
                  />
                  <FeatureBox 
                      icon={ShoppingBag}
                      title="Reality Anchors"
                      desc="Don't dream of phantom furniture. Upload links to real items (Ikea, Wayfair), and we place those exact pieces in your room."
                  />
                   <FeatureBox 
                      icon={FileText}
                      title="Design Identity"
                      desc="Get more than a picture. Download a strategic Design Blueprint PDF that explains the 'Why' behind the new look."
                  />
                  <FeatureBox 
                      icon={Palette}
                      title="Style Transfer"
                      desc="Love a hotel you visited? Or a Christmas theme? Aura wraps your room in that exact aesthetic instantly."
                  />
                  <FeatureBox 
                      icon={DollarSign}
                      title="Smart Budget"
                      desc="Set a limit. 'Budget Fix' focuses on decluttering and paint. 'Renovate' changes everything."
                  />
                  <FeatureBox 
                      icon={Wand2}
                      title="Deep Clean"
                      desc="The most satisfying button. Instantly remove clutter to reveal your room's soul."
                  />
              </div>
          </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 px-6 flex justify-center relative bg-black/40">
           <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent pointer-events-none" />
           <div className="flex flex-col items-center justify-center text-center max-w-3xl relative z-10 mx-auto">
               <h3 className="text-5xl md:text-8xl font-display font-bold mb-8 text-white tracking-tighter">Ready to <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Transform?</span></h3>
               <p className="text-white/60 mb-12 text-xl font-light">No account needed. Just you, your room, and a vision.</p>
               <Button variant="vibrant" onClick={handleStart} className="h-16 px-16 text-xl rounded-full">
                   Launch Aura Studio
               </Button>
           </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-black/40 backdrop-blur-md text-center text-white/30 text-sm">
          <p>© 2025 Aura Visionary Interiors. Built for the bold.</p>
      </footer>
    </div>
  );
};

const UserCard = ({ icon: Icon, title, desc, gradient }: any) => (
    <motion.div 
        whileHover={{ y: -10 }}
        className="glass-panel p-10 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:bg-white/10"
    >
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 blur-[60px] rounded-full transition-opacity duration-500`} />
        <div className="relative z-10">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-8 shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-display">{title}</h3>
            <p className="text-white/60 leading-relaxed font-light text-lg">
                {desc}
            </p>
        </div>
    </motion.div>
);

const FeatureBox = ({ icon: Icon, title, desc }: any) => (
    <motion.div 
        whileHover={{ scale: 1.02 }}
        className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex gap-6 items-start backdrop-blur-sm"
    >
        <div className="shrink-0">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-orange-200 border border-white/10">
                 <Icon className="w-6 h-6" />
             </div>
        </div>
        <div>
            <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
            <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);