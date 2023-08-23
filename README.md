# Web3 Function Task Creation

There are four ways to create Web3 Functions tasks:

1. [From the UI](#from-the-ui)
2. [From the SDK](#from-the-sdk)
3. [From a Smart Contract](#from-a-smart-contract)
4. [From a Web3 Function (meta-task)](#from-a-web3-function-meta-task)

This project demonstrates each and showcases various fee payment methods.
Computational costs are covered by 1Balance and transactions fees are compensated either using 1Balance or having the transactions pay for themselves during execution.

> **Note**
> Web3 Functions are currently in private beta.  
> In order to get access, please reach out to us [here](https://form.typeform.com/to/RrEiARiI)

## From the UI

Creating a Web3 Function task from the UI is straightforward and requires no code whatsoever.  
Head over to https://beta.app.gelato.network/ and click on the **Create Task** button.  
For further information, refer to our [documentation](https://docs.gelato.network/developer-services/web3-functions/creating-web3-function-tasks#creating-a-web3-function-task-via-the-ui).

## From the SDK

Use the `automate-sdk` to easily create a new task:
```
yarn install @gelatonetwork/automate-sdk@beta
```

> **Note**
> The `beta` version of the `automate-sdk` must be used for Web3 Function task creation.

Import the SDK and create a task, passing your web3 function CID & arguments:

```ts
const { taskId, tx } = await automate.createBatchExecTask({
  name: "Oracle",
  web3FunctionHash: cid,
  web3FunctionArgs: {
    ...
  },
  // whether to pay using 1Balance or during execution
  useTreasury: true,
});
```

For further information, refer to our [documentation](https://docs.gelato.network/developer-services/web3-functions/creating-web3-function-tasks#using-automate-sdk).

### Examples

| Type | Implementation | Description |
| -------- | ------- | -------- |
| Script | [`create-task-oracle.ts`](https://github.com/gelatodigital/w3f-task-creation/blob/main/scripts/create-task-oracle.ts) | Creates a self-paying task funded by `ETH` in the Oracle contract |
| Script | [`create-task-oracle-1balance.ts`](https://github.com/gelatodigital/w3f-task-creation/blob/main/scripts/create-task-oracle-1balance.ts) | Creates a sponsored task funded by [1Balance](https://beta.app.gelato.network/balance) |
| Web3 Function | [`oracle`](https://github.com/gelatodigital/w3f-task-creation/blob/main/web3-functions/oracle/index.ts) | Periodically pushes off-chain values to an Oracle contract |
| Smart Contract | [`Oracle.sol`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/Oracle.sol) | This contract receives values from the Web3 Function |
| Smart Contract | [`Oracle1Balance.sol`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/Oracle1Balance.sol) | This contract receives values from the Web3 Function |

### Quick Start

Below are instructions on deploying the `Oracle1Balance` contract and creating a sponsored Web3 Function task to update oracle prices:

1. Install dependencies
   ```
   yarn install
   ```
2. Edit ``.env``
   ```
   cp .env.example .env
   ```
3. Deploy `Oracle1Balance` contract
   ```
   yarn hardhat deploy --tags Oracle1Balance --network mumbai
   ```
4. Verify contract (Optional)
   ```
   yarn hardhat etherscan-verify --network mumbai
   ```
5. Create Web3 Function task
   ```
   yarn hardhat run scripts/create-task-oracle-1balance.ts --network mumbai
   ```
6. [Deposit funds on 1Balance](https://beta.app.gelato.network/balance)

## From a Smart Contract

Web3 Function tasks can also be created on-chain using a Smart Contract by inheriting from [`AutomateTaskCreator`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/vendor/AutomateTaskCreator.sol).  
Below is a sample implementation creating an Oracle task:

```solidity
function _createOracleTask(string memory cid) internal returns (bytes32) {
    ModuleData memory moduleData = ModuleData({
        modules: new Module[](2),
        args: new bytes[](2)
    });

    // Proxy module creates a dedicated proxy for this contract
    // ensures that only contract created tasks can call certain fuctions
    // restrict functions by using the onlyDedicatedMsgSender modifier
    moduleData.modules[0] = Module.PROXY;
    moduleData.modules[1] = Module.WEB3_FUNCTION;

    moduleData.args[0] = _proxyModuleArg();
    moduleData.args[1] = _web3FunctionModuleArg(
        // the CID is the hash of the W3f deployed on IPFS
        cid,
        // the arguments to the W3f are this contracts address
        // currently W3fs accept string, number, bool as arguments
        // thus we must convert the address to a string
        abi.encode(Strings.toHexString(address(this)))
    );

    // execData passed to the proxy by the Automate contract
    // "batchExecuteCall" forwards calls from the proxy to this contract
    bytes memory execData = abi.encodeWithSelector(
        IOpsProxy.batchExecuteCall.selector
    );

    // target address is this contracts dedicatedMsgSender proxy
    return
        _createTask(
            dedicatedMsgSender,
            execData,
            moduleData,
            // native token as fee token indicates
            // that the contract will pay the fee synchronously
            // zero address as fee token indicates
            // that the contract will use 1Balance for fee payment
            NATIVE_TOKEN
        );
}
```

For further information, refer to our [documentation](https://docs.gelato.network/developer-services/web3-functions/creating-web3-function-tasks#using-a-smart-contract).

### Implications

Since a Smart Contract is the task creator rather than the deployer:

- The Smart Contract itself must be a whitelisted task creator.  
  It is insufficient to have only the Smart Contract deployer whitelisted.  
- Sponsored executions will charge the Smart Contracts 1Balance rather than the deployers.  
  The contracts 1Balance must be topped up using [depositFunds1Balance](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/Oracle1BalanceTaskCreator.sol#L51-L57).  

### Examples

| Type | Implementation | Description |
| -------- | ------- | -------- |
| Web3 Function | [`oracle`](https://github.com/gelatodigital/w3f-task-creation/blob/main/web3-functions/oracle/index.ts) | Periodically pushes off-chain values to an Oracle contract |
| Smart Contract | [`OracleTaskCreator.sol`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/OracleTaskCreator.sol) | Creates a self-paying task funded by its `ETH` balance and is pushed values by the Web3 Function it spawns |
| Smart Contract | [`Oracle1BalanceTaskCreator.sol`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/Oracle1BalanceTaskCreator.sol) | Creates a sponsored task funded by [1Balance](https://docs.gelato.network/developer-services/1balance) and is pushed values by the Web3 Function it spawns |

### Quick Start

Below are instructions on deploying the `OracleTaskCreator` contract which creates a self-paying Web3 Function task to update oracle prices:

1. Install dependencies
   ```
   yarn install
   ```
2. Edit ``.env``
   ```
   cp .env.example .env
   ```
3. Deploy `OracleTaskCreator` contract
   ```
   yarn hardhat deploy --tags OracleTaskCreator --network mumbai
   ```
4. Verify contract (Optional)
   ```
   yarn hardhat etherscan-verify --network mumbai
   ```
5. Tranfer `ETH` to the `OracleTaskCreator` contract

## From a Web3 Function (meta-task)

Since Web3 Functions can perform arbitrary computation, they can create a subtask using the SDK just like in the [task creation from SDK](#from-the-sdk) example:

```ts
const { taskId, tx } = await automate.prepareBatchExecTask({
  name: "Oracle",
  web3FunctionHash: cid,
  web3FunctionArgs: {
    ...
  },
  // whether to pay using 1Balance or during execution
  useTreasury: true,
}, {}, creatorAddress);
```

> **Note**
> Subtasks will charge the same 1Balance account since they are directly attached to the task creator.  
> This allows for easy funding and subscription management.

### Examples

| Type | Implementation | Description |
| -------- | ------- | -------- |
| Script | [`create-meta-task-oracle.ts`](https://github.com/gelatodigital/w3f-task-creation/blob/main/scripts/create-meta-task-oracle.ts) | Creates a sponsored task whos subtask is funded by `ETH` in the Oracle contract |
| Script | [`create-meta-task-oracle-1balance.ts`](https://github.com/gelatodigital/w3f-task-creation/blob/main/scripts/create-meta-task-oracle-1balance.ts) | Creates a sponsored task whos subtask is funded by [1Balance](https://beta.app.gelato.network/balance) |
| Web3 Function | [`create-meta-task-oracle`](https://github.com/gelatodigital/w3f-task-creation/blob/main/web3-functions/create-meta-task-oracle/index.ts) | Creates an `oracle` subtask/meta-task |
| Web3 Function | [`oracle`](https://github.com/gelatodigital/w3f-task-creation/blob/main/web3-functions/oracle/index.ts) | Periodically pushes off-chain values to an Oracle contract |
| Smart Contract | [`Oracle.sol`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/Oracle.sol) | This contract is pushed values by the Web3 Function |
| Smart Contract | [`Oracle1Balance.sol`](https://github.com/gelatodigital/w3f-task-creation/blob/main/contracts/Oracle1Balance.sol) | This contract is pushed values by the Web3 Function |

### Quick Start

Below are instructions on deploying the `Oracle1Balance` contract and creating a sponsored Web3 Function task which itself creates a sponsored subtask to update oracle prices:

1. Install dependencies
   ```
   yarn install
   ```
2. Edit ``.env``
   ```
   cp .env.example .env
   ```
3. Deploy `Oracle1Balance` contract
   ```
   yarn hardhat deploy --tags Oracle1Balance --network mumbai
   ```
4. Verify contract (Optional)
   ```
   yarn hardhat etherscan-verify --network mumbai
   ```
5. Create Web3 Function task
   ```
   yarn hardhat run scripts/create-meta-task-oracle-1balance.ts --network mumbai
   ```
6. [Deposit funds on 1Balance](https://beta.app.gelato.network/balance)
