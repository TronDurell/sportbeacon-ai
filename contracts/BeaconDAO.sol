// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BeaconToken.sol";

/**
 * @title BeaconDAO
 * @dev SportBeaconAI's DAO governance contract using OpenZeppelin Governor
 */
contract BeaconDAO is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorVotesQuorumFraction, 
    GovernorTimelockControl,
    AccessControl
{
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    BeaconToken public beaconToken;
    
    // Proposal metadata storage
    mapping(uint256 => string) public proposalDescriptions;
    mapping(uint256 => string) public proposalCategories;
    mapping(uint256 => uint256) public proposalFunding;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        string category,
        uint256 funding
    );
    event ProposalExecuted(uint256 indexed proposalId, address indexed executor);
    
    constructor(
        BeaconToken _beaconToken,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) 
        Governor("BeaconDAO")
        GovernorSettings(_votingDelay, _votingPeriod, 0) // No proposal threshold
        GovernorVotes(_beaconToken)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {
        beaconToken = _beaconToken;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new proposal with metadata
     * @param targets Array of target addresses for calls
     * @param values Array of ETH values for calls
     * @param calldatas Array of calldata for calls
     * @param description Description of the proposal
     * @param category Category of the proposal (e.g., "feature", "governance", "funding")
     * @param funding Amount of funding requested (in BEACON tokens)
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        string memory category,
        uint256 funding
    ) public returns (uint256) {
        require(hasRole(PROPOSER_ROLE, msg.sender) || beaconToken.balanceOf(msg.sender) >= 1000 * 10**18, "Insufficient voting power");
        
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        
        // Store proposal metadata
        proposalDescriptions[proposalId] = description;
        proposalCategories[proposalId] = category;
        proposalFunding[proposalId] = funding;
        
        emit ProposalCreated(proposalId, msg.sender, description, category, funding);
        
        return super.propose(targets, values, calldatas, description);
    }
    
    /**
     * @dev Execute a proposal
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override(Governor, GovernorTimelockControl) returns (uint256) {
        uint256 proposalId = super.execute(targets, values, calldatas, descriptionHash);
        emit ProposalExecuted(proposalId, msg.sender);
        return proposalId;
    }
    
    /**
     * @dev Get proposal metadata
     * @param proposalId The proposal ID
     * @return description Description of the proposal
     * @return category Category of the proposal
     * @return funding Funding amount requested
     */
    function getProposalMetadata(uint256 proposalId) 
        external 
        view 
        returns (string memory description, string memory category, uint256 funding) 
    {
        return (
            proposalDescriptions[proposalId],
            proposalCategories[proposalId],
            proposalFunding[proposalId]
        );
    }
    
    /**
     * @dev Get voting power for an account
     * @param account The account to check
     * @return Voting power in BEACON tokens
     */
    function getVotingPower(address account) external view returns (uint256) {
        return beaconToken.balanceOf(account);
    }
    
    /**
     * @dev Check if account can propose
     * @param account The account to check
     * @return True if account can propose
     */
    function canPropose(address account) external view returns (bool) {
        return hasRole(PROPOSER_ROLE, account) || beaconToken.balanceOf(account) >= 1000 * 10**18;
    }
    
    /**
     * @dev Get proposal state with additional info
     * @param proposalId The proposal ID
     * @return state The proposal state
     * @return votesFor Votes in favor
     * @return votesAgainst Votes against
     * @return votesAbstain Abstaining votes
     */
    function getProposalInfo(uint256 proposalId) 
        external 
        view 
        returns (
            ProposalState state,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 votesAbstain
        ) 
    {
        state = state(proposalId);
        (votesFor, votesAgainst, votesAbstain) = proposalVotes(proposalId);
        return (state, votesFor, votesAgainst, votesAbstain);
    }
    
    // Required overrides
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    
    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
    
    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }
    
    function proposalNeedsQueuing(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }
    
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(Governor, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 