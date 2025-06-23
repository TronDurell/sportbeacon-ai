// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BeaconNFT
 * @dev SportBeaconAI's NFT contract for access passes and creator badges
 */
contract BeaconNFT is ERC1155, ERC1155Burnable, ERC1155Pausable, AccessControl, ReentrancyGuard {
    using Strings for uint256;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // NFT Token IDs
    uint256 public constant PREMIUM_COACH_PASS = 1;
    uint256 public constant TOP_CREATOR_BADGE = 2;
    uint256 public constant COMMUNITY_MODERATOR = 3;
    uint256 public constant EARLY_ADOPTER = 4;
    uint256 public constant MONTHLY_SUBSCRIPTION = 5;
    uint256 public constant YEARLY_SUBSCRIPTION = 6;
    
    // Metadata
    string public baseURI;
    string public contractURI;
    
    // Access control
    mapping(uint256 => bool) public tokenActive;
    mapping(uint256 => uint256) public tokenExpiry;
    mapping(address => mapping(uint256 => uint256)) public userTokenExpiry;
    
    // Events
    event NFTMinted(address indexed recipient, uint256 tokenId, uint256 amount, string reason);
    event NFTBurned(address indexed owner, uint256 tokenId, uint256 amount);
    event AccessGranted(address indexed user, uint256 tokenId, uint256 expiry);
    event AccessRevoked(address indexed user, uint256 tokenId);
    
    constructor(string memory _baseURI, string memory _contractURI) ERC1155(_baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        baseURI = _baseURI;
        contractURI = _contractURI;
        
        // Initialize token states
        tokenActive[PREMIUM_COACH_PASS] = true;
        tokenActive[TOP_CREATOR_BADGE] = true;
        tokenActive[COMMUNITY_MODERATOR] = true;
        tokenActive[EARLY_ADOPTER] = true;
        tokenActive[MONTHLY_SUBSCRIPTION] = true;
        tokenActive[YEARLY_SUBSCRIPTION] = true;
    }
    
    /**
     * @dev Mint NFT to a recipient
     * @param recipient The address to receive the NFT
     * @param tokenId The token ID to mint
     * @param amount The amount to mint
     * @param reason The reason for minting
     */
    function mintNFT(
        address recipient,
        uint256 tokenId,
        uint256 amount,
        string memory reason
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(tokenActive[tokenId], "Token not active");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(recipient, tokenId, amount, "");
        
        emit NFTMinted(recipient, tokenId, amount, reason);
    }
    
    /**
     * @dev Mint subscription NFT with expiry
     * @param recipient The address to receive the NFT
     * @param tokenId The subscription token ID
     * @param duration The duration in seconds
     */
    function mintSubscription(
        address recipient,
        uint256 tokenId,
        uint256 duration
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(tokenId == MONTHLY_SUBSCRIPTION || tokenId == YEARLY_SUBSCRIPTION, "Invalid subscription token");
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 expiry = block.timestamp + duration;
        userTokenExpiry[recipient][tokenId] = expiry;
        
        _mint(recipient, tokenId, 1, "");
        
        emit AccessGranted(recipient, tokenId, expiry);
    }
    
    /**
     * @dev Batch mint NFTs
     * @param recipients Array of recipient addresses
     * @param tokenIds Array of token IDs
     * @param amounts Array of amounts
     * @param reasons Array of reasons
     */
    function batchMintNFT(
        address[] memory recipients,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        string[] memory reasons
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(
            recipients.length == tokenIds.length && 
            tokenIds.length == amounts.length && 
            amounts.length == reasons.length, 
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            mintNFT(recipients[i], tokenIds[i], amounts[i], reasons[i]);
        }
    }
    
    /**
     * @dev Check if user has active access to a token
     * @param user The user address
     * @param tokenId The token ID to check
     * @return True if user has active access
     */
    function hasActiveAccess(address user, uint256 tokenId) public view returns (bool) {
        if (balanceOf(user, tokenId) == 0) return false;
        
        // Check if token has expiry
        uint256 expiry = userTokenExpiry[user][tokenId];
        if (expiry > 0) {
            return block.timestamp < expiry;
        }
        
        return true;
    }
    
    /**
     * @dev Get user's active tokens
     * @param user The user address
     * @return Array of active token IDs
     */
    function getActiveTokens(address user) external view returns (uint256[] memory) {
        uint256[] memory activeTokens = new uint256[](6);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= 6; i++) {
            if (hasActiveAccess(user, i)) {
                activeTokens[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeTokens[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get token expiry for user
     * @param user The user address
     * @param tokenId The token ID
     * @return Expiry timestamp (0 if no expiry)
     */
    function getTokenExpiry(address user, uint256 tokenId) external view returns (uint256) {
        return userTokenExpiry[user][tokenId];
    }
    
    /**
     * @dev Revoke access for a user
     * @param user The user address
     * @param tokenId The token ID to revoke
     */
    function revokeAccess(address user, uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(balanceOf(user, tokenId) > 0, "User doesn't own this token");
        
        _burn(user, tokenId, balanceOf(user, tokenId));
        userTokenExpiry[user][tokenId] = 0;
        
        emit AccessRevoked(user, tokenId);
    }
    
    /**
     * @dev Set token active status
     * @param tokenId The token ID
     * @param active The active status
     */
    function setTokenActive(uint256 tokenId, bool active) external onlyRole(ADMIN_ROLE) {
        tokenActive[tokenId] = active;
    }
    
    /**
     * @dev Set base URI for metadata
     * @param _baseURI The new base URI
     */
    function setBaseURI(string memory _baseURI) external onlyRole(ADMIN_ROLE) {
        baseURI = _baseURI;
    }
    
    /**
     * @dev Set contract URI
     * @param _contractURI The new contract URI
     */
    function setContractURI(string memory _contractURI) external onlyRole(ADMIN_ROLE) {
        contractURI = _contractURI;
    }
    
    /**
     * @dev Get token URI
     * @param tokenId The token ID
     * @return The token URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }
    
    /**
     * @dev Get contract URI
     * @return The contract URI
     */
    function contractURI() public view returns (string memory) {
        return contractURI;
    }
    
    // Override required functions
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Pausable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // Support for receiving ETH
    receive() external payable {}
} 