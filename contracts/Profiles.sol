// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

contract Profiles is Ownable, SelfVerificationRoot {
    // Configuration
    bytes32 public configId;
    address public privacyEndorser;

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
        address endorser;
        uint8 x;
        uint8 y;
        string message;
    }

    struct User {
        bool verified;
        string profileUri;
        bytes32[4] highlightedSkills;
        mapping(bytes32 => Skill) skills;
        mapping(address => mapping(bytes32 => uint8)) endorsements;
        SuperEndorsement[MATRIX_SIZE] superMatrix;
    }

    // --- Storage ---
    mapping(address => User) internal users;

    // --- Constructor ---
    constructor(
        address _hub,
        uint256 _scope
    ) SelfVerificationRoot(_hub, _scope) Ownable(_msgSender()) {}

    // --- SelfVerificationRoot Overrides ---
    function getConfigId(
        bytes32 /*_destinationChainId*/,
        bytes32 /*_userIdentifier*/,
        bytes memory /*_userDefinedData*/
    ) public view override returns (bytes32) {
        return configId;
    }

    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory,
        bytes memory
    ) internal override {
        address sender = _msgSender();
        User storage u = users[sender];
        u.verified = true;
        u.profileUri = "";
        for (uint256 i = 0; i < MAX_SKILLS; i++) {
            u.highlightedSkills[i] = bytes32(0);
        }
    }

    // --- Owner Config Functions ---
    function setConfigId(bytes32 _configId) external onlyOwner {
        configId = _configId;
    }

    function setPrivacyEndorser(address _endorser) external onlyOwner {
        privacyEndorser = _endorser;
    }

    // --- Views ---
    function getProfileUri(address user) external view returns (string memory) {
        require(users[user].verified, "User not verified");
        return users[user].profileUri;
    }

    function getSkills(address user) external view returns (Skill[4] memory) {
        require(users[user].verified, "User not verified");
        Skill[4] memory out;
        for (uint256 i = 0; i < MAX_SKILLS; i++) {
            bytes32 id = users[user].highlightedSkills[i];
            out[i] = users[user].skills[id];
        }
        return out;
    }

    function getSuperEndorsedMatrix(address user) external view returns (SuperEndorsement[MATRIX_SIZE] memory) {
        require(users[user].verified, "User not verified");
        return users[user].superMatrix;
    }

    // --- User Functions ---
    function setProfileUri(string memory uri) external {
        require(users[_msgSender()].verified, "Not verified");
        users[_msgSender()].profileUri = uri;
    }

    function setSkill(
        address user,
        uint256 index,
        string memory name
    ) external {
        require(users[_msgSender()].verified, "Caller not verified");
        require(users[user].verified, "Target not verified");
        require(index < MAX_SKILLS, "Invalid skill slot");
        bytes32 skillId = keccak256(abi.encodePacked(name));
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
        require(users[target].verified, "Target not verified");
        require(x < 4 && y < 4, "Invalid position");
        uint8 idx = y * 4 + x;
        users[_msgSender()].superMatrix[idx] = SuperEndorsement({
            endorser: _msgSender(),
            x: x,
            y: y,
            message: message
        });
    }

    function expertEndorseSkill(
        address target,
        bytes32 skillId
    ) external {
        require(users[_msgSender()].verified, "Caller not verified");
        require(users[_msgSender()].skills[skillId].isExpert, "Not expert");
        require(users[target].verified, "Target not verified");
        require(users[target].endorsements[_msgSender()][skillId] == 0, "Already endorsed");

        users[target].endorsements[_msgSender()][skillId] = 2;
        users[target].skills[skillId].expertEndorsements++;
        users[target].skills[skillId].totalEndorsements++;
        if (users[target].skills[skillId].totalEndorsements >= EXPERT_THRESHOLD) {
            users[target].skills[skillId].isExpert = true;
        }
    }

    function endorseSkillPrivately(
        address target,
        bytes32 skillId
    ) external {
        require(msg.sender == privacyEndorser, "Unauthorized endorser");
        require(users[target].verified, "Target not verified");

        users[target].skills[skillId].totalEndorsements++;
        if (users[target].skills[skillId].totalEndorsements >= EXPERT_THRESHOLD) {
            users[target].skills[skillId].isExpert = true;
        }
    }
}
