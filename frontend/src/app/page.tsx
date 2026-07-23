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

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [totalDisbursed, setTotalDisbursed] = useState("0.00");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [publicClient, setPublicClient] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [agentFeed, setAgentFeed] = useState<any[]>([]);
  const [campaignFilter, setCampaignFilter] = useState<'ALL' | 'MINE'>('ALL');

  useEffect(() => {
    setPublicClient(createPublicClient({ chain: arcTestnet, transport: http() }));
  }, []);

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
        
        fetchData();
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
    if (!publicClient) return;
    try {
      const balance = await publicClient.getBalance({ address: SYMBION_ADDRESS });
      setTotalDisbursed(formatUnits(balance, 18));
      
      const activeCamps = await publicClient.readContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'getActiveCampaigns'
      });
      
      const fetched = activeCamps.map((camp: any) => ({
        id: Number(camp.id),
        merchant: camp.merchant,
        name: camp.name,
        price: formatUnits(camp.price, 18),
        commission: Number(camp.commissionBps) / 100
      }));
      setCampaignsList(fetched);

      // Fetch Purchase Events (Arc Testnet RPC limit is 10k blocks per request)
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) : BigInt(0);

      const logs = await publicClient.getLogs({
        address: SYMBION_ADDRESS,
        event: parseAbiItem('event PurchaseMade(uint256 indexed campaignId, address indexed buyer, address indexed affiliate, uint256 merchantAmount, uint256 affiliateAmount)'),
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
      
      const validLogs = logs.filter((log: any) => log.args.affiliate !== '0x0000000000000000000000000000000000000000');
      
      const feed = validLogs.map((log: any) => ({
        hash: log.transactionHash,
        agent: log.args.affiliate,
        amount: formatUnits(log.args.affiliateAmount, 18),
        status: 'SETTLED'
      })).reverse().slice(0, 5); // get last 5
      
      setAgentFeed(feed);

    } catch (error) {
      console.error("Fetch Data Error:", error);
    }
  };

  const deployCampaign = async () => {
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
      
      const priceWei = parseUnits(price, 18);
      const commissionBps = BigInt(parseFloat(commission) * 100); // 10% = 1000 bps

      const hash = await walletClient.writeContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'createCampaign',
        args: [campaignName || "Untitled Campaign", priceWei, commissionBps]
      });

      console.log("Tx Hash:", hash);
      setNotification({ message: `CAMPAIGN_DEPLOYED // TX: ${hash}`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
      setIsModalOpen(false);
      setPrice("");
      setCommission("");
      setCampaignName("");
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
      <header className="flex justify-between items-center border-b border-arc-border pb-6 mb-12 relative z-10">
        <div className="flex items-center gap-4">
          <Logo className="w-8 h-8 text-arc-green" />
          <h1 className="text-2xl md:text-4xl font-bold tracking-[0.2em] text-white">
            SYMBION<span className="text-arc-green">_</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
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
                Initialize a new smart contract campaign. Allocate USDC to autonomous agents to drive on-chain conversions.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 bg-white text-black font-bold hover:bg-arc-green transition-colors duration-300 flex items-center justify-center gap-3"
              >
                <Terminal size={18} />
                <span>DEPLOY_CAMPAIGN</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "POOL_LIQUIDITY", value: totalDisbursed, icon: <Database size={16}/> },
              { label: "SECURE_TRANSACTIONS", value: "89,104", icon: <Shield size={16}/> },
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
              <h2 className="text-arc-green text-xs">/// LIVE_AGENT_FEED</h2>
              <div className="w-2 h-2 bg-arc-green animate-blink"></div>
            </div>
            
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 border-b border-arc-border">
                <tr>
                  <th className="pb-4 font-normal">TX_HASH</th>
                  <th className="pb-4 font-normal">AGENT_ID</th>
                  <th className="pb-4 font-normal text-right">COMMISSION (USDC)</th>
                  <th className="pb-4 font-normal text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="font-mono normal-case">
                {agentFeed.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-gray-500 text-center">NO_TRANSACTIONS_YET</td></tr>
                ) : agentFeed.map((row, idx) => (
                  <tr key={idx} className="border-b border-arc-border/30 hover:bg-white/5 transition-colors duration-200">
                    <td className="py-4 text-arc-green">
                      <a href={`https://testnet.arcscan.app/tx/${row.hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        {row.hash.slice(0, 10)}...{row.hash.slice(-6)}
                      </a>
                    </td>
                    <td className="py-4 text-gray-400">
                      {row.agent.slice(0, 6)}...{row.agent.slice(-4)}
                    </td>
                    <td className="py-4 text-right font-bold text-white">+ {row.amount}</td>
                    <td className={`py-4 text-right ${row.status === 'SETTLED' ? 'text-white' : 'text-yellow-500'}`}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Deployed Campaigns */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="border border-arc-border bg-arc-panel p-6 flex-grow overflow-x-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-arc-green text-xs">/// ACTIVE_CAMPAIGNS</h2>
              <div className="flex gap-4 text-xs font-mono">
                <button 
                  onClick={() => setCampaignFilter('ALL')} 
                  className={`${campaignFilter === 'ALL' ? 'text-arc-green border-b border-arc-green' : 'text-gray-500 hover:text-white'} transition-colors pb-1`}
                >
                  [ ALL ]
                </button>
                <button 
                  onClick={() => setCampaignFilter('MINE')} 
                  className={`${campaignFilter === 'MINE' ? 'text-arc-green border-b border-arc-green' : 'text-gray-500 hover:text-white'} transition-colors pb-1`}
                >
                  [ MINE ]
                </button>
              </div>
            </div>
            
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 border-b border-arc-border">
                <tr>
                  <th className="pb-4 font-normal">ID</th>
                  <th className="pb-4 font-normal">NAME</th>
                  <th className="pb-4 font-normal">PRICE (USDC)</th>
                  <th className="pb-4 font-normal text-right">COMMISSION</th>
                  <th className="pb-4 font-normal text-right">AGENT_REF_LINK</th>
                </tr>
              </thead>
              <tbody className="font-mono normal-case text-xs">
                {(campaignFilter === 'MINE' && walletAddress 
                  ? campaignsList.filter(c => c.merchant.toLowerCase() === walletAddress.toLowerCase()) 
                  : (walletAddress ? campaignsList.filter(c => c.merchant.toLowerCase() !== walletAddress.toLowerCase()) : campaignsList)
                ).length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-gray-500 text-center">NO_CAMPAIGNS_FOUND</td></tr>
                ) : (campaignFilter === 'MINE' && walletAddress 
                  ? campaignsList.filter(c => c.merchant.toLowerCase() === walletAddress.toLowerCase()) 
                  : (walletAddress ? campaignsList.filter(c => c.merchant.toLowerCase() !== walletAddress.toLowerCase()) : campaignsList)
                ).map((camp, idx) => (
                  <tr key={idx} className="border-b border-arc-border/30 hover:bg-white/5 transition-colors duration-200">
                    <td className="py-4 text-white">#{camp.id}</td>
                    <td className="py-4 text-arc-green">
                      <Link href={`/buy/${camp.id}?ref=${walletAddress || '0x0000000000000000000000000000000000000000'}`} target="_blank" className="hover:text-white transition-colors underline decoration-arc-green/30 underline-offset-4">
                        {camp.name}
                      </Link>
                    </td>
                    <td className="py-4 text-gray-400">{camp.price}</td>
                    <td className="py-4 text-right font-bold text-white">{camp.commission}%</td>
                    <td className="py-4 text-right text-gray-500 flex items-center justify-end gap-2">
                      <span className="truncate max-w-[150px]">
                        {typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/buy/{camp.id}?ref=[AGENT]
                      </span>
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}/buy/${camp.id}?ref=${walletAddress || '0x0000000000000000000000000000000000000000'}`;
                          navigator.clipboard.writeText(link);
                          setNotification({ message: 'AFFILIATE_LINK_COPIED_TO_CLIPBOARD', type: 'info' });
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="text-arc-border hover:text-white transition-colors p-1"
                      >
                        <Copy size={14} />
                      </button>
                    </td>
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
                DEPLOY_CAMPAIGN
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">CAMPAIGN NAME</label>
                  <input 
                    type="text" 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                    placeholder="e.g. DevPro API"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">PRODUCT SECURE URL (DELIVERED ON PURCHASE)</label>
                  <div className="w-full bg-arc-dark/50 border border-arc-border border-dashed p-3 text-gray-500 font-mono text-sm cursor-not-allowed">
                    [ PRODUCTION_FEATURE_LOCKED ]
                  </div>
                  <div className="text-xs text-gray-500 mt-2 lowercase">
                    (In a production environment, this would be your secure download link, API key, or course access token)
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">PRODUCT PRICE (USDC)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                    placeholder="5.00"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-2">AGENT COMMISSION (%)</label>
                  <input 
                    type="number" 
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="w-full bg-arc-dark border border-arc-border p-3 text-white font-mono focus:border-arc-green outline-none transition-colors"
                    placeholder="15"
                  />
                </div>

                <button 
                  onClick={deployCampaign}
                  disabled={deploying}
                  className="w-full py-4 bg-arc-green text-black font-bold hover:bg-white transition-colors duration-300 mt-4 disabled:opacity-50"
                >
                  {deploying ? "EXECUTING_TRANSACTION..." : "SIGN_AND_DEPLOY"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 pt-6 border-t border-arc-border flex justify-between text-xs text-gray-500 relative z-10">
        <div>SYMBION_PROTOCOL_V1.0</div>
        <div>ARC_TESTNET_ENABLED</div>
      </footer>
    </div>
  );
}
