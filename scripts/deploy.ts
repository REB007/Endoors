import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ProfilesModule } from "../ignition/modules/Profiles";
import hre from "hardhat";
import { ignition } from "hardhat";

async function main() {
  console.log("\n==============================================");
  console.log("Starting deployment of Profiles System...");
  console.log("==============================================\n");

  // Deploy using Ignition
  const deployment = await ignition.deploy(ProfilesModule);
  
  // Get the deployed contract instances
  const profilesAddress = await deployment.profiles.address;
  const privacyEndorserAddress = await deployment.privacyEndorser.address;
  
  console.log("\n==============================================");
  console.log(`Deployment completed successfully!`);
  console.log(`Profiles contract: ${profilesAddress}`);
  console.log(`PrivacyEndorser contract: ${privacyEndorserAddress}`);
  console.log("==============================================\n");

  // Save the addresses to a file for easy reference
  const fs = require('fs');
  const deploymentInfo = {
    profiles: profilesAddress,
    privacyEndorser: privacyEndorserAddress,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment information saved to deployment-info.json");

  // You can also verify the contracts on Etherscan here if needed
  // console.log("Verifying contracts on Etherscan...");
  // await hre.run("verify:verify", {
  //   address: profilesAddress,
  //   constructorArguments: [...],
  // });
  // await hre.run("verify:verify", {
  //   address: privacyEndorserAddress,
  //   constructorArguments: [...],
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
