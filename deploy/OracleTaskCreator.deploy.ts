import { deployments, ethers, w3f } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { GELATO_ADDRESSES } from "@gelatonetwork/automate-sdk";

const name = "OracleTaskCreator";

const func: DeployFunction = async () => {
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();
  const automate = GELATO_ADDRESSES[chainId].automate;

  const oracleW3f = w3f.get("oracle");
  const cid = await oracleW3f.deploy();

  await deployments.deploy(name, {
    from: deployer.address,
    args: [automate, cid],
    log: true,
  });
};

func.tags = [name];

export default func;
