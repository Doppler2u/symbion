// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SymbionAffiliate} from "../src/SymbionAffiliate.sol";

contract SymbionAffiliateTest is Test {
    SymbionAffiliate public symbion;

    address public merchant = address(1);
    address public affiliate = address(2);
    address public buyer = address(3);

    function setUp() public {
        symbion = new SymbionAffiliate();
        
        vm.deal(merchant, 100 ether);
        vm.deal(affiliate, 100 ether);
        vm.deal(buyer, 100 ether);
    }

    function test_CreateCampaign() public {
        vm.startPrank(merchant);
        uint256 campaignId = symbion.createCampaign("DevPro API", 10 ether, 1000); // 10 USDC, 10% commission
        vm.stopPrank();

        assertEq(campaignId, 1);
        (uint256 id, address m, string memory name, uint256 price, uint256 comm, bool active) = symbion.campaigns(campaignId);
        assertEq(id, 1);
        assertEq(m, merchant);
        assertEq(name, "DevPro API");
        assertEq(price, 10 ether);
        assertEq(comm, 1000);
        assertTrue(active);
    }

    function test_PurchaseWithAffiliate() public {
        vm.startPrank(merchant);
        uint256 campaignId = symbion.createCampaign("DevPro API", 10 ether, 1000); // 10 USDC, 10% commission
        vm.stopPrank();

        vm.startPrank(buyer);
        symbion.purchase{value: 10 ether}(campaignId, affiliate);
        vm.stopPrank();

        uint256 affiliateBal = symbion.balances(affiliate);
        uint256 merchantBal = symbion.balances(merchant);

        assertEq(affiliateBal, 1 ether); // 10% of 10 USDC
        assertEq(merchantBal, 9 ether); // 90% of 10 USDC
    }

    function test_Withdraw() public {
        vm.startPrank(merchant);
        uint256 campaignId = symbion.createCampaign("DevPro API", 10 ether, 1000); // 10 USDC, 10% commission
        vm.stopPrank();

        vm.startPrank(buyer);
        symbion.purchase{value: 10 ether}(campaignId, affiliate);
        vm.stopPrank();

        uint256 initialAffiliateEth = affiliate.balance;
        
        vm.startPrank(affiliate);
        symbion.withdraw(1 ether);
        vm.stopPrank();

        assertEq(affiliate.balance, initialAffiliateEth + 1 ether);
        assertEq(symbion.balances(affiliate), 0);
    }
}
