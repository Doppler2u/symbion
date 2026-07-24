"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Terminal, Shield, ArrowLeft } from 'lucide-react';
import { createPublicClient, http, formatUnits } from 'viem';
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

let isFetchingBounties = false;

export default function BountiesPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicClient, setPublicClient] = useState<any>(null);
  const [bountiesList, setBountiesList] = useState<any[]>([]);
  const [bountyFilter, setBountyFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPublicClient(createPublicClient({ chain: arcTestnet, transport: http() }));
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {}
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    if (publicClient) {
      fetchBounties();
    }
  }, [publicClient]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(address);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4CEF52' }],
        });
      } catch (error) {}
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const fetchBounties = async () => {
    if (isFetchingBounties) return;
    isFetchingBounties = true;
    
    try {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingBounties = false;
    }
  };

  const filteredBounties = (bountyFilter === 'MINE' && walletAddress 
    ? bountiesList.filter(b => b.creator.toLowerCase() === walletAddress.toLowerCase()) 
    : (walletAddress ? bountiesList.filter(b => b.creator.toLowerCase() !== walletAddress.toLowerCase()) : bountiesList)
  );

  return (
    <div className="min-h-screen bg-arc-dark text-white p-4 md:p-8 flex flex-col font-sans uppercase tracking-widest relative">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-arc-border pb-6 mb-8 md:mb-12 relative z-10 gap-6 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
          <Logo className="w-8 h-8 text-arc-green" />
          <h1 className="text-2xl md:text-4xl font-bold tracking-[0.2em] text-white">
            SYMBION<span className="text-arc-green">_</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 text-xs md:text-sm font-bold tracking-widest w-full md:w-auto justify-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors pb-1">DASHBOARD</Link>
          <Link href="/bounties" className="text-arc-green border-b border-arc-green pb-1">ACTIVE_BOUNTY_TASKS</Link>
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

      <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-arc-border bg-arc-panel p-8 flex-grow overflow-hidden shadow-2xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8 border-b border-arc-border pb-4">
            <h2 className="text-arc-green text-lg font-bold flex items-center gap-3">
              <Terminal size={20} /> /// ALL_ACTIVE_BOUNTY_TASKS
            </h2>
            <div className="flex gap-6 text-sm font-mono">
              <button 
                onClick={() => setBountyFilter('ALL')} 
                className={`${bountyFilter === 'ALL' ? 'text-arc-green border-b border-arc-green' : 'text-gray-500 hover:text-white'} transition-colors pb-1`}
              >
                [ ALL_TASKS ]
              </button>
              <button 
                onClick={() => setBountyFilter('MINE')} 
                className={`${bountyFilter === 'MINE' ? 'text-arc-green border-b border-arc-green' : 'text-gray-500 hover:text-white'} transition-colors pb-1`}
              >
                [ MY_TASKS ]
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-20 text-arc-green animate-pulse">FETCHING_BLOCKCHAIN_DATA...</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-base whitespace-nowrap">
                <thead className="text-gray-500 border-b border-arc-border">
                  <tr>
                    <th className="pb-6 font-normal px-4">TASK_ID</th>
                    <th className="pb-6 font-normal px-4">TASK_NAME</th>
                    <th className="pb-6 font-normal px-4">CREATOR</th>
                    <th className="pb-6 font-normal px-4">REWARD (USDC)</th>
                    <th className="pb-6 font-normal px-4 text-center">WINNERS</th>
                    <th className="pb-6 font-normal px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="font-mono normal-case text-sm">
                  {filteredBounties.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-gray-500 text-center">NO_BOUNTIES_FOUND</td></tr>
                  ) : filteredBounties.map((b, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => router.push(`/bounty/${b.id}`)}
                      className="border-b border-arc-border/30 hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                    >
                      <td className="py-6 px-4 text-white">#{b.id}</td>
                      <td className="py-6 px-4 text-arc-green text-base font-bold">
                        {b.name}
                      </td>
                      <td className="py-6 px-4 text-gray-500">{b.creator.slice(0,8)}...</td>
                      <td className="py-6 px-4 text-gray-300 font-bold">{b.rewardPerWinner} USDC</td>
                      <td className="py-6 px-4 text-center">
                        <span className="bg-arc-dark border border-arc-border px-3 py-1 rounded-full text-xs">
                          {b.winnersSelected} / {b.maxWinners}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right flex items-center justify-end gap-2">
                        <button className="px-6 py-2 border border-arc-green text-arc-green hover:text-black hover:bg-arc-green transition-colors font-bold pointer-events-none">
                          {b.creator.toLowerCase() === walletAddress?.toLowerCase() ? "REVIEW_WORK" : "SUBMIT_PROOF"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="mt-12 pt-6 border-t border-arc-border flex justify-between text-xs text-gray-500 relative z-10">
        <div>SYMBION_BOUNTIES_V2.0</div>
        <div>ARC_TESTNET_ENABLED</div>
      </footer>
    </div>
  );
}
