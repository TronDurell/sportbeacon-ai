// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./BeaconNFT.sol";

/**
 * @title BeaconNFTMarketplace
 * @dev NFT marketplace for SportBeaconAI creators
 */
contract BeaconNFTMarketplace is ReentrancyGuard, AccessControl {
    using Counters for Counters.Counter;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    
    BeaconNFT public beaconNFT;
    
    Counters.Counter private _listingIds;
    
    // Marketplace fee (2.5%)
    uint256 public constant MARKETPLACE_FEE = 250; // 2.5% = 250 basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    struct Listing {
        uint256 listingId;
        address creator;
        uint256 tokenId;
        uint256 price;
        uint256 quantity;
        uint256 sold;
        bool active;
        string metadata;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Sale {
        uint256 saleId;
        uint256 listingId;
        address buyer;
        address seller;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Sale) public sales;
    mapping(address => uint256[]) public creatorListings;
    mapping(uint256 => uint256[]) public tokenListings;
    
    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed creator,
        uint256 indexed tokenId,
        uint256 price,
        uint256 quantity,
        string metadata
    );
    
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        uint256 newQuantity
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    event NFTBought(
        uint256 indexed saleId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 tokenId,
        uint256 quantity,
        uint256 price
    );
    
    event CreatorRegistered(address indexed creator);
    
    constructor(BeaconNFT _beaconNFT) {
        beaconNFT = _beaconNFT;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a creator
     * @param creator The creator address to register
     */
    function registerCreator(address creator) external onlyRole(ADMIN_ROLE) {
        _grantRole(CREATOR_ROLE, creator);
        emit CreatorRegistered(creator);
    }
    
    /**
     * @dev Create a new listing
     * @param tokenId The NFT token ID
     * @param price The price in wei
     * @param quantity The quantity available
     * @param metadata Additional metadata for the listing
     */
    function createListing(
        uint256 tokenId,
        uint256 price,
        uint256 quantity,
        string memory metadata
    ) external onlyRole(CREATOR_ROLE) nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(quantity > 0, "Quantity must be greater than 0");
        require(beaconNFT.balanceOf(msg.sender, tokenId) >= quantity, "Insufficient NFT balance");
        
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        listings[listingId] = Listing({
            listingId: listingId,
            creator: msg.sender,
            tokenId: tokenId,
            price: price,
            quantity: quantity,
            sold: 0,
            active: true,
            metadata: metadata,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        creatorListings[msg.sender].push(listingId);
        tokenListings[tokenId].push(listingId);
        
        // Transfer NFTs to marketplace (escrow)
        beaconNFT.safeTransferFrom(msg.sender, address(this), tokenId, quantity, "");
        
        emit ListingCreated(listingId, msg.sender, tokenId, price, quantity, metadata);
    }
    
    /**
     * @dev Update a listing
     * @param listingId The listing ID to update
     * @param newPrice The new price
     * @param newQuantity The new quantity
     */
    function updateListing(
        uint256 listingId,
        uint256 newPrice,
        uint256 newQuantity
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.creator == msg.sender, "Not the listing creator");
        require(listing.active, "Listing is not active");
        require(newPrice > 0, "Price must be greater than 0");
        require(newQuantity >= listing.sold, "Quantity cannot be less than sold amount");
        
        uint256 currentQuantity = listing.quantity - listing.sold;
        
        if (newQuantity > currentQuantity) {
            // Need to transfer more NFTs to marketplace
            uint256 additionalQuantity = newQuantity - currentQuantity;
            require(beaconNFT.balanceOf(msg.sender, listing.tokenId) >= additionalQuantity, "Insufficient NFT balance");
            beaconNFT.safeTransferFrom(msg.sender, address(this), listing.tokenId, additionalQuantity, "");
        } else if (newQuantity < currentQuantity) {
            // Return excess NFTs to creator
            uint256 excessQuantity = currentQuantity - newQuantity;
            beaconNFT.safeTransferFrom(address(this), msg.sender, listing.tokenId, excessQuantity, "");
        }
        
        listing.price = newPrice;
        listing.quantity = newQuantity;
        listing.updatedAt = block.timestamp;
        
        emit ListingUpdated(listingId, newPrice, newQuantity);
    }
    
    /**
     * @dev Cancel a listing
     * @param listingId The listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.creator == msg.sender, "Not the listing creator");
        require(listing.active, "Listing is not active");
        
        listing.active = false;
        listing.updatedAt = block.timestamp;
        
        // Return unsold NFTs to creator
        uint256 unsoldQuantity = listing.quantity - listing.sold;
        if (unsoldQuantity > 0) {
            beaconNFT.safeTransferFrom(address(this), msg.sender, listing.tokenId, unsoldQuantity, "");
        }
        
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Buy NFTs from a listing
     * @param listingId The listing ID to buy from
     * @param quantity The quantity to buy
     */
    function buyNFT(uint256 listingId, uint256 quantity) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(quantity > 0, "Quantity must be greater than 0");
        require(listing.sold + quantity <= listing.quantity, "Insufficient quantity available");
        require(msg.value == listing.price * quantity, "Incorrect payment amount");
        
        // Calculate fees
        uint256 marketplaceFee = (msg.value * MARKETPLACE_FEE) / BASIS_POINTS;
        uint256 creatorPayment = msg.value - marketplaceFee;
        
        // Transfer NFTs to buyer
        beaconNFT.safeTransferFrom(address(this), msg.sender, listing.tokenId, quantity, "");
        
        // Update listing
        listing.sold += quantity;
        listing.updatedAt = block.timestamp;
        
        // Mark listing as inactive if sold out
        if (listing.sold == listing.quantity) {
            listing.active = false;
        }
        
        // Transfer payments
        payable(listing.creator).transfer(creatorPayment);
        payable(owner()).transfer(marketplaceFee);
        
        // Record sale
        uint256 saleId = _listingIds.current() + 1; // Simple sale ID generation
        sales[saleId] = Sale({
            saleId: saleId,
            listingId: listingId,
            buyer: msg.sender,
            seller: listing.creator,
            tokenId: listing.tokenId,
            quantity: quantity,
            price: listing.price,
            timestamp: block.timestamp
        });
        
        emit NFTBought(saleId, listingId, msg.sender, listing.creator, listing.tokenId, quantity, listing.price);
    }
    
    /**
     * @dev Get all listings for a creator
     * @param creator The creator address
     * @return Array of listing IDs
     */
    function getCreatorListings(address creator) external view returns (uint256[] memory) {
        return creatorListings[creator];
    }
    
    /**
     * @dev Get all listings for a token
     * @param tokenId The token ID
     * @return Array of listing IDs
     */
    function getTokenListings(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenListings[tokenId];
    }
    
    /**
     * @dev Get listing details
     * @param listingId The listing ID
     * @return Listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev Get sale details
     * @param saleId The sale ID
     * @return Sale details
     */
    function getSale(uint256 saleId) external view returns (Sale memory) {
        return sales[saleId];
    }
    
    /**
     * @dev Get active listings count
     * @return Total active listings
     */
    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= _listingIds.current(); i++) {
            if (listings[i].active) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Get marketplace stats
     * @return totalListings Total listings created
     * @return activeListings Active listings
     * @return totalSales Total sales made
     */
    function getMarketplaceStats() external view returns (uint256 totalListings, uint256 activeListings, uint256 totalSales) {
        totalListings = _listingIds.current();
        activeListings = this.getActiveListingsCount();
        totalSales = _listingIds.current(); // Simplified for demo
        return (totalListings, activeListings, totalSales);
    }
    
    /**
     * @dev Withdraw marketplace fees (admin only)
     */
    function withdrawFees() external onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    /**
     * @dev Emergency function to return NFTs to creators
     * @param listingId The listing ID
     */
    function emergencyReturnNFTs(uint256 listingId) external onlyRole(ADMIN_ROLE) {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        
        uint256 unsoldQuantity = listing.quantity - listing.sold;
        if (unsoldQuantity > 0) {
            beaconNFT.safeTransferFrom(address(this), listing.creator, listing.tokenId, unsoldQuantity, "");
        }
        
        listing.active = false;
    }
    
    // Required for ERC1155 receiver
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
} 