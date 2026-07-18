// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SymbionAffiliate} from "../src/SymbionAffiliate.sol";

contract DeploySymbion is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        SymbionAffiliate symbion = new SymbionAffiliate();

        vm.stopBroadcast();
        console.log("SymbionAffiliate deployed at:", address(symbion));
    }
}
