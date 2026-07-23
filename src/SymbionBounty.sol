// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SymbionBounty
 * @notice Trustless Decentralized Bounty Protocol for the Arc Testnet
 * @dev Arc uses USDC as the native gas token (msg.value is USDC).
 */
contract SymbionBounty {
    struct Bounty {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256 totalReward;
        uint256 rewardPerWinner;
        uint256 maxWinners;
        uint256 winnersSelected;
        bool active;
    }

    struct Submission {
        address submitter;
        string proofUrl;
        bool isWinner;
    }

    uint256 public nextBountyId = 1;
    mapping(uint256 => Bounty) public bounties;
    
    // bountyId => array of submissions
    mapping(uint256 => Submission[]) public submissions;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, string name, uint256 totalReward, uint256 maxWinners);
    event ProofSubmitted(uint256 indexed bountyId, address indexed submitter, string proofUrl);
    event WinnerSelected(uint256 indexed bountyId, address indexed winner, uint256 amountPaid);
    event BountyClosed(uint256 indexed bountyId);

    /**
     * @notice Create a new bounty task, locking the USDC reward in escrow
     * @param name Name of the bounty task
     * @param description Requirements of the task
     * @param rewardPerWinner Reward amount per winner in USDC
     * @param maxWinners Maximum number of winners
     */
    function createBounty(string calldata name, string calldata description, uint256 rewardPerWinner, uint256 maxWinners) external payable returns (uint256) {
        require(rewardPerWinner > 0, "Reward must be > 0");
        require(maxWinners > 0, "Max winners must be > 0");
        
        uint256 totalRequired = rewardPerWinner * maxWinners;
        require(msg.value == totalRequired, "Must send exact total USDC for escrow");

        uint256 bountyId = nextBountyId++;
        bounties[bountyId] = Bounty({
            id: bountyId,
            creator: msg.sender,
            name: name,
            description: description,
            totalReward: totalRequired,
            rewardPerWinner: rewardPerWinner,
            maxWinners: maxWinners,
            winnersSelected: 0,
            active: true
        });

        emit BountyCreated(bountyId, msg.sender, name, totalRequired, maxWinners);
        return bountyId;
    }

    /**
     * @notice Submit a proof URL (e.g. a Twitter link) to participate in the bounty
     */
    function submitWork(uint256 bountyId, string calldata proofUrl) external {
        Bounty storage b = bounties[bountyId];
        require(b.active, "Bounty is not active");
        require(b.winnersSelected < b.maxWinners, "Bounty is full");
        
        // Ensure user hasn't submitted yet
        for (uint i = 0; i < submissions[bountyId].length; i++) {
            require(submissions[bountyId][i].submitter != msg.sender, "Already submitted");
        }

        submissions[bountyId].push(Submission({
            submitter: msg.sender,
            proofUrl: proofUrl,
            isWinner: false
        }));

        emit ProofSubmitted(bountyId, msg.sender, proofUrl);
    }

    /**
     * @notice Creator selects a winner and the smart contract instantly pays them from escrow
     */
    function selectWinner(uint256 bountyId, address winner) external {
        Bounty storage b = bounties[bountyId];
        require(msg.sender == b.creator, "Only creator can select winners");
        require(b.active, "Bounty is closed");
        require(b.winnersSelected < b.maxWinners, "All winners already selected");

        // Verify the address actually submitted
        bool found = false;
        for (uint i = 0; i < submissions[bountyId].length; i++) {
            if (submissions[bountyId][i].submitter == winner) {
                require(!submissions[bountyId][i].isWinner, "Already selected as winner");
                submissions[bountyId][i].isWinner = true;
                found = true;
                break;
            }
        }
        require(found, "Winner did not submit work");

        b.winnersSelected++;
        
        // Auto-close if all winners selected
        if (b.winnersSelected == b.maxWinners) {
            b.active = false;
            emit BountyClosed(bountyId);
        }

        // Pay the winner instantly
        (bool success, ) = winner.call{value: b.rewardPerWinner}("");
        require(success, "Transfer failed");

        emit WinnerSelected(bountyId, winner, b.rewardPerWinner);
    }

    /**
     * @notice If the bounty is dead and no one submits, the creator can reclaim remaining funds
     */
    function refundRemaining(uint256 bountyId) external {
        Bounty storage b = bounties[bountyId];
        require(msg.sender == b.creator, "Only creator");
        require(b.active, "Already closed");
        
        b.active = false;
        
        uint256 remainingFunds = (b.maxWinners - b.winnersSelected) * b.rewardPerWinner;
        if (remainingFunds > 0) {
            (bool success, ) = msg.sender.call{value: remainingFunds}("");
            require(success, "Refund failed");
        }
        
        emit BountyClosed(bountyId);
    }

    /**
     * @notice Fetch all submissions for a bounty
     */
    function getSubmissions(uint256 bountyId) external view returns (Submission[] memory) {
        return submissions[bountyId];
    }

    /**
     * @notice Fetch all active bounties (for the UI and Agent)
     */
    function getActiveBounties() external view returns (Bounty[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextBountyId; i++) {
            if (bounties[i].active) {
                count++;
            }
        }
        
        Bounty[] memory result = new Bounty[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextBountyId; i++) {
            if (bounties[i].active) {
                result[index] = bounties[i];
                index++;
            }
        }
        return result;
    }
}
