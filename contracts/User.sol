// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NetworkProfiles {

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
        Skill[4] skills;
        SuperEndorsement[16] superMatrix; // 4x4 flattened
    }

    // --- Storage ---

    mapping(address => User) internal users;

    // --- Views ---

    function getSkills(address user) external view returns (Skill[4] memory) {
        return users[user].skills;
    }

    function getSuperEndorsedMatrix(address user) external view returns (SuperEndorsement[16] memory) {
        return users[user].superMatrix;
    }

    function getSuperEndorsementAt(address user, uint8 x, uint8 y) external view returns (SuperEndorsement memory) {
        require(x < 4 && y < 4, "Invalid matrix position");
        uint8 index = y * 4 + x;
        return users[user].superMatrix[index];
    }

    // --- Admin / Setup Functions (for testing) ---

    function setSkill(
        address user,
        uint256 index,
        string memory name,
        uint256 total,
        uint256 expert,
        bool expertStatus
    ) external {
        require(index < MAX_SKILLS, "Invalid skill slot");
        users[user].skills[index] = Skill(name, total, expert, expertStatus);
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
            endorser: msg.sender,
            x: x,
            y: y,
            message: message
        });
    }
}
