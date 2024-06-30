// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.1.1/src/v0.8/shared/access/ConfirmedOwner.sol";

contract GLDToken is ERC20, ConfirmedOwner {
    constructor(uint256 initialSupply) ERC20("Palladium", "PLD") ConfirmedOwner(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 value) public onlyOwner {
        _mint(to, value);
    }
}