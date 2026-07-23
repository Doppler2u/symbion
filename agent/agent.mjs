import dotenv from 'dotenv';
import { createPublicClient, http as viemHttp, formatUnits } from 'viem';
import { defineChain } from 'viem';
import http from 'http';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const AGENT_WALLET_ADDRESS = process.env.AGENT_WALLET_ADDRESS || "0x1111111111111111111111111111111111111111";
const SYMBION_ADDRESS = "0x74E899Ca241c2f73d39Ab18970F5521B5D78Db63";

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
    "name": "getActiveCampaigns",
    "inputs": [],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "merchant", "type": "address" },
          { "name": "name", "type": "string" },
          { "name": "price", "type": "uint256" },
          { "name": "commissionBps", "type": "uint256" },
          { "name": "active", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  }
];

const publicClient = createPublicClient({ chain: arcTestnet, transport: viemHttp() });

// --- MEMORY STATE ---
const seenCampaigns = new Set();
let isFirstRun = true;

async function generatePromotionalText(campaignName, price, commission) {
  if (!GROQ_API_KEY || GROQ_API_KEY === "") {
    return `Just discovered an amazing product: ${campaignName}! It only costs ${price} USDC. Get it here:`;
  }

  const prompt = `You are an autonomous AI affiliate marketer on Telegram. Write a highly engaging, hype-filled, viral message to promote a product called "${campaignName}". The price is ${price} USDC. You earn a ${commission}% commission. DO NOT include a link, just the message text. Keep it under 250 characters. Use emojis!`;

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
    return `🔥 Buy ${campaignName} now for ${price} USDC!`;
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
    const activeCamps = await publicClient.readContract({
      address: SYMBION_ADDRESS,
      abi: SYMBION_ABI,
      functionName: 'getActiveCampaigns'
    });

    if (isFirstRun) {
        // Bootup: Memorize all existing campaigns so we don't spam the channel on restart
        console.log(`[BOOT] Memorizing ${activeCamps.length} existing campaigns to avoid duplicate posts...`);
        activeCamps.forEach(camp => seenCampaigns.add(Number(camp.id)));
        isFirstRun = false;
        return;
    }

    // Filter for brand new campaigns we haven't seen yet
    const newCamps = activeCamps.filter(camp => !seenCampaigns.has(Number(camp.id)));

    if (newCamps.length === 0) {
      console.log(`[SCAN] ${new Date().toLocaleTimeString()} - No new campaigns found. Waiting...`);
      return;
    }

    console.log(`\n🚨 FOUND ${newCamps.length} NEW CAMPAIGN(S)! Generating promotional content...\n`);

    // Process all new campaigns
    for (const camp of newCamps) {
        const id = Number(camp.id);
        const name = camp.name;
        const price = formatUnits(camp.price, 18);
        const commission = Number(camp.commissionBps) / 100;
        
        // Live Affiliate Link
        const link = `https://symbion-phi.vercel.app/buy/${id}?ref=${AGENT_WALLET_ADDRESS}`;

        console.log(`--- NEW CAMPAIGN #${id}: ${name} ---`);
        console.log("Calling Groq LLM (Llama-3.1)...");
        
        const promoText = await generatePromotionalText(name, price, commission);
        const finalPost = `${promoText}\n\n👉 <b>Get it here:</b> ${link}`;
        
        console.log(`\n📲 ATTEMPTING TO POST TO TELEGRAM:\n${finalPost}\n`);
        await postToTelegram(finalPost);
        
        // Mark as seen!
        seenCampaigns.add(id);
        console.log("-".repeat(40));
    }
    
  } catch (error) {
    console.error("Agent encountered an error scanning the blockchain:", error);
  }
}

// --- RENDER COMPATIBILITY & REAL-TIME LISTENER ---

console.log("/// SYMBION REAL-TIME AI AGENT WORKER ///");
console.log(`Agent Wallet: ${AGENT_WALLET_ADDRESS}`);

// 1. Create a dummy HTTP Server so Render knows the service is alive
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Symbion Real-Time Agent is running normally.\n');
});

server.listen(PORT, () => {
    console.log(`✅ Render Health Check Server listening on port ${PORT}`);
});

// 2. Poll every 15 seconds instead of 1 hour
const FAST_POLL_INTERVAL = 15 * 1000;

// Run it immediately on boot to initialize memory
runAgentCycle();

// Then run it continuously every 15 seconds
setInterval(() => {
    runAgentCycle();
}, FAST_POLL_INTERVAL);

console.log(`⏳ Agent armed. Scanning Arc Testnet every ${FAST_POLL_INTERVAL / 1000} seconds for new campaigns...`);
