// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BeaconToken
 * @dev SportBeaconAI's native ERC-20 token for creator rewards and governance
 */
contract BeaconToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant REWARDS_ROLE = keccak256("REWARDS_ROLE");
    
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18; // 100M tokens
    uint256 public constant TEAM_ALLOCATION = 10_000_000 * 10**18; // 10% for team
    uint256 public constant ECOSYSTEM_ALLOCATION = 20_000_000 * 10**18; // 20% for ecosystem
    uint256 public constant REWARDS_ALLOCATION = 50_000_000 * 10**18; // 50% for rewards
    uint256 public constant COMMUNITY_ALLOCATION = 20_000_000 * 10**18; // 20% for community
    
    // Vesting and reward tracking
    mapping(address => uint256) public lastRewardClaim;
    mapping(address => uint256) public totalRewardsClaimed;
    
    // Events
    event RewardsIssued(address indexed recipient, uint256 amount, string reason);
    event RewardsClaimed(address indexed recipient, uint256 amount);
    event TeamTokensReleased(address indexed recipient, uint256 amount);
    
    constructor(address _owner) ERC20("Beacon Token", "BEACON") {
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(MINTER_ROLE, _owner);
        _grantRole(PAUSER_ROLE, _owner);
        _grantRole(REWARDS_ROLE, _owner);
        
        // Initial token distribution
        _mint(_owner, TEAM_ALLOCATION);
        _mint(address(this), ECOSYSTEM_ALLOCATION + REWARDS_ALLOCATION + COMMUNITY_ALLOCATION);
    }
    
    /**
     * @dev Issue rewards to a creator
     * @param recipient The address to receive rewards
     * @param amount The amount of tokens to issue
     * @param reason The reason for the reward (e.g., "milestone_achieved", "engagement_bonus")
     */
    function issueRewards(
        address recipient, 
        uint256 amount, 
        string memory reason
    ) external onlyRole(REWARDS_ROLE) nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(address(this)) >= amount, "Insufficient rewards balance");
        
        _transfer(address(this), recipient, amount);
        lastRewardClaim[recipient] = block.timestamp;
        totalRewardsClaimed[recipient] += amount;
        
        emit RewardsIssued(recipient, amount, reason);
    }
    
    /**
     * @dev Batch issue rewards to multiple creators
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to issue
     * @param reasons Array of reasons for rewards
     */
    function batchIssueRewards(
        address[] memory recipients,
        uint256[] memory amounts,
        string[] memory reasons
    ) external onlyRole(REWARDS_ROLE) nonReentrant {
        require(
            recipients.length == amounts.length && 
            amounts.length == reasons.length, 
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            issueRewards(recipients[i], amounts[i], reasons[i]);
        }
    }
    
    /**
     * @dev Release team tokens (with vesting logic)
     * @param recipient The team member address
     * @param amount The amount to release
     */
    function releaseTeamTokens(
        address recipient, 
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, recipient, amount);
        emit TeamTokensReleased(recipient, amount);
    }
    
    /**
     * @dev Get total rewards claimed by an address
     * @param account The address to check
     * @return Total rewards claimed
     */
    function getTotalRewardsClaimed(address account) external view returns (uint256) {
        return totalRewardsClaimed[account];
    }
    
    /**
     * @dev Get last reward claim timestamp
     * @param account The address to check
     * @return Last claim timestamp
     */
    function getLastRewardClaim(address account) external view returns (uint256) {
        return lastRewardClaim[account];
    }
    
    /**
     * @dev Get available rewards balance
     * @return Available rewards balance
     */
    function getRewardsBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
    
    // Override required functions
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
    
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from, 
        address to, 
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = balanceOf(address(this));
        if (balance > 0) {
            _transfer(address(this), msg.sender, balance);
        }
    }
} 