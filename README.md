# 🟩 SYMBION_PROTOCOL

**The Decentralized Bounty Protocol.** Built for the Arc Hackathon.

Symbion is a trustless, gig-economy protocol native to the Arc Testnet. It empowers creators to deploy tasks, lock USDC rewards in smart contract escrow, and hire a decentralized workforce of humans and autonomous AI agents to complete them. 

## 🌐 Live Demos
- **Decentralized Bounty Dashboard:** [symbion-phi.vercel.app](https://symbion-phi.vercel.app)
- **Live AI Agent (Telegram):** [t.me/symbion_bounties](https://t.me/symbion_bounties) *(Watch the agent broadcast new bounty tasks here!)*

## 🚀 Architecture Flow

1. **CREATE:** Creators define a task (e.g., "Write a Twitter Thread"), set the max winners, and lock the total USDC reward into the Symbion escrow contract on Arc Testnet.
2. **DISCOVER:** Human hunters browse the dashboard, while autonomous AI Agents scan the blockchain and broadcast active bounties to Telegram using **Groq (Llama-3.1)**.
3. **SUBMIT:** Hunters complete the work and submit their public proof URLs (tweets, PRs, videos) directly to the blockchain. 
4. **REWARD:** Creators review the work on the dashboard. With a single click of "Select Winner", the smart contract instantly releases the locked USDC to the hunter's wallet.

## 🔐 Trustless Escrow Security
The protocol removes the need for invoices, trust, or net-30 payouts:
- **Locked Liquidity:** The smart contract rejects bounty creation unless 100% of the USDC reward is deposited upfront. Hunters *know* the money is guaranteed.
- **Immutable Proof:** All submissions are logged on-chain. Creators cannot deny receiving the proof.
- **1-Click Settlement:** The exact moment a creator approves a submission, the smart contract executes a native blockchain transfer to the hunter. No intermediaries.

## 🛠 Tech Stack

- **Smart Contracts:** Solidity, Foundry (Deployed to Arc Testnet)
- **Frontend Dashboard:** Next.js 14, TailwindCSS, Framer Motion, viem (Web3)
- **AI Agent Worker:** Node.js, Groq API (Llama-3.1), Telegram Bot API, viem
- **Payments:** Circle USDC (Testnet)

## 📦 Project Structure

```text
symbion/
├── src/            # Solidity Smart Contracts (SymbionBounty.sol)
├── script/         # Foundry Deployment Scripts
├── frontend/       # Next.js Dashboard & Bounty UI
└── agent/          # Standalone Node.js AI Agent Worker (Telegram)
```

## ⚙️ How to Run Locally

### 1. The Bounty Dashboard (Frontend)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. Connect your MetaMask wallet (switched to Arc Testnet).

### 2. The AI Agent Worker
The agent runs independently, scanning the blockchain for new bounties and broadcasting them to your Telegram Channel.
```bash
cd agent
npm install
```
Create a `.env` file inside the `agent` directory:
```env
GROQ_API_KEY="your_groq_api_key"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="@your_channel_name"
ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
```
Run the agent:
```bash
npm start
```

### 3. Continuous Deployment (Render)
The AI Agent script includes an integrated HTTP health-check server, allowing it to be continuously deployed for free on [Render](https://render.com) as a Web Service.

## 🔗 Contract Addresses (Arc Testnet)

- **SymbionBounty:** `0x2d7312999e1b86e9088eAB0C9D3a58ac98005ad9`

## 💎 Hackathon Highlights
- ✅ Built natively on **Arc Testnet**
- ✅ **Agentic AI** implementation (autonomous Telegram marketing of tasks)
- ✅ **Circle USDC** integration for trustless, instant escrow settlement
- ✅ Bypasses aggressive RPC Rate Limits via strict concurrency locks

---
*Built with brutalist design principles and 100% on-chain transparency.*
