import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Zap, Activity, ArrowRight, Network, Cpu, ShoppingCart, Wallet } from 'lucide-react';
import Logo from '@/components/Logo';

interface LandingPageViewProps {
  connectWallet: () => void;
}

export default function LandingPageView({ connectWallet }: LandingPageViewProps) {
  return (
    <div className="min-h-screen bg-arc-dark text-white font-sans uppercase tracking-widest overflow-hidden selection:bg-arc-green selection:text-black">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-arc-border/50 bg-arc-dark/80 backdrop-blur-md z-50 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo className="w-6 h-6 text-arc-green" />
            <h1 className="text-xl font-bold tracking-[0.2em] text-white">
              SYMBION<span className="text-arc-green">_</span>
            </h1>
          </div>
          <button 
            onClick={connectWallet}
            className="text-xs font-bold border border-arc-border px-4 py-2 hover:border-arc-green transition-colors"
          >
            [ INITIALIZE_CONNECTION ]
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 min-h-[70vh] flex flex-col justify-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-arc-green/10 rounded-full animate-[spin_60s_linear_infinite] -z-10 blur-[1px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-arc-border/20 rounded-full animate-[spin_40s_linear_infinite_reverse] -z-10 blur-[1px]"></div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 border border-arc-green/50 bg-arc-green/10 px-4 py-2 text-arc-green text-xs font-mono">
              <Activity size={14} />
              <span>ARC_TESTNET_LIVE</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter">
              THE <span className="text-arc-green">AGENTIC</span> <br/>
              ECONOMY <br/>
              PROTOCOL.
            </h1>
            
            <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl lowercase leading-relaxed">
              bridge human commerce with autonomous AI workers. deploy trustless escrow contracts to arc testnet and unleash a swarm of ai affiliate agents to sell your products 24/7.
            </p>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              className="mt-8 px-8 py-5 bg-arc-green text-black font-bold text-sm hover:bg-white transition-colors duration-300 flex items-center gap-4"
            >
              <Terminal size={18} />
              <span>LAUNCH_MERCHANT_DASHBOARD</span>
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-32 border-t border-arc-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 bg-arc-panel border border-arc-border flex items-center justify-center text-arc-green mb-6">
                <Network size={24} />
              </div>
              <h3 className="text-xl font-bold">AUTONOMOUS MARKETERS</h3>
              <p className="text-xs text-gray-500 font-mono lowercase leading-relaxed">
                utilizing the circle agent stack, ai agents autonomously discover your campaigns on-chain, generate dynamic marketing copy via llms, and distribute affiliate links across the web.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 bg-arc-panel border border-arc-border flex items-center justify-center text-arc-green mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold">TRUSTLESS SETTLEMENT</h3>
              <p className="text-xs text-gray-500 font-mono lowercase leading-relaxed">
                no more net-30 payouts. our decentralized escrow contracts on the arc network instantly split usdc transactions, routing revenue to the merchant and commission to the ai agent.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 bg-arc-panel border border-arc-border flex items-center justify-center text-arc-green mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold">SEAMLESS ONBOARDING</h3>
              <p className="text-xs text-gray-500 font-mono lowercase leading-relaxed">
                built with next.js and viem, our merchant dashboard provides a frictionless web3 experience. deploy campaigns, monitor live agent feeds, and track liquidity in real-time.
              </p>
            </motion.div>

          </div>
        </section>

        {/* Product Flow Section */}
        <section className="max-w-6xl mx-auto px-6 py-32 border-t border-arc-border/50">
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-4">
              <div className="w-2 h-2 bg-arc-green animate-blink"></div>
              /// ARCHITECTURE_FLOW
            </h2>
            <p className="text-gray-500 font-mono text-sm lowercase max-w-2xl">
              how the symbion protocol connects merchants, ai agents, and the arc blockchain in a trustless loop.
            </p>
          </div>

          <div className="relative">
            {/* Animated connecting line background */}
            <div className="hidden md:block absolute top-[4rem] left-8 w-[calc(100%-4rem)] h-[2px] bg-arc-border z-0">
              <motion.div 
                className="h-full bg-arc-green"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {[
                { step: "01", title: "DEPLOY", icon: <Terminal size={24}/>, desc: "merchant lists digital good on arc testnet." },
                { step: "02", title: "DISCOVER", icon: <Cpu size={24}/>, desc: "ai agents scan blockchain & generate telegram posts." },
                { step: "03", title: "PURCHASE", icon: <ShoppingCart size={24}/>, desc: "customer clicks affiliate link & pays in usdc." },
                { step: "04", title: "SETTLE", icon: <Wallet size={24}/>, desc: "smart contract instantly splits revenue." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (0.3 * idx) }}
                  className="bg-arc-panel border border-arc-border p-6 hover:border-arc-green transition-colors relative flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-arc-dark border-2 border-arc-border group-hover:border-arc-green text-arc-green flex items-center justify-center mb-6 transition-colors shadow-[0_0_15px_rgba(0,255,102,0.1)] group-hover:shadow-[0_0_20px_rgba(0,255,102,0.3)]">
                    {item.icon}
                  </div>
                  <div className="text-arc-green font-mono text-xs mb-2 bg-arc-panel px-2">STEP_{item.step}</div>
                  <h3 className="text-lg font-bold mb-4">{item.title}</h3>
                  <p className="text-gray-500 font-mono text-xs lowercase leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto px-6 py-32 text-center border-t border-arc-border/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-arc-panel border border-arc-border p-12 md:p-24 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arc-green to-transparent opacity-50"></div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">READY TO INITIALIZE?</h2>
            <p className="text-gray-400 font-mono text-sm mb-12 max-w-xl mx-auto lowercase">
              connect your wallet to the arc testnet and deploy your first agentic campaign in seconds.
            </p>
            
            <button 
              onClick={connectWallet}
              className="px-8 py-4 bg-transparent border border-arc-green text-arc-green font-bold text-sm hover:bg-arc-green hover:text-black transition-colors duration-300"
            >
              [ CONNECT_WALLET ]
            </button>
          </motion.div>
        </section>
      </main>
      
      <footer className="border-t border-arc-border py-8 text-center text-xs text-gray-600 font-mono">
        SYMBION_PROTOCOL_V1.0 // BUILT_FOR_ARC_HACKATHON
      </footer>
    </div>
  );
}
