import { deployments, ethers, w3f } from "hardhat";
import {
  AutomateSDK,
  TriggerConfig,
  TriggerType,
} from "@gelatonetwork/automate-sdk";

const main = async () => {
  const oracleW3f = w3f.get("oracle");
  const oracleCid = await oracleW3f.deploy();

  console.log("Deployed Oracle W3F:", oracleCid);

  const oracle = await deployments.get("Oracle1Balance");
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();

  const automate = new AutomateSDK(chainId, deployer);

  const trigger: TriggerConfig = {
    type: TriggerType.TIME,
    interval: 60 * 1000, // 1 minute
  };

  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Oracle",
    web3FunctionHash: oracleCid,
    web3FunctionArgs: {
      contractAddress: oracle.address,
    },
    useTreasury: true,
    trigger,
  });

  await tx.wait();
  console.log(
    `Created W3F task: https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
