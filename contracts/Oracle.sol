// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {AutomateReady} from "./vendor/AutomateReady.sol";

contract Oracle is AutomateReady {
    address public owner;
    uint256 public number;

    modifier onlyOwner() {
        require(msg.sender == owner, "Oracle.onlyOwner");
        _;
    }

    constructor(address automate) AutomateReady(automate, msg.sender) {
        owner = msg.sender;
    }

    // since we pay synchronously in native tokens
    // we must be able to deposit to the contract
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    // only callable by owner created tasks
    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;

        // since the contract uses sync fee payment it must:
        // fetch fee, fee token, fee collector from the end of calldata
        // transfer the appropriate fee to the fee collector
        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Oracle.withdraw: failed to withdraw");
    }
}
