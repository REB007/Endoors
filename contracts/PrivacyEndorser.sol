// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";

// Forward declaration of Profiles contract interface
interface IProfiles {
    function endorseSkillPrivately(address target, bytes32 skillId) external;
}

/**
 * @title PrivacyEndorser
 * @notice Verifies Self proofs and issues private skill endorsements
 */
contract PrivacyEndorser is Ownable, SelfVerificationRoot {
    bytes32 public configId;
    IProfiles public profiles;

    // Nullifier to prevent replay attacks: keccak256(userIdentifier, userData)
    mapping(bytes32 => bool) public usedNullifiers;

    /**
     * @param _hub         Self Identity Verification Hub V2 address
     * @param _scope       SelfAppBuilder scope identifier
     * @param _profiles    Profiles contract address
     */
    constructor(
        address _hub,
        uint256 _scope,
        address _profiles
    ) SelfVerificationRoot(_hub, _scope) Ownable(_msgSender()) {
        profiles = IProfiles(_profiles);
    }

    /** @notice Owner can update the Self configId for proof requests */
    function setConfigId(bytes32 _configId) external onlyOwner {
        configId = _configId;
    }

    /** @notice Owner can update the Profiles contract address */
    function setProfiles(address _profiles) external onlyOwner {
        profiles = IProfiles(_profiles);
    }

    /**
     * @dev Returns the active configId for Self proofs
     */
    function getConfigId(
        bytes32 /* _destinationChainId */,
        bytes32 /* _userIdentifier */,
        bytes memory /* _userDefinedData */
    ) public view override returns (bytes32) {
        return configId;
    }

    /**
     * @dev Custom hook triggered after a successful Self proof verification
     *      _output contains userIdentifier and other metadata
     *      _userData is the `userDefinedData` payload: encoded (target, skillId, timestamp, nonce)
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output,
        bytes memory _userData
    ) internal override {
        // Decode user payload
        (address target, bytes32 skillId, uint256 timestamp) = abi.decode(_userData, (address, bytes32, uint256));

        // Prevent replay: derive nullifier from user identifier and payload
        bytes32 nullifier = keccak256(abi.encodePacked(_output.userIdentifier, _userData));
        require(!usedNullifiers[nullifier], "PrivacyEndorser: proof already used");
        usedNullifiers[nullifier] = true;

        // Optional expiry check (e.g., 1 hour)
        require(block.timestamp <= timestamp + 1 hours, "PrivacyEndorser: proof expired");

        // Issue private endorsement
        profiles.endorseSkillPrivately(target, skillId);
    }
}
