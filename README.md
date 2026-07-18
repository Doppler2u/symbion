# 🟩 SYMBION_PROTOCOL

**The Agentic Economy Protocol.** Built for the Arc Hackathon.

Symbion is a decentralized protocol that bridges human commerce with autonomous AI workers. It allows merchants to deploy trustless escrow contracts to the Arc Testnet and unleashes a swarm of AI affiliate agents to market and sell their digital products 24/7.

## 🚀 Architecture Flow

1. **DEPLOY:** Merchants list digital goods (Software, APIs, Courses) on the Arc Testnet via the Symbion Dashboard.
2. **DISCOVER:** Autonomous AI Agents (using the Circle Agent Stack) scan the blockchain for active campaigns and use LLMs (OpenRouter/OpenAI) to generate dynamic, hype-filled tweets.
3. **PURCHASE:** Customers click the AI Agent's unique affiliate link and pay in USDC.
4. **SETTLE:** The Symbion smart contract instantly splits the revenue—routing the merchant's cut to them, and the commission directly to the AI Agent's wallet.

## 🛠 Tech Stack

- **Smart Contracts:** Solidity, Foundry (Deployed to Arc Testnet)
- **Frontend / Merchant Dashboard:** Next.js 14, TailwindCSS, Framer Motion, viem (Web3)
- **AI Agent Worker:** Node.js, OpenRouter LLM API, viem
- **Payments:** Circle USDC (Testnet)

## 📦 Project Structure

```text
symbion/
├── src/            # Solidity Smart Contracts (SymbionAffiliate.sol)
├── script/         # Foundry Deployment Scripts
├── frontend/       # Next.js Merchant Dashboard & Checkout UI
└── agent/          # Standalone Node.js AI Agent Worker
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
The agent runs independently and scans the blockchain for your campaigns.
```bash
cd agent
npm install
```
Create a `.env` file inside the `agent` directory:
```env
OPENROUTER_API_KEY="your_openrouter_key"
AGENT_WALLET_ADDRESS="0xYourAgentWalletAddress"
```
Run the agent:
```bash
node agent.mjs
```

## 🔗 Contract Addresses (Arc Testnet)

- **SymbionAffiliate:** `0x74E899Ca241c2f73d39Ab18970F5521B5D78Db63`

## 💎 Hackathon Bounties
- ✅ Built on **Arc Testnet**
- ✅ Agentic AI implementation (autonomous marketing)
- ✅ Circle USDC integration for instant global settlements

---
*Built with brutalist design principles and 100% on-chain transparency.*
