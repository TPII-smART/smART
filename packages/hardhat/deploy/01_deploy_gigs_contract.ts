import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const CONTRACT_NAME = "GigsContract";

/**
 * Deploys the GigsContract using the deployer account and
 * sets the owner to the deployer address.
 */
const deployedContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy(CONTRACT_NAME, {
    from: deployer,
    args: [deployer, "0x2b1c8F0B3a7bE612C9F38576DF76e9967eE282D0"],
    log: true,
    autoMine: true,
  });

  const contract = await hre.ethers.getContract<Contract>(CONTRACT_NAME, deployer);
  console.log(`${CONTRACT_NAME} deployed at: ${contract.address}`);
};

deployedContract.tags = [CONTRACT_NAME];

export default deployedContract;
