"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Link as LinkIcon, Trophy, Shield } from 'lucide-react';
import { createWalletClient, custom, createPublicClient, http, formatUnits } from 'viem';
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

let isFetchingBounty = false;

export default function BountyPage() {
  const { id } = useParams();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicClient, setPublicClient] = useState<any>(null);
  
  const [bounty, setBounty] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [proofLink, setProofLink] = useState("");
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

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
    if (publicClient && id) {
      fetchBountyDetails();
    }
  }, [publicClient, id, walletAddress]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(address);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4CEF52' }],
        });
      } catch (error) {
        setNotification({ message: "WALLET_CONNECTION_FAILED", type: 'error' });
      }
    }
  };

  const fetchBountyDetails = async () => {
    if (isFetchingBounty) return;
    isFetchingBounty = true;
    
    try {
      const data = await publicClient.readContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'bounties',
        args: [BigInt(id as string)]
      });

      setBounty({
        id: Number(data[0]),
        creator: data[1],
        name: data[2],
        description: data[3],
        totalReward: data[4],
        rewardPerWinner: formatUnits(data[5], 18),
        maxWinners: Number(data[6]),
        winnersSelected: Number(data[7]),
        active: data[8]
      });

      // Arc Testnet RPC has highly aggressive rate limits (max 1 req/sec)
      // Adding a 1-second delay between these two readContract calls to prevent HTTP 429 Error
      await new Promise(resolve => setTimeout(resolve, 1000));

      const subs = await publicClient.readContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'getSubmissions',
        args: [BigInt(id as string)]
      });
      setSubmissions(subs);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingBounty = false;
    }
  };

  const submitProof = async () => {
    if (!walletAddress) return connectWallet();
    if (!proofLink.startsWith("http")) {
      setNotification({ message: "INVALID_URL_FORMAT", type: 'error' });
      return;
    }
    
    setActionLoading(true);
    try {
      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: arcTestnet,
        transport: custom(window.ethereum)
      });
      
      const hash = await walletClient.writeContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'submitWork',
        args: [BigInt(id as string), proofLink]
      });

      setNotification({ message: `PROOF_SUBMITTED // TX: ${hash}`, type: 'success' });
      setProofLink("");
      setTimeout(fetchBountyDetails, 3000);
    } catch (error: any) {
      console.error(error);
      setNotification({ message: error.shortMessage || "SUBMISSION_FAILED", type: 'error' });
    }
    setActionLoading(false);
  };

  const selectWinner = async (winnerAddress: string) => {
    setActionLoading(true);
    try {
      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: arcTestnet,
        transport: custom(window.ethereum)
      });
      
      const hash = await walletClient.writeContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'selectWinner',
        args: [BigInt(id as string), winnerAddress]
      });

      setNotification({ message: `WINNER_SELECTED // PAYOUT_TRIGGERED // TX: ${hash}`, type: 'success' });
      setTimeout(fetchBountyDetails, 3000);
    } catch (error: any) {
      console.error(error);
      setNotification({ message: error.shortMessage || "SELECTION_FAILED", type: 'error' });
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-arc-dark flex items-center justify-center text-arc-green">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!bounty || bounty.id === 0) {
    return (
      <div className="min-h-screen bg-arc-dark text-white flex items-center justify-center font-sans tracking-widest uppercase">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl mb-4">BOUNTY_NOT_FOUND</h1>
          <Link href="/" className="text-arc-green border-b border-arc-green pb-1 hover:text-white">RETURN_TO_DASHBOARD</Link>
        </div>
      </div>
    );
  }

  const isCreator = walletAddress?.toLowerCase() === bounty.creator.toLowerCase();
  const hasSubmitted = submissions.some(s => s.submitter.toLowerCase() === walletAddress?.toLowerCase());

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
              notification.type === 'success' ? 'bg-arc-panel border-arc-green text-arc-green' : 'bg-arc-panel border-red-500 text-red-500'
            }`}
          >
            <Terminal size={18} />
            <span className="font-mono text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex justify-between items-center border-b border-arc-border pb-6 mb-12">
        <div className="flex items-center gap-4">
          <Logo className="w-8 h-8 text-arc-green" />
          <h1 className="text-2xl md:text-4xl font-bold tracking-[0.2em] text-white">
            SYMBION<span className="text-arc-green">_</span>
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-widest">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors pb-1">DASHBOARD</Link>
          <Link href="/bounties" className="text-gray-400 hover:text-white transition-colors pb-1">ACTIVE_BOUNTY_TASKS</Link>
        </div>

        <div className="flex gap-4">
          <button onClick={walletAddress ? () => setWalletAddress(null) : connectWallet} className="group relative px-6 py-3 bg-transparent border border-arc-border hover:border-arc-green transition-colors overflow-hidden">
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

      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Col: Bounty Details */}
        <div className="flex flex-col gap-6">
          <div className="border border-arc-border bg-arc-panel p-8">
            <h2 className="text-arc-green text-xs mb-2">/// TASK_DETAILS</h2>
            <h1 className="text-3xl font-bold mb-6 text-white">{bounty.name}</h1>
            
            <div className="bg-black/30 p-4 border-l-2 border-arc-green mb-8">
              <p className="text-sm font-mono normal-case text-gray-300 leading-relaxed">
                {bounty.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm font-mono">
              <div className="border border-arc-border p-4 bg-arc-dark">
                <div className="text-gray-500 text-xs mb-1">REWARD</div>
                <div className="text-xl font-bold text-arc-green">{bounty.rewardPerWinner} USDC</div>
              </div>
              <div className="border border-arc-border p-4 bg-arc-dark">
                <div className="text-gray-500 text-xs mb-1">WINNERS</div>
                <div className="text-xl font-bold text-white">{bounty.winnersSelected} / {bounty.maxWinners}</div>
              </div>
              <div className="border border-arc-border p-4 bg-arc-dark">
                <div className="text-gray-500 text-xs mb-1">SUBMISSIONS</div>
                <div className="text-xl font-bold text-white">{submissions.length}</div>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-500 flex justify-between border-t border-arc-border pt-4">
              <span>STATUS: <span className={bounty.active ? "text-arc-green" : "text-red-500"}>{bounty.active ? "ACTIVE" : "CLOSED"}</span></span>
              <span>CREATOR: {bounty.creator.slice(0,6)}...</span>
            </div>
          </div>
        </div>

        {/* Right Col: Action Panel */}
        <div className="flex flex-col gap-6">
          <div className="border border-arc-border bg-arc-panel p-8">
            {isCreator ? (
              // ADMIN PANEL
              <div>
                <h2 className="text-arc-green text-xs mb-6 flex items-center gap-2">
                  <Shield size={14} /> /// REVIEW_SUBMISSIONS
                </h2>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm border border-arc-border border-dashed">
                    NO_SUBMISSIONS_YET
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub, idx) => (
                      <div key={idx} className={`p-4 border ${sub.isWinner ? 'border-arc-green bg-arc-green/10' : 'border-arc-border bg-arc-dark'} flex flex-col gap-3`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-mono">{sub.submitter.slice(0,10)}...</span>
                          {sub.isWinner && <span className="text-arc-green flex items-center gap-1"><Trophy size={12}/> WINNER</span>}
                        </div>
                        <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-2 normal-case font-mono break-all">
                          <LinkIcon size={14}/> {sub.proofUrl}
                        </a>
                        
                        {!sub.isWinner && bounty.active && bounty.winnersSelected < bounty.maxWinners && (
                          <button 
                            onClick={() => selectWinner(sub.submitter)}
                            disabled={actionLoading}
                            className="mt-2 py-2 w-full border border-arc-green text-arc-green hover:bg-arc-green hover:text-black transition-colors text-xs font-bold"
                          >
                            SELECT_AS_WINNER & PAY
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // HUNTER PANEL
              <div>
                <h2 className="text-arc-green text-xs mb-6 flex items-center gap-2">
                  <Terminal size={14} /> /// SUBMIT_PROOF
                </h2>
                
                {!bounty.active ? (
                  <div className="bg-red-500/10 border border-red-500 p-6 text-center text-red-500 text-sm">
                    THIS_BOUNTY_IS_CLOSED
                  </div>
                ) : hasSubmitted ? (
                  <div className="bg-arc-green/10 border border-arc-green p-6 text-center text-arc-green text-sm flex flex-col items-center gap-3">
                    <CheckCircle2 size={24} />
                    PROOF_SUBMITTED_SUCCESSFULLY
                    <span className="text-gray-400 text-xs mt-2">WAITING_FOR_CREATOR_REVIEW</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 font-mono normal-case mb-4">
                      Paste the public URL to your completed work (e.g. Twitter link, GitHub PR, Google Doc).
                    </p>
                    <input 
                      type="url" 
                      value={proofLink}
                      onChange={(e) => setProofLink(e.target.value)}
                      className="w-full bg-arc-dark border border-arc-border p-4 text-white font-mono normal-case focus:border-arc-green outline-none transition-colors"
                      placeholder="https://x.com/..."
                    />
                    <button 
                      onClick={submitProof}
                      disabled={actionLoading || !proofLink}
                      className="w-full py-4 bg-white text-black font-bold hover:bg-arc-green transition-colors duration-300 disabled:opacity-50 mt-2"
                    >
                      {actionLoading ? "SUBMITTING..." : (walletAddress ? "SUBMIT_PROOF_URL" : "CONNECT_WALLET_TO_SUBMIT")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
