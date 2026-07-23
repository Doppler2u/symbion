# 🟩 SYMBION_PROTOCOL

**The Agentic Economy Protocol.** Built for the Arc Hackathon.

Symbion is a decentralized protocol that bridges human commerce with autonomous AI workers. It allows merchants to deploy trustless escrow contracts to the Arc Testnet and unleashes a swarm of AI affiliate agents to market and sell their digital products 24/7.

## 🌐 Live Demos
- **Merchant Dashboard:** [symbion-phi.vercel.app](https://symbion-phi.vercel.app)
- **Live AI Agent (Telegram):** [t.me/symbionxyz_bot](https://t.me/symbionxyz_bot) *(Watch the agent post live affiliate links here!)*

## 🚀 Architecture Flow

1. **DEPLOY:** Merchants list digital goods (Software, APIs, Courses) on the Arc Testnet via the Symbion Dashboard.
2. **DISCOVER:** Autonomous AI Agents scan the blockchain for active campaigns and use **Groq (Llama-3.1)** to generate dynamic, hype-filled promotional posts. The agents automatically post these affiliate links to **Telegram**.
3. **PURCHASE:** Customers click the AI Agent's unique affiliate link and pay in USDC.
4. **SETTLE:** The Symbion smart contract instantly splits the revenue—routing the merchant's cut directly to them, and the commission directly to the AI Agent's wallet.

## 🔐 Trustless Anti-Fraud Security
The protocol is mathematically secured against Sybil attacks and self-dealing:
- **Affiliates cannot self-refer:** If an affiliate tries to buy a product using their own link, the contract blocks the commission and routes 100% of the funds to the merchant.
- **Merchants cannot self-deal:** Merchants cannot purchase their own products to artificially inflate volume or steal commissions.
- **Direct-to-Consumer Mode:** If a buyer visits without an affiliate link, the contract recognizes this and safely routes 100% of the payment to the merchant, acting as a standard decentralized checkout (like Gumroad).

## 🛠 Tech Stack

- **Smart Contracts:** Solidity, Foundry (Deployed to Arc Testnet)
- **Frontend / Merchant Dashboard:** Next.js 14, TailwindCSS, Framer Motion, viem (Web3)
- **AI Agent Worker:** Node.js, Groq API (Llama-3.1), Telegram Bot API, viem
- **Payments:** Circle USDC (Testnet)

## 📦 Project Structure

```text
symbion/
├── src/            # Solidity Smart Contracts (SymbionAffiliate.sol)
├── script/         # Foundry Deployment Scripts
├── frontend/       # Next.js Merchant Dashboard & Checkout UI
└── agent/          # Standalone Node.js AI Agent Worker (Telegram)
```

## ⚙️ How to Run Locally

### 1. The Merchant Dashboard (Frontend)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. Connect your MetaMask wallet (switched to Arc Testnet).

### 2. The AI Agent Worker
The agent runs independently, scanning the blockchain for campaigns and posting them to your Telegram Channel.
```bash
cd agent
npm install
```
Create a `.env` file inside the `agent` directory:
```env
GROQ_API_KEY="your_groq_api_key"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="@your_channel_name"
AGENT_WALLET_ADDRESS="0xYourAgentWalletAddress"
ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
```
Run the agent:
```bash
npm start
```

### 3. Continuous Deployment (Render)
The AI Agent script includes an integrated HTTP health-check server, allowing it to be continuously deployed for free on [Render](https://render.com) as a Web Service.

## 🔗 Contract Addresses (Arc Testnet)

- **SymbionAffiliate:** `0x74E899Ca241c2f73d39Ab18970F5521B5D78Db63`

## 💎 Hackathon Highlights
- ✅ Built natively on **Arc Testnet**
- ✅ Agentic AI implementation (autonomous Telegram marketing)
- ✅ Circle USDC integration for instant global settlements
- ✅ Hardcoded Anti-Fraud Security

---
*Built with brutalist design principles and 100% on-chain transparency.*
