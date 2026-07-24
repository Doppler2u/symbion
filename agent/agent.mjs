import dotenv from 'dotenv';
import { createPublicClient, http as viemHttp, formatUnits } from 'viem';
import { defineChain } from 'viem';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const AGENT_WALLET_ADDRESS = process.env.AGENT_WALLET_ADDRESS || "0x1111111111111111111111111111111111111111";
const SYMBION_ADDRESS = "0x2d7312999e1b86e9088eAB0C9D3a58ac98005ad9";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

const SYMBION_ABI = [
  {
    "type": "function",
    "name": "getActiveBounties",
    "inputs": [],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "creator", "type": "address" },
          { "name": "name", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "totalReward", "type": "uint256" },
          { "name": "rewardPerWinner", "type": "uint256" },
          { "name": "maxWinners", "type": "uint256" },
          { "name": "winnersSelected", "type": "uint256" },
          { "name": "active", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextBountyId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSubmissions",
    "inputs": [{ "name": "bountyId", "type": "uint256" }],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "submitter", "type": "address" },
          { "name": "proofUrl", "type": "string" },
          { "name": "isWinner", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "bounties",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "creator", "type": "address" },
      { "name": "name", "type": "string" },
      { "name": "description", "type": "string" },
      { "name": "totalReward", "type": "uint256" },
      { "name": "rewardPerWinner", "type": "uint256" },
      { "name": "maxWinners", "type": "uint256" },
      { "name": "winnersSelected", "type": "uint256" },
      { "name": "active", "type": "bool" }
    ],
    "stateMutability": "view"
  }
];

const publicClient = createPublicClient({ chain: arcTestnet, transport: viemHttp() });

// --- DATABASE SETUP ---
const db = new sqlite3.Database('./symbion.db');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      bountyId INTEGER,
      bountyName TEXT,
      rewardPerWinner TEXT,
      isActive BOOLEAN,
      submitter TEXT,
      proofUrl TEXT,
      isWinner BOOLEAN
    )
  `);
});

// --- MEMORY STATE ---
const seenBounties = new Set();
let isFirstRun = true;

async function generatePromotionalText(bountyName, rewardPerWinner, maxWinners) {
  if (!GROQ_API_KEY || GROQ_API_KEY === "") {
    return `Just discovered an amazing bounty: ${bountyName}! Get paid ${rewardPerWinner} USDC. Get started here:`;
  }

  const prompt = `You are an autonomous AI recruiter on Telegram. Write a highly engaging, viral message to recruit people for a bounty task called "${bountyName}". The reward is ${rewardPerWinner} USDC per winner, and there will be ${maxWinners} winners. 

FORMAT RULES:
- DO NOT write a single paragraph.
- Use 2-3 short, punchy lines with line breaks.
- Use emojis!
- DO NOT include a link, just the message text.
- Keep it under 250 characters total.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    const data = await response.json();
    if (!data.choices) {
        throw new Error("Groq API Error: " + JSON.stringify(data));
    }
    let text = data.choices[0].message.content.trim();
    if (text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1);
    }
    return text;
  } catch (error) {
    console.error("LLM Error:", error);
    return `🔥 Complete the ${bountyName} task and earn ${rewardPerWinner} USDC!`;
  }
}

async function postToTelegram(text) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log("⚠️ Telegram Bot Token or Chat ID is missing. Skipping live post.");
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();
        if (result.ok) {
            console.log("✅ Successfully posted to live Telegram Channel!");
        } else {
            console.error("❌ Telegram API Error:", result.description);
        }
    } catch (e) {
        console.error("❌ Failed to connect to Telegram:", e);
    }
}

async function runAgentCycle() {
  try {
    const activeBounties = await publicClient.readContract({
      address: SYMBION_ADDRESS,
      abi: SYMBION_ABI,
      functionName: 'getActiveBounties'
    });

    if (isFirstRun) {
        // Bootup: Memorize all existing bounties so we don't spam the channel on restart
        console.log(`[BOOT] Memorizing ${activeBounties.length} existing bounties to avoid duplicate posts...`);
        activeBounties.forEach(b => seenBounties.add(Number(b.id)));
        isFirstRun = false;
        return;
    }

    // Filter for brand new bounties we haven't seen yet
    const newBounties = activeBounties.filter(b => !seenBounties.has(Number(b.id)));

    // --- DATABASE INDEXING ---
    // Fetch submissions for ALL bounties (historical and active) safely
    try {
      const fetchWithRetry = async (contractCall, retries = 5, delay = 1500) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await publicClient.readContract(contractCall);
          } catch (err) {
            if (i < retries - 1) {
              await new Promise(res => setTimeout(res, delay * (i + 1))); // Exponential backoff
            } else {
              throw err;
            }
          }
        }
      };

      const nextId = await fetchWithRetry({
        address: SYMBION_ADDRESS,
        abi: SYMBION_ABI,
        functionName: 'nextBountyId'
      });
      
      for (let i = 1; i < Number(nextId); i++) {
        await new Promise(r => setTimeout(r, 500));
        const submissions = await fetchWithRetry({
          address: SYMBION_ADDRESS,
          abi: SYMBION_ABI,
          functionName: 'getSubmissions',
          args: [BigInt(i)]
        }).catch(() => []);

        if (submissions.length > 0) {
          await new Promise(r => setTimeout(r, 500));
          const bountyInfo = await fetchWithRetry({
            address: SYMBION_ADDRESS,
            abi: SYMBION_ABI,
            functionName: 'bounties',
            args: [BigInt(i)]
          }).catch(() => null);

          if (bountyInfo) {
            const bountyName = bountyInfo[2];
            const rewardPerWinner = formatUnits(bountyInfo[5], 18);
            const isActive = bountyInfo[8] ? 1 : 0;

            submissions.forEach((sub) => {
              const rowId = `${i}-${sub.submitter.toLowerCase()}`;
              db.run(
                `INSERT OR REPLACE INTO submissions (id, bountyId, bountyName, rewardPerWinner, isActive, submitter, proofUrl, isWinner) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [rowId, i, bountyName, rewardPerWinner, isActive, sub.submitter.toLowerCase(), sub.proofUrl, sub.isWinner ? 1 : 0]
              );
            });
          }
        }
        // tiny delay to respect RPC
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      console.error("Indexing error:", e);
    }

    if (newBounties.length === 0) {
      console.log(`[SCAN] ${new Date().toLocaleTimeString()} - No new bounties found. Submissions indexed. Waiting...`);
      return;
    }

    console.log(`\n🚨 FOUND ${newBounties.length} NEW BOUNTY(S)! Generating promotional content...\n`);

    // Process all new bounties
    for (const b of newBounties) {
        const id = Number(b.id);
        const name = b.name;
        const rewardPerWinner = formatUnits(b.rewardPerWinner, 18);
        const maxWinners = Number(b.maxWinners);
        
        // Live Bounty Link
        const link = `https://symbion-phi.vercel.app/bounty/${id}`;

        console.log(`--- NEW BOUNTY #${id}: ${name} ---`);
        console.log("Calling Groq LLM (Llama-3.1)...");
        
        const promoText = await generatePromotionalText(name, rewardPerWinner, maxWinners);
        
        const message = `
🟩 *NEW BOUNTY TASK AVAILABLE* 🟩

📌 *Task:* ${name}
📝 *Description:* ${b.description}
💰 *Reward per Winner:* ${rewardPerWinner} USDC
🏆 *Total Winners Allowed:* ${maxWinners}

🔗 *Submit Proof Here:*
${link}`;

        const finalPost = `${promoText}\n\n${message}`;
        
        console.log(`\n📲 ATTEMPTING TO POST TO TELEGRAM:\n${finalPost}\n`);
        await postToTelegram(finalPost);
        
        // Mark as seen!
        seenBounties.add(id);
        console.log("-".repeat(40));
    }
    
    
  } catch (error) {
    console.error("Agent encountered an error scanning the blockchain:", error);
  }
}

// --- RENDER COMPATIBILITY & REAL-TIME LISTENER ---

console.log("/// SYMBION REAL-TIME AI AGENT WORKER ///");
console.log(`Agent Wallet: ${AGENT_WALLET_ADDRESS}`);

// 1. Create a real Express API Server
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Symbion Agent API is running.');
});

app.get('/health', (req, res) => {
  res.send('Symbion Real-Time Agent & Indexer is running normally.');
});

app.get('/api/submissions', (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.status(400).json({ error: "Missing wallet address" });

  db.all(
    `SELECT * FROM submissions WHERE submitter = ? ORDER BY bountyId DESC`,
    [wallet.toLowerCase()],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const formatted = rows.map(r => ({
        bounty: {
          id: r.bountyId,
          name: r.bountyName,
          rewardPerWinner: r.rewardPerWinner
        },
        proofUrl: r.proofUrl,
        isWinner: Boolean(r.isWinner),
        isActive: Boolean(r.isActive)
      }));
      
      res.json(formatted);
    }
  );
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Render API & Health Server listening explicitly on port ${PORT}`);
});

// 2. Poll every 15 seconds instead of 1 hour
const FAST_POLL_INTERVAL = 15 * 1000;

// Run it immediately on boot to initialize memory
runAgentCycle();

// Then run it continuously every 15 seconds
setInterval(() => {
    runAgentCycle();
}, FAST_POLL_INTERVAL);

console.log(`⏳ Agent armed. Scanning Arc Testnet every ${FAST_POLL_INTERVAL / 1000} seconds for new bounties...`);
