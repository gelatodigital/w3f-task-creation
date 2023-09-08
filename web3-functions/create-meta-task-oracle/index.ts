import { ethers } from "ethers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import {
  AutomateSDK,
  TriggerConfig,
  TriggerType,
} from "@gelatonetwork/automate-sdk";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { storage, userArgs, gelatoArgs, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  const subtaskId = await storage.get("subtaskId");
  if (subtaskId) return { canExec: false, message: "Subtask already running" };

  const signer = ethers.Wallet.createRandom().connect(provider);
  const automate = new AutomateSDK(gelatoArgs.chainId, signer);

  const cid = userArgs.cid as string;
  const useTreasury = userArgs.useTreasury as boolean;
  const creatorAddress = userArgs.creatorAddress as string;
  const contractAddress = userArgs.contractAddress as string;

  const trigger: TriggerConfig = {
    type: TriggerType.TIME,
    interval: 60 * 1000, // 1 minute
  };

  const { taskId, tx } = await automate.prepareBatchExecTask(
    {
      name: "Oracle",
      web3FunctionHash: cid,
      web3FunctionArgs: {
        contractAddress,
      },
      useTreasury,
      trigger,
    },
    {},
    creatorAddress
  );

  if (!tx.to || !tx.data)
    return { canExec: false, message: "Invalid transaction" };

  console.log("Creating new subtask:", taskId);
  await storage.set("subtaskId", taskId);

  return {
    canExec: true,
    callData: [
      {
        to: tx.to,
        data: tx.data,
      },
    ],
  };
});
