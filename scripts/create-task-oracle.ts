import { AutomateSDK } from "@gelatonetwork/automate-sdk";
import { deployments, ethers, w3f } from "hardhat";

const main = async () => {
  const oracleW3f = w3f.get("oracle");
  const oracleCid = await oracleW3f.deploy();

  console.log("Deployed Oracle W3F:", oracleCid);

  const oracle = await deployments.get("Oracle");
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();

  const automate = new AutomateSDK(chainId, deployer);

  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Oracle",
    web3FunctionHash: oracleCid,
    web3FunctionArgs: {
      contractAddress: oracle.address,
    },
    useTreasury: false,
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
