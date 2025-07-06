import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Constants from the Profiles module
const IDENTITY_VERIFICATION_HUB_TESTNET = "0x68c931C9a534D37aa78094877F46fE46a49F1A51";
const SELF_SCOPE_ID = "19578719266358898482253637888479350468064771842551764650421044070323271096743";
const CONFIG_ID = "0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61";

async function main() {
  console.log("\n==============================================");
  console.log("Starting direct deployment of Profiles System...");
  console.log("==============================================\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy Profiles contract
  console.log("Deploying Profiles contract...");
  const Profiles = await ethers.getContractFactory("Profiles");
  const profiles = await Profiles.deploy(
    IDENTITY_VERIFICATION_HUB_TESTNET,
    SELF_SCOPE_ID
  );
  await profiles.waitForDeployment();
  const profilesAddress = await profiles.getAddress();
  console.log(`Profiles deployed to: ${profilesAddress}`);

  // Deploy PrivacyEndorser contract
  console.log("\nDeploying PrivacyEndorser contract...");
  const PrivacyEndorser = await ethers.getContractFactory("PrivacyEndorser");
  const privacyEndorser = await PrivacyEndorser.deploy(
    IDENTITY_VERIFICATION_HUB_TESTNET,
    SELF_SCOPE_ID,
    profilesAddress
  );
  await privacyEndorser.waitForDeployment();
  const privacyEndorserAddress = await privacyEndorser.getAddress();
  console.log(`PrivacyEndorser deployed to: ${privacyEndorserAddress}`);

  // Set PrivacyEndorser in Profiles
  console.log("\nSetting PrivacyEndorser in Profiles contract...");
  const setPrivacyEndorserTx = await profiles.setPrivacyEndorser(privacyEndorserAddress);
  await setPrivacyEndorserTx.wait();
  console.log("PrivacyEndorser set in Profiles contract");

  // Set ConfigID in both contracts
  console.log("\nSetting ConfigID in both contracts...");
  const setProfilesConfigTx = await profiles.setConfigId(CONFIG_ID);
  await setProfilesConfigTx.wait();
  console.log("ConfigID set in Profiles contract");

  const setPrivacyEndorserConfigTx = await privacyEndorser.setConfigId(CONFIG_ID);
  await setPrivacyEndorserConfigTx.wait();
  console.log("ConfigID set in PrivacyEndorser contract");

  // Save deployment information
  const deploymentInfo = {
    profiles: profilesAddress,
    privacyEndorser: privacyEndorserAddress,
    deployedAt: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name
  };
  
  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n==============================================");
  console.log("Deployment completed successfully!");
  console.log(`Profiles contract: ${profilesAddress}`);
  console.log(`PrivacyEndorser contract: ${privacyEndorserAddress}`);
  console.log("Deployment information saved to deployment-info.json");
  console.log("==============================================\n");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
