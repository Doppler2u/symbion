// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SymbionAffiliate
 * @notice Trustless Affiliate Protocol for the Arc Testnet
 * @dev Arc uses USDC as the native gas token (msg.value is USDC).
 */
contract SymbionAffiliate {
    struct Campaign {
        uint256 id;
        address merchant;
        string name;
        uint256 price;
        uint256 commissionBps; // 10000 = 100%
        bool active;
    }

    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => uint256) public balances; // Native USDC balances

    event CampaignCreated(uint256 indexed campaignId, address indexed merchant, string name, uint256 price, uint256 commissionBps);
    event PurchaseMade(uint256 indexed campaignId, address indexed buyer, address indexed affiliate, uint256 merchantAmount, uint256 affiliateAmount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @notice Create a new affiliate campaign
     * @param name Name of the product/campaign
     * @param price Product price in native USDC (18 decimals on Arc)
     * @param commissionBps Commission percentage (e.g. 1500 = 15%)
     */
    function createCampaign(string calldata name, uint256 price, uint256 commissionBps) external returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(commissionBps <= 10000, "Commission cannot exceed 100%");

        uint256 campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            id: campaignId,
            merchant: msg.sender,
            name: name,
            price: price,
            commissionBps: commissionBps,
            active: true
        });

        emit CampaignCreated(campaignId, msg.sender, name, price, commissionBps);
        return campaignId;
    }

    /**
     * @notice Deactivate a campaign
     */
    function toggleCampaign(uint256 campaignId, bool active) external {
        require(campaigns[campaignId].merchant == msg.sender, "Not the merchant");
        campaigns[campaignId].active = active;
    }

    /**
     * @notice Purchase a product through an AI agent's affiliate link
     * @param campaignId The ID of the campaign
     * @param affiliate The address of the AI Agent's Circle wallet
     */
    function purchase(uint256 campaignId, address affiliate) external payable {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Campaign is not active");
        require(msg.value == campaign.price, "Incorrect USDC amount provided");

        uint256 affiliateAmount = 0;
        uint256 merchantAmount = msg.value;

        // Valid affiliate (not address zero and not the merchant buying their own product)
        if (affiliate != address(0) && affiliate != campaign.merchant && affiliate != msg.sender) {
            affiliateAmount = (msg.value * campaign.commissionBps) / 10000;
            merchantAmount = msg.value - affiliateAmount;
            balances[affiliate] += affiliateAmount;
        }

        balances[campaign.merchant] += merchantAmount;

        emit PurchaseMade(campaignId, msg.sender, affiliate, merchantAmount, affiliateAmount);
    }

    /**
     * @notice Withdraw accumulated USDC balances
     */
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Get all active campaigns in a single RPC call to prevent rate limits
     */
    function getActiveCampaigns() external view returns (Campaign[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextCampaignId; i++) {
            if (campaigns[i].active) {
                count++;
            }
        }
        
        Campaign[] memory result = new Campaign[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextCampaignId; i++) {
            if (campaigns[i].active) {
                result[index] = campaigns[i];
                index++;
            }
        }
        return result;
    }
}
