export const SYMBION_ADDRESS = "0x74E899Ca241c2f73d39Ab18970F5521B5D78Db63";

export const SYMBION_ABI = [
  {
    "type": "function",
    "name": "createCampaign",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "price", "type": "uint256" },
      { "name": "commissionBps", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "campaigns",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "merchant", "type": "address" },
      { "name": "name", "type": "string" },
      { "name": "price", "type": "uint256" },
      { "name": "commissionBps", "type": "uint256" },
      { "name": "active", "type": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "purchase",
    "inputs": [
      { "name": "campaignId", "type": "uint256" },
      { "name": "affiliate", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "nextCampaignId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balances",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
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
