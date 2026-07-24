export const SYMBION_ADDRESS = "0x2d7312999e1b86e9088eAB0C9D3a58ac98005ad9";

export const SYMBION_ABI = [
  {
    "type": "function",
    "name": "createBounty",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "description", "type": "string" },
      { "name": "rewardPerWinner", "type": "uint256" },
      { "name": "maxWinners", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "submitWork",
    "inputs": [
      { "name": "bountyId", "type": "uint256" },
      { "name": "proofUrl", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "selectWinner",
    "inputs": [
      { "name": "bountyId", "type": "uint256" },
      { "name": "winner", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "refundRemaining",
    "inputs": [{ "name": "bountyId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
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
  },
  {
    "type": "function",
    "name": "nextBountyId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
];
