import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Profiles Contract", function () {
  // Contract instances
  let profilesContract: any; // Will be TestProfiles
  let mockHubContract: any; // Will be MockIdentityVerificationHubV2
  let mockPrivacyEndorserContract: any; // Will be MockPrivacyEndorser
  
  // Signers
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  
  // Test values
  const mockScopeId = BigInt("545502472891597700948915214426866708361168993393227193875317823653822637619"); // Mock scope ID
  const mockConfigId = "0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61"; // Mock config ID
  
  // Test profile URI
  const testProfileUri = "ipfs://QmTest123456789";
  
  // Test skills
  const testSkills = ["Solidity", "React", "TypeScript", "Blockchain"];
  
  // Helper function to get skill ID
  function getSkillId(name: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(name));
  }
  
  // Helper function to mock verification for a user
  async function mockVerification(user: SignerWithAddress) {
    // Call our test helper function to simulate verification
    await profilesContract.connect(owner).testVerifyUser(user.address);
  }

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy the mock hub contract
    const MockHubFactory = await ethers.getContractFactory("MockIdentityVerificationHubV2");
    mockHubContract = await MockHubFactory.deploy();
    
    // Deploy the test profiles contract
    const TestProfilesFactory = await ethers.getContractFactory("TestProfiles");
    profilesContract = await TestProfilesFactory.deploy(await mockHubContract.getAddress(), mockScopeId);
    
    // Deploy the mock privacy endorser contract
    const MockPrivacyEndorserFactory = await ethers.getContractFactory("MockPrivacyEndorser");
    mockPrivacyEndorserContract = await MockPrivacyEndorserFactory.deploy(
      await mockHubContract.getAddress(), 
      mockScopeId,
      await profilesContract.getAddress()
    );
    
    // Set the config ID for both contracts
    await profilesContract.setConfigId(mockConfigId);
    await mockPrivacyEndorserContract.setConfigId(mockConfigId);
    
    // Set the privacy endorser in the profiles contract
    await profilesContract.setPrivacyEndorser(await mockPrivacyEndorserContract.getAddress());
    
    // Mock verification for test users
    await mockVerification(user1);
    await mockVerification(user2);
  });

  describe("Initialization", function () {
    it("Should set the correct owner", async function () {
      expect(await profilesContract.owner()).to.equal(owner.address);
    });
    
    it("Should set the correct identity verification hub", async function () {
      expect(await profilesContract.getIdentityVerificationHubV2()).to.equal(await mockHubContract.getAddress());
    });
    
    it("Should set the correct scope ID", async function () {
      expect(await profilesContract.scope()).to.equal(mockScopeId);
    });
    
    it("Should set the correct config ID", async function () {
      expect(await profilesContract.configId()).to.equal(mockConfigId);
    });
    
    it("Should set the correct privacy endorser", async function () {
      expect(await profilesContract.privacyEndorser()).to.equal(await mockPrivacyEndorserContract.getAddress());
    });
    
    it("Should verify users correctly", async function () {
      // Check that user1 and user2 are verified
      expect(await profilesContract.isVerified(user1.address)).to.be.true;
      expect(await profilesContract.isVerified(user2.address)).to.be.true;
      
      // Check that user3 is not verified
      expect(await profilesContract.isVerified(user3.address)).to.be.false;
      
      // Try to get the profile URI of user1 (should work if verified)
      // For view functions, we should just call it directly instead of using expect().to.not.be.reverted
      const uri = await profilesContract.getProfileUri(user1.address);
      // The URI should be an empty string since we haven't set it yet
      expect(uri).to.equal("");
      
      // Try to get the profile URI of user3 (should fail as not verified)
      await expect(profilesContract.getProfileUri(user3.address)).to.be.revertedWith("User not verified");
    });
  });

  describe("Profile Management", function () {
    it("Should set and get profile URI correctly", async function () {
      // Set profile URI for user1
      await profilesContract.connect(user1).setProfileUri(testProfileUri);
      
      // Check if the URI was set correctly
      expect(await profilesContract.getProfileUri(user1.address)).to.equal(testProfileUri);
    });
    
    it("Should fail to set profile URI for unverified users", async function () {
      // Try to set profile URI for unverified user3
      await expect(
        profilesContract.connect(user3).setProfileUri(testProfileUri)
      ).to.be.revertedWith("Not verified");
    });
  });

  describe("Skills Management", function () {
    it("Should set and get skills correctly", async function () {
      // Set skills for user1
      await profilesContract.connect(user1).setSkill(user1.address, 0, testSkills[0]);
      await profilesContract.connect(user1).setSkill(user1.address, 1, testSkills[1]);
      
      // Get the skills
      const skills = await profilesContract.getSkills(user1.address);
      
      // Check if the skills were set correctly
      expect(skills[0].name).to.equal(testSkills[0]);
      expect(skills[1].name).to.equal(testSkills[1]);
      expect(skills[0].totalEndorsements).to.equal(0);
      expect(skills[0].expertEndorsements).to.equal(0);
      expect(skills[0].isExpert).to.be.false;
    });
    
    it("Should fail to set skills for unverified users", async function () {
      // Try to set a skill for unverified user3
      await expect(
        profilesContract.connect(user1).setSkill(user3.address, 0, testSkills[0])
      ).to.be.revertedWith("Target not verified");
    });
    
    it("Should fail if caller is not verified", async function () {
      // Try to set a skill as unverified user3
      await expect(
        profilesContract.connect(user3).setSkill(user1.address, 0, testSkills[0])
      ).to.be.revertedWith("Caller not verified");
    });
    
    it("Should fail if skill slot is invalid", async function () {
      // Try to set a skill in an invalid slot
      await expect(
        profilesContract.connect(user1).setSkill(user1.address, 4, testSkills[0])
      ).to.be.revertedWith("Invalid skill slot");
    });
  });

  describe("Expert Skill Endorsements", function () {
    beforeEach(async function () {
      // Set up skills for user1 and user2
      await profilesContract.connect(user1).setSkill(user1.address, 0, testSkills[0]);
      await profilesContract.connect(user2).setSkill(user2.address, 0, testSkills[0]);
      await profilesContract.connect(user2).setSkill(user2.address, 1, testSkills[1]);
      
      // Make user1 an expert in the first skill by setting endorsements to threshold
      // This is a test helper that directly modifies the contract state
      const skillId = getSkillId(testSkills[0]);
      for (let i = 0; i < 100; i++) {
        await mockPrivacyEndorserContract.connect(owner).testEndorseSkillPrivately(user1.address, skillId);
      }
    });
    
    it("Should allow experts to endorse skills", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // User1 (now an expert) endorses user2's skill
      await profilesContract.connect(user1).expertEndorseSkill(user2.address, skillId);
      
      // Get the updated skills
      const skills = await profilesContract.getSkills(user2.address);
      
      // Check if the endorsement was counted as both a regular and expert endorsement
      expect(skills[0].totalEndorsements).to.equal(1);
      expect(skills[0].expertEndorsements).to.equal(1);
    });
    
    it("Should prevent double expert endorsements", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // User1 (expert) endorses user2's skill
      await profilesContract.connect(user1).expertEndorseSkill(user2.address, skillId);
      
      // Try to endorse again
      await expect(
        profilesContract.connect(user1).expertEndorseSkill(user2.address, skillId)
      ).to.be.revertedWith("Already endorsed");
    });
    
    it("Should fail if endorser is not an expert in the skill", async function () {
      // Get the skill ID for a skill user1 is not an expert in
      const skillId = getSkillId(testSkills[1]);
      
      await expect(
        profilesContract.connect(user1).expertEndorseSkill(user2.address, skillId)
      ).to.be.revertedWith("Not expert");
    });
    
    it("Should fail to expert endorse if caller is not verified", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // Try to endorse as unverified user3
      await expect(
        profilesContract.connect(user3).expertEndorseSkill(user2.address, skillId)
      ).to.be.revertedWith("Caller not verified");
    });
    
    it("Should fail to expert endorse if target is not verified", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // Try to endorse unverified user3
      await expect(
        profilesContract.connect(user1).expertEndorseSkill(user3.address, skillId)
      ).to.be.revertedWith("Target not verified");
    });
  });
  
  describe("Privacy Endorsements", function () {
    beforeEach(async function () {
      // Set up skills for user2
      await profilesContract.connect(user2).setSkill(user2.address, 0, testSkills[0]);
    });
    
    it("Should allow privacy endorser to endorse skills privately", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // Check initial endorsement count
      const initialSkills = await profilesContract.getSkills(user2.address);
      expect(initialSkills[0].totalEndorsements).to.equal(0);
      
      // Use the mock privacy endorser to endorse the skill
      await mockPrivacyEndorserContract.connect(owner).testEndorseSkillPrivately(user2.address, skillId);
      
      // Check that the endorsement was counted
      const updatedSkills = await profilesContract.getSkills(user2.address);
      expect(updatedSkills[0].totalEndorsements).to.equal(1);
    });
    
    it("Should fail if non-privacy endorser tries to call endorseSkillPrivately", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // Try to call the private endorsement function directly from a regular user
      await expect(
        profilesContract.connect(user1).endorseSkillPrivately(user2.address, skillId)
      ).to.be.revertedWith("Unauthorized endorser");
    });
    
    it("Should fail to privately endorse unverified users", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // Try to endorse unverified user3
      await expect(
        mockPrivacyEndorserContract.connect(owner).testEndorseSkillPrivately(user3.address, skillId)
      ).to.be.revertedWith("Target not verified");
    });
    
    it("Should make a user an expert after reaching threshold", async function () {
      // Get the skill ID
      const skillId = getSkillId(testSkills[0]);
      
      // Check that user2 is not an expert initially
      const initialSkills = await profilesContract.getSkills(user2.address);
      expect(initialSkills[0].isExpert).to.be.false;
      
      // Add enough endorsements to reach the expert threshold (100)
      for (let i = 0; i < 100; i++) {
        await mockPrivacyEndorserContract.connect(owner).testEndorseSkillPrivately(user2.address, skillId);
      }
      
      // Check that user2 is now an expert
      const updatedSkills = await profilesContract.getSkills(user2.address);
      expect(updatedSkills[0].isExpert).to.be.true;
    });
  });

  describe("Super Endorsements", function () {
    it("Should set super endorsements correctly", async function () {
      // Set a super endorsement from user1 to user2
      const x = 1;
      const y = 2;
      const message = "Great work on the smart contract!";
      
      await profilesContract.connect(user1).setSuperEndorsement(user2.address, x, y, message);
      
      // Get the super endorsement matrix
      const matrix = await profilesContract.getSuperEndorsedMatrix(user1.address);
      
      // Check if the super endorsement was set correctly
      const index = y * 4 + x;
      expect(matrix[index].endorser).to.equal(user1.address);
      expect(matrix[index].x).to.equal(x);
      expect(matrix[index].y).to.equal(y);
      expect(matrix[index].message).to.equal(message);
    });
    
    it("Should update existing super endorsements", async function () {
      // Set a super endorsement
      const x = 1;
      const y = 2;
      await profilesContract.connect(user1).setSuperEndorsement(user2.address, x, y, "First message");
      
      // Update the same super endorsement
      const newMessage = "Updated message";
      await profilesContract.connect(user1).setSuperEndorsement(user2.address, x, y, newMessage);
      
      // Get the super endorsement matrix
      const matrix = await profilesContract.getSuperEndorsedMatrix(user1.address);
      
      // Check if the super endorsement was updated
      const index = y * 4 + x;
      expect(matrix[index].message).to.equal(newMessage);
    });
    
    it("Should fail to set super endorsements with invalid coordinates", async function () {
      // Try to set a super endorsement with invalid coordinates
      await expect(
        profilesContract.connect(user1).setSuperEndorsement(user2.address, 4, 2, "Invalid")
      ).to.be.revertedWith("Invalid position");
    });
    
    it("Should fail to set super endorsements for unverified users", async function () {
      // Try to set a super endorsement for an unverified user
      await expect(
        profilesContract.connect(user1).setSuperEndorsement(user3.address, 1, 2, "Test")
      ).to.be.revertedWith("Target not verified");
    });
    
    it("Should fail to set super endorsements if caller is not verified", async function () {
      // Try to set a super endorsement as unverified user3
      await expect(
        profilesContract.connect(user3).setSuperEndorsement(user2.address, 1, 2, "Test")
      ).to.be.revertedWith("Caller not verified");
    });
  });
});
