"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { createWalletClient, custom, createPublicClient, http, formatUnits, parseUnits } from 'viem';
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

export default function BuyPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const refAddress = searchParams.get('ref') || '0x0000000000000000000000000000000000000000';

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
      const camp = await publicClient.readContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'campaigns',
        args: [BigInt(id as string)]
      }) as any[];

      if (camp[5]) { // active
        setCampaign({
          id: Number(camp[0]),
          merchant: camp[1],
          name: camp[2],
          price: formatUnits(camp[3], 18),
          rawPrice: camp[3],
          commission: Number(camp[4]) / 100
        });
      }
    } catch (error) {
      console.error("Failed to fetch campaign", error);
    }
    setLoading(false);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(address);
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x4CEF52' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{ chainId: '0x4CEF52', chainName: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: ['https://rpc.testnet.arc.network'] }],
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

  const executePurchase = async () => {
    if (!walletAddress || !window.ethereum) {
      setNotification({ message: "CONNECTION_REQUIRED", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setPurchasing(true);
    try {
      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: arcTestnet,
        transport: custom(window.ethereum)
      });
      
      const hash = await walletClient.writeContract({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'purchase',
        args: [BigInt(id as string), refAddress as `0x${string}`],
        value: campaign.rawPrice
      });

      console.log("Tx Hash:", hash);
      setSuccessTx(hash);
      setNotification({ message: `PURCHASE_SUCCESSFUL // TX: ${hash}`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error(error);
      setNotification({ message: "PURCHASE_FAILED // TX_REJECTED", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
    setPurchasing(false);
  };

  return (
    <div className="min-h-screen bg-arc-dark text-white p-4 md:p-8 flex flex-col font-sans uppercase tracking-widest relative">
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

      <header className="flex justify-between items-center border-b border-arc-border pb-6 mb-12 relative z-10">
        <div className="flex items-center gap-4">
          <Logo className="w-8 h-8 text-arc-green" />
          <Link href="/" className="text-2xl md:text-4xl font-bold tracking-[0.2em] text-white hover:text-arc-green transition-colors cursor-pointer">
            SYMBION_CHECKOUT<span className="text-arc-green">_</span>
          </Link>
        </div>
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
      </header>

      <main className="flex-grow flex items-center justify-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-arc-border bg-arc-panel p-8 max-w-lg w-full"
        >
          {loading ? (
            <div className="text-center font-mono text-gray-500 animate-pulse">FETCHING_BLOCKCHAIN_DATA...</div>
          ) : !campaign ? (
            <div className="text-center font-mono text-red-500">CAMPAIGN_NOT_FOUND_OR_INACTIVE</div>
          ) : successTx ? (
             <div className="text-center space-y-6">
                <CheckCircle2 size={48} className="mx-auto text-arc-green" />
                <h2 className="text-2xl font-bold text-white">PURCHASE_VERIFIED</h2>
                <p className="text-sm text-gray-400 font-mono mb-6">
                  Your transaction has been securely settled on the Arc Testnet. 
                  The agent commission and merchant revenue have been instantly distributed.
                </p>

                <div className="bg-arc-dark border border-arc-border p-4 mb-6 text-left space-y-3 font-mono text-xs">
                   <div className="flex justify-between items-center pb-2 border-b border-arc-border/50">
                     <span className="text-gray-500">MERCHANT_REVENUE ({(100 - (campaign.commission * 100)).toFixed(0)}%)</span>
                     <span className="text-white">+ {(parseFloat(campaign.price) * (1 - campaign.commission)).toFixed(2)} USDC</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-500">AGENT_COMMISSION ({(campaign.commission * 100).toFixed(0)}%)</span>
                     <span className="text-arc-green font-bold">+ {(parseFloat(campaign.price) * campaign.commission).toFixed(2)} USDC</span>
                   </div>
                </div>

                <div className="bg-arc-dark border border-arc-green p-4 mb-6 text-left">
                  <div className="text-xs text-arc-green mb-2 flex items-center justify-between">
                    <span>/// PRODUCT_UNLOCKED</span>
                    <Zap size={14} />
                  </div>
                  <div className="text-sm text-white font-mono break-all bg-black p-3 border border-arc-border">
                    LICENSE_KEY: {successTx.slice(2, 10).toUpperCase()}-XXXX-YYYY-ZZZZ
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    (In a production environment, this would be your secure download link, API key, or course access token)
                  </div>
                </div>

                <a 
                  href={`https://testnet.arcscan.app/tx/${successTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-arc-green hover:text-white transition-colors bg-arc-dark border border-arc-border p-3 w-full justify-center"
                >
                  <span className="truncate max-w-[250px]">TX: {successTx}</span>
                  <ExternalLink size={14} />
                </a>
                
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 text-xs text-black bg-arc-green hover:bg-white transition-colors p-3 mt-4 w-full justify-center font-bold"
                >
                  RETURN_TO_DASHBOARD
                </Link>
             </div>
          ) : (
            <>
              <h2 className="text-arc-green text-xs mb-8 flex items-center justify-between">
                <span>/// TRANSACTION_AUTHORIZATION</span>
                <Shield size={14} />
              </h2>
              
              <div className="space-y-6 mb-8 font-mono">
                <div>
                  <div className="text-xs text-gray-500 mb-1">PRODUCT_NAME</div>
                  <div className="text-xl font-bold text-white">{campaign.name}</div>
                </div>
                
                <div className="border-t border-b border-arc-border/30 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">PRICE (USDC)</span>
                    <span className="text-xl font-bold text-arc-green">{campaign.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">NETWORK_FEE</span>
                    <span className="text-xs text-white">~0.00 USDC</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">AFFILIATE_AGENT_ID</div>
                  <div className="text-xs text-gray-400 truncate bg-arc-dark p-2 border border-arc-border">
                    {refAddress}
                  </div>
                </div>
              </div>

              <button 
                onClick={executePurchase}
                disabled={purchasing || !walletAddress}
                className="w-full py-4 bg-arc-green text-black font-bold hover:bg-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Zap size={18} />
                {purchasing ? "EXECUTING_TRANSACTION..." : !walletAddress ? "AWAITING_WALLET_CONNECTION" : "AUTHORIZE_AND_PAY"}
              </button>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
