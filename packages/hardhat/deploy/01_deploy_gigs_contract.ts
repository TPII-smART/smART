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
    args: [deployer, "0x9a795B2D7F8edAB13206BB862016e375E57fFEE6"],
    log: true,
    autoMine: true,
  });

  const contract = await hre.ethers.getContract<Contract>(CONTRACT_NAME, deployer);
  console.log(`${CONTRACT_NAME} deployed at: ${contract.address}`);
};

deployedContract.tags = [CONTRACT_NAME];

export default deployedContract;
