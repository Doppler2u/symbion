"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Zap, X, Copy, Activity, Database, ExternalLink } from 'lucide-react';
import { createWalletClient, custom, createPublicClient, http, formatUnits, parseUnits, parseAbiItem } from 'viem';
import LandingPageView from '@/components/LandingPageView';
import Logo from '@/components/Logo';
import { defineChain } from 'viem';
import { SYMBION_ADDRESS, SYMBION_ABI } from '@/lib/contracts';

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

// Module-level lock to prevent Next.js Strict Mode from firing duplicate concurrent RPC requests
let isFetchingData = false;

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [totalDisbursed, setTotalDisbursed] = useState("0.00");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Bounty Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPerWinner, setRewardPerWinner] = useState("");
  const [maxWinners, setMaxWinners] = useState("");
  
  const [deploying, setDeploying] = useState(false);
  const [publicClient, setPublicClient] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [bountiesList, setBountiesList] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [bountyFilter, setBountyFilter] = useState<'ALL' | 'MINE'>('ALL');

  useEffect(() => {
    setPublicClient(createPublicClient({ chain: arcTestnet, transport: http() }));
    
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Auto-connect failed:", error);
        }
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    if (publicClient && walletAddress) {
      fetchData();
    }
  }, [publicClient, walletAddress]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(address);
        
        // Switch to Arc Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x4CEF52' }], // 5042002 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x4CEF52',
                chainName: 'Arc Testnet',
                nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
                rpcUrls: ['https://rpc.testnet.arc.network']
              }],
            });
          }
        }
      } catch (error) {
        setNotification({ message: "WALLET_CONNECTION_FAILED", type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    } else {
      setNotification({ message: "NO_WALLET_DETECTED", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setNotification({ message: 'WALLET_DISCONNECTED', type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = async () => {
    if (!publicClient || isFetchingData) return;
    isFetchingData = true;
    
    try {
      const balance = await publicClient.getBalance({ address: SYMBION_ADDRESS });
      setTotalDisbursed(formatUnits(balance, 18));
      
      await new Promise(resolve => setTimeout(resolve, 1200));

      const activeBounties = await publicClient.readContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'getActiveBounties'
      });
      
      const fetched = activeBounties.map((b: any) => ({
        id: Number(b.id),
        creator: b.creator,
        name: b.name,
        rewardPerWinner: formatUnits(b.rewardPerWinner, 18),
        maxWinners: Number(b.maxWinners),
        winnersSelected: Number(b.winnersSelected)
      }));
      setBountiesList(fetched);

      await new Promise(resolve => setTimeout(resolve, 1200));

      // Fetch Winner Selected Events
      const currentBlock = await publicClient.getBlockNumber();
      let collectedLogs: any[] = [];
      let toBlock = currentBlock;
      let maxBatches = 3; 

      while (maxBatches > 0 && collectedLogs.length < 5 && toBlock > BigInt(0)) {
        let fromBlock = toBlock > BigInt(9999) ? toBlock - BigInt(9999) : BigInt(0);
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        try {
          const batchLogs = await publicClient.getLogs({
            address: SYMBION_ADDRESS,
            event: parseAbiItem('event WinnerSelected(uint256 indexed bountyId, address indexed winner, uint256 amountPaid)'),
            fromBlock: fromBlock,
            toBlock: toBlock
          });
          collectedLogs = [...batchLogs, ...collectedLogs];
        } catch(e: any) {
          console.error("Batch log fetch error:", e.message);
          break; 
        }

        toBlock = fromBlock - BigInt(1);
        maxBatches--;
        
        if (maxBatches > 0 && collectedLogs.length < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const feed = collectedLogs.map((log: any) => ({
        hash: log.transactionHash,
        winner: log.args.winner,
        amount: formatUnits(log.args.amountPaid, 18),
        status: 'PAID'
      })).reverse().slice(0, 5); // get last 5
      
      setActivityFeed(feed);

    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      isFetchingData = false;
    }
  };

  const deployBounty = async () => {
    if (!walletAddress || !window.ethereum) {
      setNotification({ message: "CONNECTION_REQUIRED // CONNECT_WALLET_FIRST", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setDeploying(true);
    try {
      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: arcTestnet,
        transport: custom(window.ethereum)
      });
      
      const rewardWei = parseUnits(rewardPerWinner, 18);
      const totalRequired = rewardWei * BigInt(maxWinners);

      const hash = await walletClient.writeContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'createBounty',
        args: [name || "Untitled Bounty", description || "No description provided.", rewardWei, BigInt(maxWinners)],
        value: totalRequired
      });

      console.log("Tx Hash:", hash);
      setNotification({ message: `BOUNTY_CREATED // ESCROW_LOCKED // TX: ${hash}`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setRewardPerWinner("");
      setMaxWinners("");
      setTimeout(fetchData, 3000); // refresh list
    } catch (error) {
      console.error(error);
      setNotification({ message: "DEPLOYMENT_FAILED // TX_REJECTED", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
    setDeploying(false);
  };

  if (!walletAddress) {
    return <LandingPageView connectWallet={connectWallet} />;
  }

  return (
    <div className="min-h-screen bg-arc-dark text-white p-4 md:p-8 flex flex-col font-sans uppercase tracking-widest relative">
      
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 border p-4 shadow-lg flex items-center gap-3 ${
              notification.type === 'success' 
                ? 'bg-arc-panel border-arc-green text-arc-green' 
                : notification.type === 'error'
                ? 'bg-arc-panel border-red-500 text-red-500'
                : 'bg-arc-panel border-white text-white'
            }`}
          >
            <Terminal size={18} />
            <span className="font-mono text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-arc-border pb-6 mb-8 md:mb-12 relative z-10 gap-6 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
          <Logo className="w-8 h-8 text-arc-green" />
          <h1 className="text-2xl md:text-4xl font-bold tracking-[0.2em] text-white">
            SYMBION<span className="text-arc-green">_</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 text-xs md:text-sm font-bold tracking-widest w-full md:w-auto justify-center">
          <Link href="/" className="text-arc-green border-b border-arc-green pb-1">DASHBOARD</Link>
          <Link href="/bounties" className="text-gray-400 hover:text-white transition-colors pb-1">ACTIVE_BOUNTY_TASKS</Link>
        </div>

        <div className="flex gap-4 w-full md:w-auto justify-center md:justify-end">
          <button onClick={walletAddress ? disconnectWallet : connectWallet} className="group relative px-6 py-3 bg-transparent border border-arc-border hover:border-arc-green transition-colors overflow-hidden">
            <span className="relative z-10 text-sm font-bold group-hover:text-black transition-colors">
              {walletAddress ? (
                <>
                  <span className="group-hover:hidden">[ {walletAddress.slice(0,6)}...{walletAddress.slice(-4)} ]</span>
                  <span className="hidden group-hover:inline">DISCONNECT_WALLET</span>
                </>
              ) : "INITIALIZE_CONNECTION"}
            </span>
            <div className="absolute inset-0 w-0 bg-arc-green transition-all duration-300 ease-out group-hover:w-full -z-10"></div>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-arc-border bg-arc-panel p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 text-arc-border"><Activity size={18} /></div>
            <h2 className="text-arc-green text-xs mb-6">/// SYSTEM_STATUS</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-arc-border pb-2">
                <span className="text-gray-500">NETWORK</span>
                <span>ARC_TESTNET</span>
              </div>
              <div className="flex justify-between border-b border-arc-border pb-2">
                <span className="text-gray-500">CONTRACT</span>
                <span className="text-arc-green text-xs mt-1">{SYMBION_ADDRESS.slice(0,8)}...</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">STATUS</span>
                <span className="text-white">ONLINE</span>
              </div>
              <div className="pt-4 mt-2 border-t border-arc-border flex justify-between items-center">
                <span className="text-gray-500 text-xs">NEED_TEST_TOKENS?</span>
                <a 
                  href="https://faucet.circle.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-arc-green text-xs hover:text-white transition-colors flex items-center gap-1 font-bold border border-arc-green px-2 py-1"
                >
                  CIRCLE_FAUCET <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-arc-border bg-arc-panel p-6 flex-grow flex flex-col"
          >
            <h2 className="text-arc-green text-xs mb-6">/// COMMAND_INPUT</h2>
            <div className="flex-grow flex flex-col justify-center gap-6">
              <p className="text-sm text-gray-400 normal-case font-mono">
                Create a new bounty task. USDC will be securely locked in escrow until you approve the winners.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 bg-white text-black font-bold hover:bg-arc-green transition-colors duration-300 flex items-center justify-center gap-3"
              >
                <Terminal size={18} />
                <span>CREATE_BOUNTY_TASK</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "PROTOCOL_ESCROW", value: totalDisbursed, icon: <Database size={16}/> },
              { label: "TASKS_COMPLETED", value: "1,204", icon: <Shield size={16}/> },
              { label: "NETWORK_TPS", value: "4,092", icon: <Zap size={16}/> }
            ].map((metric, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="border border-arc-border p-6 flex flex-col justify-between h-32 hover:border-arc-green transition-colors duration-300"
              >
                <div className="text-gray-500 text-xs flex justify-between items-center">
                  {metric.label}
                  <span className="text-arc-border">{metric.icon}</span>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="border border-arc-border bg-arc-panel p-6 flex-grow overflow-x-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-arc-green text-xs">/// RECENT_PAYOUTS</h2>
              <div className="w-2 h-2 bg-arc-green animate-blink"></div>
            </div>
            
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 border-b border-arc-border">
                <tr>
                  <th className="pb-4 font-normal">TX_HASH</th>
                  <th className="pb-4 font-normal">WINNER_ADDRESS</th>
                  <th className="pb-4 font-normal text-right">REWARD (USDC)</th>
                  <th className="pb-4 font-normal text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="font-mono normal-case">
                {activityFeed.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-gray-500 text-center">NO_TRANSACTIONS_YET</td></tr>
                ) : activityFeed.map((row, idx) => (
                  <tr key={idx} className="border-b border-arc-border/30 hover:bg-white/5 transition-colors duration-200">
                    <td className="py-4 text-arc-green">
                      <a href={`https://testnet.arcscan.app/tx/${row.hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        {row.hash.slice(0, 10)}...{row.hash.slice(-6)}
                      </a>
                    </td>
                    <td className="py-4 text-gray-400">
                      {row.winner.slice(0, 6)}...{row.winner.slice(-4)}
                    </td>
                    <td className="py-4 text-right font-bold text-white">+ {row.amount}</td>
                    <td className={`py-4 text-right ${row.status === 'PAID' ? 'text-white' : 'text-yellow-500'}`}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </main>

      {/* Deploy Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-arc-panel border border-arc-border p-8 max-w-md w-full relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="w-2 h-2 bg-arc-green animate-blink"></div>
                CREATE_BOUNTY_TASK
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">TASK NAME</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                    placeholder="e.g. Write a Twitter Thread"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">TASK DESCRIPTION</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                    placeholder="Must tag @project and use #web3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">REWARD PER WINNER (USDC)</label>
                      <input 
                        type="number" 
                        value={rewardPerWinner}
                        onChange={(e) => setRewardPerWinner(e.target.value)}
                        className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                        placeholder="10.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">MAX WINNERS</label>
                      <input 
                        type="number" 
                        value={maxWinners}
                        onChange={(e) => setMaxWinners(e.target.value)}
                        className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                        placeholder="5"
                      />
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 border border-yellow-500/30 p-3 bg-yellow-500/10">
                    <span className="text-yellow-500">ESCROW LOCK:</span> You will lock a total of <b>{(Number(rewardPerWinner) || 0) * (Number(maxWinners) || 0)} USDC</b> in the smart contract.
                </div>

                <button 
                  onClick={deployBounty}
                  disabled={deploying}
                  className="w-full py-4 bg-arc-green text-black font-bold hover:bg-white transition-colors duration-300 mt-4 disabled:opacity-50"
                >
                  {deploying ? "LOCKING_FUNDS..." : "DEPOSIT_&_CREATE"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 pt-6 border-t border-arc-border flex justify-between text-xs text-gray-500 relative z-10">
        <div>SYMBION_BOUNTIES_V2.0</div>
        <div>ARC_TESTNET_ENABLED</div>
      </footer>
    </div>
  );
}
