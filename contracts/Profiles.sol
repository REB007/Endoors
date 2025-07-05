// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {AttestationId} from "@selfxyz/contracts/contracts/constants/AttestationId.sol";

contract Profiles is Ownable, SelfVerificationRoot {

    bytes32 public configId;

    uint256 constant EXPERT_THRESHOLD = 100;
    uint256 constant MAX_SKILLS = 4;
    uint8 constant MATRIX_SIZE = 16;

    // --- Structs ---

    struct Skill {
        string name;
        uint256 totalEndorsements;
        uint256 expertEndorsements;
        bool isExpert;
    }

    struct SuperEndorsement {
        address endorsed;
        uint8 x;
        uint8 y;
        string message;
    }

    struct User {
        bool verified;
        string profileUri;
        bytes32[4] highlightedSkills;
        mapping (address => mapping(bytes32 => uint8)) endorsements;
        mapping (bytes32 => Skill) skills; // 0 if not endorsed, 1 if endorsed, 2 if expert
        SuperEndorsement[16] superMatrix; // 4x4 flattened
    }

    // --- Storage ---

    mapping (address => User) internal users;

    // --- Constructor ---
    constructor(address _identityVerificationHubV2, uint256 _scope) 
        Ownable(msg.sender) 
        SelfVerificationRoot(_identityVerificationHubV2, _scope) 
    {}

    // --- SelfVerificationRoot ---

    
    function getConfigId(
        bytes32 _destinationChainId,
        bytes32 _userIdentifier, 
        bytes memory _userDefinedData // Custom data from the qr code configuration
    ) public view override returns (bytes32) {
        return configId;
    }

    // Override to handle successful verification
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output,
        bytes memory _userData
    ) internal virtual override {
        
        // Create an empty verified User for the sender
        address sender = _msgSender();
        users[sender].verified = true;
        
        // Initialize empty profile
        users[sender].profileUri = "";
        
        // Initialize empty skills array
        for (uint256 i = 0; i < MAX_SKILLS; i++) {
            users[sender].highlightedSkills[i] = bytes32(0);
        }
    }

    // --- Views ---

    function getUri(address user) external view returns (string memory) {
        require(users[user].verified, "User not verified");
        return users[user].profileUri;
    }

    function getSkills(address user) external view returns (Skill[4] memory) {
        require(users[user].verified, "User not verified");
        
        Skill[4] memory userSkills;
        for (uint256 i = 0; i < MAX_SKILLS; i++) {
            userSkills[i] = users[user].skills[users[user].highlightedSkills[i]];
        }
        return userSkills;
    }

    function getSuperEndorsedMatrix(address user) external view returns (SuperEndorsement[16] memory) {
        require(users[user].verified, "User not verified");
        
        return users[user].superMatrix;
    }


    // --- Admin / Setup Functions (for testing) ---

    function setConfigId(bytes32 _configId) external onlyOwner {
        configId = _configId;
    }

    function setSkill(
        address user,
        uint256 index,
        string memory name
    ) external {
        // Check if caller is verified
        require(users[_msgSender()].verified, "Caller not verified");
        
        // Check if target user is verified
        require(users[user].verified, "Target user not verified");
        
        require(index < MAX_SKILLS, "Invalid skill slot");
        bytes32 skillId = bytes32(keccak256(abi.encodePacked(name)));
        users[user].skills[skillId] = Skill(name, 0, 0, false);
        users[user].highlightedSkills[index] = skillId;
    }

    function setSuperEndorsement(
        address target,
        uint8 x,
        uint8 y,
        string memory message
    ) external {
        require(users[_msgSender()].verified, "Caller not verified");
        
        require(users[target].verified, "Target user not verified");
        
        require(x < 4 && y < 4, "Invalid matrix position");
        uint8 index = y * 4 + x;
        users[_msgSender()].superMatrix[index] = SuperEndorsement({
            endorsed: target,
            x: x,
            y: y,
            message: message
        });
    }

    // setProfileUri is used to set the profile URI for a user
    function setProfileUri(
        string memory uri
    ) external {
        // Check if caller is verified
        require(users[_msgSender()].verified, "User not verified");
        
        users[_msgSender()].profileUri = uri;
    }

    function endorseSkill(
        address target,
        bytes32 skillId
    ) external {
        // Check if caller is verified
        require(users[_msgSender()].verified, "Caller not verified");
        
        // Check if target user is verified
        require(users[target].verified, "Target user not verified");
        
        require(target != address(0), "Invalid target address");
        require(users[target].endorsements[_msgSender()][skillId] == 0, "Already endorsed this skill");
        
        // Check if the skill exists for the target user
        require(bytes(users[target].skills[skillId].name).length > 0, "Skill does not exist");
        
        if (users[target].skills[skillId].isExpert){
            users[target].endorsements[_msgSender()][skillId] = 2;
            users[target].skills[skillId].expertEndorsements++;
        }
        else {
            users[target].endorsements[_msgSender()][skillId] = 1;
        }
        
        users[target].skills[skillId].totalEndorsements++;
        if (users[target].skills[skillId].totalEndorsements >= EXPERT_THRESHOLD) 
            users[target].skills[skillId].isExpert = true;
    }
}
