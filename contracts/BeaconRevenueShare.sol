// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BeaconRevenueShare
 * @dev Revenue sharing contract for SportsBeaconDAO using OpenZeppelin's PaymentSplitter
 */
contract BeaconRevenueShare is PaymentSplitter, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct RevenueShare {
        uint256 shareId;
        address creator;
        uint256 shares;
        uint256 totalReleased;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct RevenueStream {
        uint256 streamId;
        string name;
        uint256 totalRevenue;
        uint256 totalDistributed;
        uint256 creatorCount;
        bool isActive;
        uint256 createdAt;
    }

    Counters.Counter private _shareIds;
    Counters.Counter private _streamIds;

    mapping(uint256 => RevenueShare) public revenueShares;
    mapping(uint256 => RevenueStream) public revenueStreams;
    mapping(address => uint256[]) public creatorShares;
    mapping(uint256 => address[]) public streamCreators;

    event RevenueShareCreated(uint256 indexed shareId, address indexed creator, uint256 shares);
    event RevenueShareUpdated(uint256 indexed shareId, address indexed creator, uint256 shares);
    event RevenueShareDeactivated(uint256 indexed shareId, address indexed creator);
    event RevenueStreamCreated(uint256 indexed streamId, string name);
    event RevenueReceived(uint256 indexed streamId, address indexed from, uint256 amount);
    event RevenueDistributed(uint256 indexed streamId, address indexed creator, uint256 amount);

    constructor() PaymentSplitter(new address[](0), new uint256[](0)) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DAO_ROLE, msg.sender);
    }

    /**
     * @dev Create a new revenue share for a creator
     * @param creator The creator's address
     * @param shares The number of shares for this creator
     */
    function createRevenueShare(address creator, uint256 shares) 
        external 
        onlyRole(DAO_ROLE) 
        returns (uint256) 
    {
        require(creator != address(0), "Invalid creator address");
        require(shares > 0, "Shares must be greater than 0");

        _shareIds.increment();
        uint256 shareId = _shareIds.current();

        revenueShares[shareId] = RevenueShare({
            shareId: shareId,
            creator: creator,
            shares: shares,
            totalReleased: 0,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        creatorShares[creator].push(shareId);

        emit RevenueShareCreated(shareId, creator, shares);
        return shareId;
    }

    /**
     * @dev Update an existing revenue share
     * @param shareId The share ID to update
     * @param shares The new number of shares
     */
    function updateRevenueShare(uint256 shareId, uint256 shares) 
        external 
        onlyRole(DAO_ROLE) 
    {
        require(revenueShares[shareId].creator != address(0), "Share does not exist");
        require(shares > 0, "Shares must be greater than 0");

        RevenueShare storage share = revenueShares[shareId];
        share.shares = shares;
        share.updatedAt = block.timestamp;

        emit RevenueShareUpdated(shareId, share.creator, shares);
    }

    /**
     * @dev Deactivate a revenue share
     * @param shareId The share ID to deactivate
     */
    function deactivateRevenueShare(uint256 shareId) 
        external 
        onlyRole(DAO_ROLE) 
    {
        require(revenueShares[shareId].creator != address(0), "Share does not exist");
        
        RevenueShare storage share = revenueShares[shareId];
        share.isActive = false;
        share.updatedAt = block.timestamp;

        emit RevenueShareDeactivated(shareId, share.creator);
    }

    /**
     * @dev Create a new revenue stream
     * @param name The name of the revenue stream
     */
    function createRevenueStream(string memory name) 
        external 
        onlyRole(DAO_ROLE) 
        returns (uint256) 
    {
        require(bytes(name).length > 0, "Name cannot be empty");

        _streamIds.increment();
        uint256 streamId = _streamIds.current();

        revenueStreams[streamId] = RevenueStream({
            streamId: streamId,
            name: name,
            totalRevenue: 0,
            totalDistributed: 0,
            creatorCount: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        emit RevenueStreamCreated(streamId, name);
        return streamId;
    }

    /**
     * @dev Add creators to a revenue stream
     * @param streamId The stream ID
     * @param creators Array of creator addresses
     * @param shares Array of shares for each creator
     */
    function addCreatorsToStream(
        uint256 streamId, 
        address[] memory creators, 
        uint256[] memory shares
    ) 
        external 
        onlyRole(DAO_ROLE) 
    {
        require(revenueStreams[streamId].streamId != 0, "Stream does not exist");
        require(creators.length == shares.length, "Arrays length mismatch");

        RevenueStream storage stream = revenueStreams[streamId];
        
        for (uint256 i = 0; i < creators.length; i++) {
            require(creators[i] != address(0), "Invalid creator address");
            require(shares[i] > 0, "Shares must be greater than 0");

            // Create revenue share for this creator
            uint256 shareId = createRevenueShare(creators[i], shares[i]);
            
            // Add to stream creators
            streamCreators[streamId].push(creators[i]);
            stream.creatorCount++;
        }
    }

    /**
     * @dev Receive revenue for a specific stream
     * @param streamId The stream ID to receive revenue for
     */
    function receiveRevenue(uint256 streamId) 
        external 
        payable 
        nonReentrant 
    {
        require(revenueStreams[streamId].streamId != 0, "Stream does not exist");
        require(msg.value > 0, "Amount must be greater than 0");

        RevenueStream storage stream = revenueStreams[streamId];
        stream.totalRevenue += msg.value;

        emit RevenueReceived(streamId, msg.sender, msg.value);
    }

    /**
     * @dev Distribute revenue to creators in a stream
     * @param streamId The stream ID to distribute from
     */
    function distributeRevenue(uint256 streamId) 
        external 
        onlyRole(DAO_ROLE) 
        nonReentrant 
    {
        require(revenueStreams[streamId].streamId != 0, "Stream does not exist");
        
        RevenueStream storage stream = revenueStreams[streamId];
        address[] memory creators = streamCreators[streamId];
        
        uint256 totalShares = 0;
        uint256[] memory creatorShares = new uint256[](creators.length);
        
        // Calculate total shares and get individual shares
        for (uint256 i = 0; i < creators.length; i++) {
            uint256[] memory creatorShareIds = creatorShares[creators[i]];
            uint256 creatorTotalShares = 0;
            
            for (uint256 j = 0; j < creatorShareIds.length; j++) {
                RevenueShare storage share = revenueShares[creatorShareIds[j]];
                if (share.isActive) {
                    creatorTotalShares += share.shares;
                }
            }
            
            creatorShares[i] = creatorTotalShares;
            totalShares += creatorTotalShares;
        }
        
        require(totalShares > 0, "No active shares found");
        
        uint256 availableRevenue = address(this).balance;
        require(availableRevenue > 0, "No revenue to distribute");
        
        // Distribute revenue proportionally
        for (uint256 i = 0; i < creators.length; i++) {
            if (creatorShares[i] > 0) {
                uint256 amount = (availableRevenue * creatorShares[i]) / totalShares;
                if (amount > 0) {
                    payable(creators[i]).transfer(amount);
                    stream.totalDistributed += amount;
                    
                    // Update creator's total released
                    uint256[] memory creatorShareIds = creatorShares[creators[i]];
                    for (uint256 j = 0; j < creatorShareIds.length; j++) {
                        RevenueShare storage share = revenueShares[creatorShareIds[j]];
                        if (share.isActive) {
                            share.totalReleased += (amount * share.shares) / creatorShares[i];
                        }
                    }
                    
                    emit RevenueDistributed(streamId, creators[i], amount);
                }
            }
        }
    }

    /**
     * @dev Get creator's revenue shares
     * @param creator The creator's address
     * @return Array of share IDs
     */
    function getCreatorShares(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorShares[creator];
    }

    /**
     * @dev Get stream creators
     * @param streamId The stream ID
     * @return Array of creator addresses
     */
    function getStreamCreators(uint256 streamId) 
        external 
        view 
        returns (address[] memory) 
    {
        return streamCreators[streamId];
    }

    /**
     * @dev Get creator's total shares across all streams
     * @param creator The creator's address
     * @return Total shares
     */
    function getCreatorTotalShares(address creator) 
        external 
        view 
        returns (uint256) 
    {
        uint256[] memory shareIds = creatorShares[creator];
        uint256 totalShares = 0;
        
        for (uint256 i = 0; i < shareIds.length; i++) {
            RevenueShare storage share = revenueShares[shareIds[i]];
            if (share.isActive) {
                totalShares += share.shares;
            }
        }
        
        return totalShares;
    }

    /**
     * @dev Get creator's total released amount
     * @param creator The creator's address
     * @return Total released amount
     */
    function getCreatorTotalReleased(address creator) 
        external 
        view 
        returns (uint256) 
    {
        uint256[] memory shareIds = creatorShares[creator];
        uint256 totalReleased = 0;
        
        for (uint256 i = 0; i < shareIds.length; i++) {
            RevenueShare storage share = revenueShares[shareIds[i]];
            totalReleased += share.totalReleased;
        }
        
        return totalReleased;
    }

    /**
     * @dev Emergency withdraw function for admin
     */
    function emergencyWithdraw() 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * @dev Override required by Solidity
     */
    function _pendingPayment(address account, uint256 shares, uint256 totalReleased) 
        internal 
        view 
        virtual 
        override 
        returns (uint256) 
    {
        return super._pendingPayment(account, shares, totalReleased);
    }

    /**
     * @dev Override required by Solidity
     */
    function _release(address payable account) 
        internal 
        virtual 
        override 
    {
        super._release(account);
    }
} 