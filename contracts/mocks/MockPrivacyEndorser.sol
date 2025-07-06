// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../PrivacyEndorser.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

/**
 * @title MockPrivacyEndorser
 * @dev Extension of PrivacyEndorser contract with testing helpers
 */
contract MockPrivacyEndorser is PrivacyEndorser {
    constructor(address _identityVerificationHubV2, uint256 _scope, address _profiles) 
        PrivacyEndorser(_identityVerificationHubV2, _scope, _profiles) 
    {}
    
    /**
     * @dev Test function to simulate a private endorsement
     * @param target Address of the user to endorse
     * @param skillId ID of the skill to endorse
     */
    function testEndorseSkillPrivately(address target, bytes32 skillId) external onlyOwner {
        // Call the profiles contract directly to simulate a private endorsement
        profiles.endorseSkillPrivately(target, skillId);
    }
    
    /**
     * @dev Test function to check if a nullifier has been used
     * @param nullifier The nullifier to check
     * @return bool True if the nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    /**
     * @dev Test function to set a nullifier as used
     * @param nullifier The nullifier to mark as used
     */
    function setNullifierUsed(bytes32 nullifier) external onlyOwner {
        usedNullifiers[nullifier] = true;
    }
}
