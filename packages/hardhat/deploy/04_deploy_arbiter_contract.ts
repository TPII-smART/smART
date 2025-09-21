import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract, parseEther } from "ethers";

const CONTRACT_NAME = "ArbiterContract";

/**
 * Deploys the ArbiterContract using the deployer account and
 * sets the owner to the deployer address.
 */
const deployedContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const arbitrationFee = parseEther("0.001"); // Set arbitration fee to 0.001 ETH

  await deploy(CONTRACT_NAME, {
    from: deployer,
    args: [
      "0xeAD0ca922390a5E383A9D5Ba4366F7cfdc6f0dbA", // Reality.eth contract address on Sepolia
      arbitrationFee,
    ],
    log: true,
  });

  const contract = await hre.ethers.getContract<Contract>(CONTRACT_NAME, deployer);
  console.log(`${CONTRACT_NAME} deployed at: ${contract.address}`);
};

deployedContract.tags = [CONTRACT_NAME];

export default deployedContract;
