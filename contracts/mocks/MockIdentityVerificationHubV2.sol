// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";

/**
 * @title MockIdentityVerificationHubV2
 * @dev Mock implementation of IIdentityVerificationHubV2 for testing purposes
 */
contract MockIdentityVerificationHubV2 {
    mapping(address => bool) public verifiedUsers;
    
    // Implement only the functions we need for testing
    function verify(
        bytes32 _destinationChainId,
        bytes32 _userIdentifier,
        bytes calldata _userDefinedData,
        bytes calldata _attestationData
    ) external returns (bool) {
        // Mock implementation that always succeeds
        verifiedUsers[msg.sender] = true;
        return true;
    }
    
    function verifyGenericDiscloseV2(
        bytes32 _destinationChainId,
        bytes32 _userIdentifier,
        bytes calldata _userDefinedData,
        bytes calldata _attestationData
    ) external returns (SelfStructs.GenericDiscloseOutputV2 memory) {
        // Mock implementation that always succeeds
        verifiedUsers[msg.sender] = true;
        
        SelfStructs.GenericDiscloseOutputV2 memory outputData;
        // Set only the fields that exist in the struct
        outputData.attestationId = bytes32(uint256(1)); // Mock attestation ID
        // Note: attestationData and userDefinedData fields don't exist in the struct
        
        return outputData;
    }
    
    // Helper function for testing
    function setVerified(address user, bool verified) external {
        verifiedUsers[user] = verified;
    }
}
