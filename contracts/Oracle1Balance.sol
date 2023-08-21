// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {AutomateReady} from "./vendor/AutomateReady.sol";

contract Oracle1Balance is AutomateReady {
    uint256 public number;

    constructor(
        address automate
    )
        // solhint-disable-next-line no-empty-blocks
        AutomateReady(automate, msg.sender)
    {}

    // only callable by owner created tasks
    // fee is deducted from 1Balance after execution
    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;
    }
}
