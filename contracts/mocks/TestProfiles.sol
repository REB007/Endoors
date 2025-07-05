// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../Profiles.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

/**
 * @title TestProfiles
 * @dev Extension of Profiles contract with testing helpers
 */
contract TestProfiles is Profiles {
    constructor(address _identityVerificationHubV2, uint256 _scope) 
        Profiles(_identityVerificationHubV2, _scope) 
    {}
    
    /**
     * @dev Test function to simulate verification for a user
     * @param user Address of the user to verify
     */
    function testVerifyUser(address user) external onlyOwner {
        // Call the internal verification hook directly
        // We're using a special approach where we modify the storage directly
        // This is only for testing purposes
        users[user].verified = true;
        users[user].profileUri = "";
        
        // Initialize empty skills array
        for (uint256 i = 0; i < MAX_SKILLS; i++) {
            users[user].highlightedSkills[i] = bytes32(0);
        }
    }
    
    /**
     * @dev Test function to check if a user is verified
     * @param user Address of the user to check
     * @return bool True if the user is verified
     */
    function isVerified(address user) external view returns (bool) {
        return users[user].verified;
    }
}
