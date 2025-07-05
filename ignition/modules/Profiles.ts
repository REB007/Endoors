import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IDENTITY_VERIFICATION_HUB_V2 = {
  // Mainnet address (replace with actual address when deploying to mainnet)
  celo: "0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF",
  // Testnet address (replace with actual address when deploying to testnet)
  testnet: "0x68c931C9a534D37aa78094877F46fE46a49F1A51",
};

// Self verification scope ID
// This should be obtained from Self when setting up your verification flow
const SELF_SCOPE_ID = 545502472891597700948915214426866708361168993393227193875317823653822637619; // Replace with your actual scope ID

// Config ID for the verification flow
const CONFIG_ID = "0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61"; // Replace with your actual config ID

export const ProfilesModule = buildModule("Profiles", (m) => {
  
  // Deploy the Profiles contract
  const profiles = m.contract("Profiles", [
    // Use a parameter for the hub address with a default value of localhost
    m.getParameter("identityVerificationHub", IDENTITY_VERIFICATION_HUB_V2.testnet),
    m.getParameter("scope", SELF_SCOPE_ID),
  ]);

  // Set the config ID after deployment
  m.call(profiles, "configId", [CONFIG_ID], { id: "setConfigId" });

  return { profiles };
});
