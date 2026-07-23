// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SymbionBounty} from "../src/SymbionBounty.sol";

contract DeploySymbion is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        SymbionBounty symbion = new SymbionBounty();

        vm.stopBroadcast();
        console.log("SymbionBounty deployed at:", address(symbion));
    }
}
