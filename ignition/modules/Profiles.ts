import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IDENTITY_VERIFICATION_HUB_V2 = {
  // Mainnet address (replace with actual address when deploying to mainnet)
  celo: "0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF",
  // Testnet address (replace with actual address when deploying to testnet)
  testnet: "0x68c931C9a534D37aa78094877F46fE46a49F1A51",
};

// Self verification scope ID
// This should be obtained from Self when setting up your verification flow
// Using BigInt format to prevent overflow
const SELF_SCOPE_ID = "19578719266358898482253637888479350468064771842551764650421044070323271096743"; // Replace with your actual scope ID

// Config ID for the verification flow
const CONFIG_ID = "0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61"; // Replace with your actual config ID

export const ProfilesModule = buildModule("ProfilesSystemV2", (m) => {
  // Get the hub address parameter with a default value
  const hubAddress = m.getParameter("identityVerificationHub", IDENTITY_VERIFICATION_HUB_V2.testnet);
  const scopeId = m.getParameter("scope", SELF_SCOPE_ID);
  
  // Step 1: Deploy the Profiles contract
  const profiles = m.contract("Profiles", [
    hubAddress,
    scopeId,
  ]);

  // Step 2: Deploy the PrivacyEndorser contract with a dependency on Profiles
  const privacyEndorser = m.contract("PrivacyEndorser", [
    hubAddress,
    scopeId,
    // Reference the Profiles contract
    profiles
  ]);

  // Step 3: Set the PrivacyEndorser address in the Profiles contract
  m.call(profiles, "setPrivacyEndorser", [privacyEndorser], { 
    id: "setPrivacyEndorserInProfiles" 
  });

  // Step 4: Set the config ID for both contracts
  m.call(profiles, "setConfigId", [CONFIG_ID], { 
    id: "setProfilesConfigId" 
  });
  
  m.call(privacyEndorser, "setConfigId", [CONFIG_ID], { 
    id: "setPrivacyEndorserConfigId" 
  });

  // Return both contract instances so their addresses will be displayed in the deployment output
  return { profiles, privacyEndorser };
});
