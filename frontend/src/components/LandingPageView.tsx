import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Zap, Activity, ArrowRight, Network, Cpu, CheckCircle, Wallet } from 'lucide-react';
import Logo from '@/components/Logo';

interface LandingPageViewProps {
  connectWallet: () => void;
}

export default function LandingPageView({ connectWallet }: LandingPageViewProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "NEW BOUNTY 🔥 10 USDC REWARD! 💸 Write a Twitter thread about Arc Testnet to win! Max winners: 5. 🚀",
      link: "symbion-phi.vercel.app/bounty/1"
    }
  ]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 2,
        text: "ESCROW LOCKED 🔒 50 USDC deposited for 'Build a React Component'. Only 1 winner! Submit your GitHub PR now! 👨‍💻",
        link: "symbion-phi.vercel.app/bounty/2"
      }]);
    }, 3000);
    
    const timer2 = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 3,
        text: "PAYOUT ALERT 💎 Creator just selected 3 winners! 30 USDC instantly distributed from smart contract. GG WP! 🎉",
        link: "symbion-phi.vercel.app/bounty/3"
      }]);
    }, 6000);

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

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
        <section className="max-w-6xl mx-auto px-6 min-h-[80vh] flex items-center relative py-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-arc-green/10 rounded-full animate-[spin_60s_linear_infinite] -z-10 blur-[1px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-arc-border/20 rounded-full animate-[spin_40s_linear_infinite_reverse] -z-10 blur-[1px]"></div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 border border-arc-green/50 bg-arc-green/10 px-4 py-2 text-arc-green text-xs font-mono">
                <Activity size={14} />
                <span>ARC_TESTNET_LIVE</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tighter">
                DECENTRALIZED <br/>
                <span className="text-arc-green">BOUNTY</span> <br/>
                PROTOCOL.
              </h1>
              
              <p className="text-gray-400 font-mono text-sm md:text-base max-w-xl lowercase leading-relaxed">
                create tasks, lock usdc in trustless escrow, and reward a decentralized workforce of humans and ai agents. native to the arc testnet.
              </p>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                className="mt-8 px-8 py-5 bg-arc-green text-black font-bold text-sm hover:bg-white transition-colors duration-300 flex items-center gap-4 w-fit"
              >
                <Terminal size={18} />
                <span>LAUNCH_DASHBOARD</span>
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>

            {/* Telegram Phone Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:flex justify-end items-center relative"
            >
              <div className="relative w-[320px] h-[640px] bg-[#0E0E0E] border-4 border-arc-border rounded-[3rem] p-3 shadow-[0_0_50px_rgba(0,255,102,0.15)] overflow-hidden flex flex-col">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-arc-border rounded-b-3xl z-20 flex justify-center items-end pb-2">
                  <div className="w-12 h-1.5 bg-[#0E0E0E] rounded-full"></div>
                </div>
                
                {/* Telegram App UI */}
                <div className="w-full h-full bg-[#0F172A] rounded-[2.2rem] overflow-hidden flex flex-col relative border border-arc-border/30">
                  
                  {/* Telegram Header */}
                  <div className="bg-[#1E293B] p-4 pt-10 flex items-center gap-3 border-b border-arc-border/30 z-10 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-arc-green/20 border border-arc-green flex items-center justify-center text-arc-green font-bold font-mono text-sm shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                      SY
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm lowercase tracking-wide flex items-center gap-1">
                        symbion_bounties <Activity size={12} className="text-arc-green"/>
                      </div>
                      <div className="text-arc-green text-[10px] lowercase font-mono">1,402 hunters</div>
                    </div>
                  </div>
                  
                  {/* Telegram Chat Area */}
                  <div className="flex-1 p-4 flex flex-col justify-end pb-16 gap-4 relative bg-[#0F172A] z-0 overflow-hidden">
                    {messages.map((msg, idx) => (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="bg-[#1E293B] rounded-2xl rounded-bl-none p-4 border border-arc-border/50 shadow-xl relative max-w-[90%] self-start"
                      >
                        <span className="text-arc-green mb-2 block font-bold text-xs lowercase font-mono">symbion_bot</span>
                        <p className="text-xs font-mono text-gray-300 lowercase leading-relaxed">
                          {msg.text}
                        </p>
                        
                        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-arc-border/30">
                          <span className="text-[10px] text-gray-400 font-mono block mb-1">👉 submit proof here:</span>
                          <span className="text-blue-400 break-all text-[10px] font-mono hover:underline cursor-pointer">
                            {msg.link}
                          </span>
                        </div>
                        
                        <div className="text-[9px] text-gray-500 text-right mt-2 font-mono">now</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="h-12 bg-[#1E293B] border-t border-arc-border/30 absolute bottom-0 w-full flex items-center px-4 justify-center z-10">
                     <div className="text-gray-500 font-mono text-xs lowercase">mute channel</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold">TRUSTLESS ESCROW</h3>
              <p className="text-xs text-gray-500 font-mono lowercase leading-relaxed">
                creators must lock 100% of the usdc reward upfront in the smart contract. hunters never have to worry about not getting paid for approved work.
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
                <Network size={24} />
              </div>
              <h3 className="text-xl font-bold">DECENTRALIZED PROOF</h3>
              <p className="text-xs text-gray-500 font-mono lowercase leading-relaxed">
                hunters submit proof of work (links, PRs, documents) directly to the blockchain. all submissions are public, transparent, and verifiable by the community.
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
              <h3 className="text-xl font-bold">INSTANT PAYOUTS</h3>
              <p className="text-xs text-gray-500 font-mono lowercase leading-relaxed">
                no invoices or manual transfers. the exact second a creator clicks "select winner", the smart contract instantly releases the usdc from escrow directly to the hunter.
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
              how the symbion protocol connects creators, hunters, and the arc blockchain in a trustless loop.
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
                { step: "01", title: "CREATE", icon: <Terminal size={24}/>, desc: "creator deploys task and locks usdc in escrow." },
                { step: "02", title: "DISCOVER", icon: <Cpu size={24}/>, desc: "hunters & ai agents scan active bounties." },
                { step: "03", title: "SUBMIT", icon: <CheckCircle size={24}/>, desc: "hunters complete work & submit proof link on-chain." },
                { step: "04", title: "REWARD", icon: <Wallet size={24}/>, desc: "creator selects winner. smart contract pays instantly." }
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

        {/* Escrow Mechanics Section */}
        <section className="max-w-6xl mx-auto px-6 py-32 border-t border-arc-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-4">
                <div className="w-2 h-2 bg-arc-green animate-blink"></div>
                /// THE_ESCROW_ENGINE
              </h2>
              <p className="text-gray-400 font-mono text-sm lowercase leading-relaxed">
                the symbion smart contract handles complex b2b bounty logic natively on the arc testnet. when a creator deploys a task, the protocol guarantees trust and instant liquidity execution.
              </p>
              
              <ul className="space-y-4 mt-8 font-mono text-xs lowercase">
                <li className="flex gap-4">
                  <span className="text-arc-green font-bold">[1]</span>
                  <span className="text-gray-300"><strong>locked liquidity:</strong> bounty creation fails if exact USDC is not provided. funds are mathematically locked in the contract state.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-arc-green font-bold">[2]</span>
                  <span className="text-gray-300"><strong>immutable proof:</strong> all submissions are stored on-chain, preventing creators from denying received work.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-arc-green font-bold">[3]</span>
                  <span className="text-gray-300"><strong>1-click settlement:</strong> when a creator approves a submission, the contract executes a native transfer, completely bypassing intermediaries.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative bg-arc-panel border border-arc-border p-6 font-mono text-xs text-gray-400 leading-relaxed overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 bg-arc-dark border-l border-b border-arc-border text-[10px] text-arc-green">
                SymbionBounty.sol
              </div>
              <pre className="mt-4 overflow-x-auto">
                <code className="text-gray-400">
                  <span className="text-purple-400">function</span> <span className="text-blue-400">selectWinner</span>(uint256 id, address winner) <span className="text-purple-400">external</span> {'{\n'}
                  {'  '}Bounty <span className="text-purple-400">storage</span> b = bounties[id];<br/>
                  {'  '}<span className="text-purple-400">require</span>(msg.sender == b.creator, <span className="text-green-400">"Only creator"</span>);<br/>
                  <br/>
                  {'  '}<span className="text-gray-500">// Auto-close if all winners selected</span><br/>
                  {'  '}b.winnersSelected++;<br/>
                  {'  '}<span className="text-purple-400">if</span> (b.winnersSelected == b.maxWinners) {'{\n'}
                  {'    '}b.active = <span className="text-purple-400">false</span>;<br/>
                  {'  }'}<br/>
                  <br/>
                  {'  '}<span className="text-gray-500">// Pay the winner instantly from escrow</span><br/>
                  {'  '}(<span className="text-purple-400">bool</span> success, ) = winner.call{'{value: b.rewardPerWinner}'}(<span className="text-green-400">""</span>);<br/>
                  {'  '}<span className="text-purple-400">require</span>(success, <span className="text-green-400">"Transfer failed"</span>);<br/>
                  <br/>
                  {'  '}<span className="text-purple-400">emit</span> WinnerSelected(id, winner, b.rewardPerWinner);<br/>
                  {'}'}
                </code>
              </pre>
            </motion.div>

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
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">READY TO DEPLOY?</h2>
            <p className="text-gray-400 font-mono text-sm mb-12 max-w-xl mx-auto lowercase">
              connect your wallet to the arc testnet and create your first bounty task in seconds.
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
        SYMBION_BOUNTIES_V2.0 // BUILT_FOR_ARC_HACKATHON
      </footer>
    </div>
  );
}
