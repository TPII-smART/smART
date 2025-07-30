import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the GigsContract using the deployer account and
 * sets the owner to the deployer address.
 */
const deployGigsContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("GigsContract", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  const gigsContract = await hre.ethers.getContract<Contract>("GigsContract", deployer);
  console.log("Gigs contract deployed at:", gigsContract.address);
};

export default deployGigsContract;

deployGigsContract.tags = ["GigsContract"];
