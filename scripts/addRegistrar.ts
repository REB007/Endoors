import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n==============================================");
  console.log("Deploying L2Registrar and adding to registry...");
  console.log("==============================================\n");

  // Get the registry address from environment variables
  const registryAddress = process.env.L2_REGISTRY_ADDRESS;
  if (!registryAddress) {
    throw new Error("L2_REGISTRY_ADDRESS not set in environment variables");
  }
  console.log(`Using L2Registry at address: ${registryAddress}`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Get the L2Registry contract factory
  const registryAbi = [
    "function addRegistrar(address) external",
    "function registrars(address) external view returns (bool)"
  ];
  const registry = new ethers.Contract(registryAddress, registryAbi, deployer);

  // Deploy the L2Registrar contract
  console.log("Deploying L2Registrar...");
  const L2Registrar = await ethers.getContractFactory("L2Registrar");
  const registrar = await L2Registrar.deploy(registryAddress);
  await registrar.waitForDeployment();
  const registrarAddress = await registrar.getAddress();
  console.log(`L2Registrar deployed to: ${registrarAddress}`);

  // Add the registrar to the registry
  console.log("Adding registrar to registry...");
  const tx = await registry.addRegistrar(registrarAddress);
  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  
  // Verify the registrar was added
  const isRegistrar = await registry.registrars(registrarAddress);
  if (isRegistrar) {
    console.log("✅ Registrar successfully added to registry");
  } else {
    console.log("❌ Failed to add registrar to registry");
  }

  console.log("\n==============================================");
  console.log("Deployment complete!");
  console.log("==============================================\n");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
