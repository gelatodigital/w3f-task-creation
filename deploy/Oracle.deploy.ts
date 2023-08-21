import { deployments, ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { GELATO_ADDRESSES } from "@gelatonetwork/automate-sdk";

const name = "Oracle";

const func: DeployFunction = async () => {
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();
  const automate = GELATO_ADDRESSES[chainId].automate;

  await deployments.deploy(name, {
    from: deployer.address,
    args: [automate],
    log: true,
  });
};

func.tags = [name];

export default func;
