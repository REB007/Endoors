// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Profiles is Ownable {

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
        string profileUri;
        bytes32[4] highlightedSkills;
        mapping (address => mapping(bytes32 => uint8)) endorsements;
        mapping (bytes32 => Skill) skills; // 0 if not endorsed, 1 if endorsed, 2 if expert
        SuperEndorsement[16] superMatrix; // 4x4 flattened
    }

    // --- Storage ---

    mapping (address => User) internal users;

    // --- Constructor ---
    constructor() Ownable(_msgSender()) {}

    // --- Views ---

    function getSkills(address user) external view returns (Skill[4] memory) {
        Skill[4] memory userSkills;
        for (uint256 i = 0; i < MAX_SKILLS; i++) {
            userSkills[i] = users[user].skills[users[user].highlightedSkills[i]];
        }
        return userSkills;
    }

    function getSuperEndorsedMatrix(address user) external view returns (SuperEndorsement[16] memory) {
        return users[user].superMatrix;
    }


    // --- Admin / Setup Functions (for testing) ---

    function setSkill(
        address user,
        uint256 index,
        string memory name
    ) external {
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
        require(x < 4 && y < 4, "Invalid matrix position");
        uint8 index = y * 4 + x;
        users[target].superMatrix[index] = SuperEndorsement({
            endorser: _msgSender(),
            x: x,
            y: y,
            message: message
        });
    }

    // setProfileUri is used to set the profile URI for a user
    function setProfileUri(
        string memory uri
    ) external {
        users[_msgSender()].profileUri = uri;
    }

    function endorseSkill(
        address target,
        bytes32 skillId
    ) external {
        require(target != address(0), "Invalid target address");
        require(users[target].endorsements[_msgSender()][skillId] == 0, "Already endorsed this skill");
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
