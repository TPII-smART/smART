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

  const arbitrationFee = parseEther("0.01"); // Set arbitration fee to 0.01 ETH

  await deploy(CONTRACT_NAME, {
    from: deployer,
    args: [
      "0xB7982f20CC159a40eba4b0eA86fd6cbA6Ff810e1", // Reality.eth contract address on Sepolia
      arbitrationFee,
    ],
    log: true,
  });

  const contract = await hre.ethers.getContract<Contract>(CONTRACT_NAME, deployer);
  console.log(`${CONTRACT_NAME} deployed at: ${contract.address}`);
};

deployedContract.tags = [CONTRACT_NAME];

export default deployedContract;
