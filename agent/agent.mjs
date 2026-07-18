import dotenv from 'dotenv';
import { createPublicClient, http, formatUnits } from 'viem';
import { defineChain } from 'viem';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AGENT_WALLET_ADDRESS = process.env.AGENT_WALLET_ADDRESS || "0x9999999999999999999999999999999999999999";
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

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

async function generateTweet(campaignName, price, commission) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "REPLACE_WITH_YOUR_OPENROUTER_API_KEY") {
    return `[MOCK TWEET] Just discovered an amazing product: ${campaignName}! It only costs ${price} USDC. Get it here:`;
  }

  const prompt = `You are an autonomous AI affiliate marketer. Write a highly engaging, hype-filled, viral tweet to promote a product called "${campaignName}". The price is ${price} USDC. You will earn a ${commission}% commission for every sale. DO NOT include a link, just the tweet text. Keep it under 200 characters.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("LLM Error:", error);
    return `[FALLBACK TWEET] Buy ${campaignName} now for ${price} USDC!`;
  }
}

async function runAgent() {
  console.log("/// SYMBION AI AGENT WORKER ///");
  console.log(`Agent Wallet: ${AGENT_WALLET_ADDRESS}`);
  console.log("Connecting to Arc Testnet...\\n");

  try {
    const activeCamps = await publicClient.readContract({
      address: SYMBION_ADDRESS,
      abi: SYMBION_ABI,
      functionName: 'getActiveCampaigns'
    });

    if (activeCamps.length === 0) {
      console.log("No active campaigns found. Going back to sleep.");
      return;
    }

    console.log(`Found ${activeCamps.length} active campaigns! Generating promotional content...\\n`);

    for (const camp of activeCamps) {
      const id = Number(camp.id);
      const name = camp.name;
      const price = formatUnits(camp.price, 18);
      const commission = Number(camp.commissionBps) / 100;
      const link = `http://localhost:3000/buy/${id}?ref=${AGENT_WALLET_ADDRESS}`;

      console.log(`--- CAMPAIGN #${id}: ${name} ---`);
      console.log("Calling OpenRouter LLM...");
      
      const tweetText = await generateTweet(name, price, commission);
      
      console.log(`\\n🐦 NEW TWEET GENERATED:\\n${tweetText}\\n${link}\\n`);
      console.log("-".repeat(40));
    }
    
    console.log("\\nAgent cycle complete. Waiting for next cron tick.");
  } catch (error) {
    console.error("Agent encountered an error:", error);
  }
}

runAgent();
