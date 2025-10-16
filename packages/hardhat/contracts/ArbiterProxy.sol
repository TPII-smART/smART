// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {IArbitrable} from "./common/IArbitrable.sol";
import {IArbitrableProxy} from "./common/IArbitrableProxy.sol";
import {IArbitrator} from "./common/IArbitrator.sol";
import {IEvidence} from "./common/IEvidence.sol";

/**
 * @title ArbiterProxy
 * @dev Pure internal ID architecture for arbitration
 *
 * Key Design Principle:
 * - Contract ONLY uses internal dispute IDs (localDisputeId) for all logic
 * - External IDs (talentId, gigId, etc.) are stored as metadata in the struct
 * - Frontend tracks externalId → localDisputeId mapping via events
 * - No on-chain mappings from external IDs to internal IDs
 */
contract ArbiterProxy is IArbitrableProxy, IArbitrable, IEvidence {

    // ============ Owners (multisig-lite) ============
    // List of addresses that are considered owners and can call owner-only methods
    address[] public owners;
    mapping(address => bool) public isOwner;

    // ============ State Variables ============

    IArbitrator public arbitrator;
    uint256 public disputeCount = 0;

    // Constants
    uint256 public constant AMOUNT_OF_CHOICES = 2;
    uint8 constant FREELANCER_WINS = 1;
    uint8 constant CLIENT_WINS = 2;
    string constant RULING_OPTIONS = "Freelancer is proven right;Client of the freelancer is proven right"; // A plain English of what rulings do. Need to be redefined by the child class.
    uint256 public constant FEE_DEPOSIT_TIMEOUT = 10 days;

    string metaEvidenceURI = "ipfs://test";

    // ============ Appeal Constants ============

    uint256 public constant WINNER_STAKE_MULTIPLIER = 10000; // Basis points (100%)
    uint256 public constant LOSER_STAKE_MULTIPLIER = 20000;  // Basis points (200%)
    uint256 public constant LOSER_APPEAL_PERIOD_MULTIPLIER = 5000; // 50% of total period
    uint256 public constant MULTIPLIER_DIVISOR = 10000;
    uint256 public constant OVERFLOW = type(uint256).max;

    /**
    * @dev Information about a funding round for appeals
    */
    struct Round {
        mapping(address => uint256) freelancerContributions; // Contributor address => amount contributed for freelancer
        mapping(address => uint256) clientContributions;    // Contributor address => amount contributed for client
        address[] freelancerContributors;  // List of contributors for freelancer
        address[] clientContributors;     // List of contributors for client
        uint256 freelancerPayedRoundFee; // Fees paid by freelancer
        uint256 clientPayedRoundFee;    // Fees paid by client
        uint256 feeRewards;            // Total fees to be distributed as rewards
        address freelancer;           // Address of the freelancer who paid
        address client;              // Address of the client who paid
        bool freelancerFullyFunded; // Whether the freelancer side is fully funded
        bool clientFullyFunded;    // Whether the client side is fully funded
        uint256 appealCost;       // Cost of appeal for this round
        uint256 appealDeadline;  // Timestamp when appeal period ends
    }

    /**
     * @dev Unified dispute structure for all dispute types
     * External IDs are stored as metadata only, not used for lookups
     *
     * Talent disputes:
     *   - externalId1 = talentId
     *   - externalId2 = hiredTalentId
     *
     * Gig disputes:
     *   - externalId1 = gigId
     *   - externalId2 = gigId (duplicated for consistency)
     */
    struct DisputeInfo {
        DisputeType disputeType;      // Type of dispute
        DisputeStatus status;          // Current status
        uint256 localDisputeId;        // Internal unified ID
        uint256 klerosDisputeId;       // Kleros arbitrator's dispute ID
        uint256 freelancerDisputeFee;  // Fees paid by freelancer
        uint256 clientDisputeFee;      // Fees paid by client
        uint256 feeDepositDeadline;    // Timestamp of the fee deposit deadline
        uint256 externalId1;           // Primary external identifier (metadata)
        uint256 externalId2;           // Secondary external identifier (metadata)
        bytes arbitratorExtraData;     // Extra data for arbitrator
        bool isRuled;                  // Whether the dispute has been ruled
        uint256 ruling;                // Final ruling (0=refused, 1=freelancer, 2=client)
        address freelancer;            // Freelancer address
        address client;                // Client address
        uint256 currentRound;          // Current appeal round (0 = initial dispute)
        mapping(uint256 => Round) rounds; // Round number => Round info
        uint256 metaEvidenceId;
        uint256 evidenceGroupId;
    }

    // ============ Storage Mappings ============

    // Main storage: internal dispute ID => DisputeInfo
    mapping(uint256 => DisputeInfo) public _disputes;

    // Reverse mapping: Kleros dispute ID => internal dispute ID
    mapping(uint256 => uint256) public klerosDisputeIdToLocalId;

    // ============ Modifiers ============

    modifier onlyOwners() {
        require(isOwner[msg.sender], "ArbiterProxy: caller is not an owner");
        _;
    }

    // ============ Constructor ============

    constructor(address _KlerosArbitrator) {
        arbitrator = IArbitrator(_KlerosArbitrator);
        owners.push(msg.sender);
        isOwner[msg.sender] = true;
    }

    // ============ Owner Management ============

    function addOwner(address _newOwner) external onlyOwners() {
        require(_newOwner != address(0), "Invalid address");
        require(!isOwner[_newOwner], "Already an owner");
        owners.push(_newOwner);
        isOwner[_newOwner] = true;
    }

    function removeOwner(address _owner) external onlyOwners() {
        require(isOwner[_owner], "Not an owner");
        require(owners.length > 1, "Cannot remove the last owner");

        // Remove from mapping
        isOwner[_owner] = false;

        // Remove from array
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function setMetaEvidenceURI(string calldata _metaEvidenceURI) external onlyOwners() {
        metaEvidenceURI = _metaEvidenceURI;
    }

    // ============ Core Arbitration Functions ============

    /**
     * @dev Create a new dispute
     * Returns the localDisputeId which must be used for all subsequent operations
     *
     * @param _externalId1 Primary external ID (talentId or gigId)
     * @param _externalId2 Secondary external ID (hiredTalentId or gigId)
     * @param _disputeType Type of dispute
     * @param _arbitratorExtraData Extra data for the arbitrator
     * @param _freelancer Freelancer address
     * @param _client Client address
     * @return localDisputeId The internal dispute ID to use for all operations
     */
    function createDispute(
        uint256 _externalId1,
        uint256 _externalId2,
        DisputeType _disputeType,
        bytes calldata _arbitratorExtraData,
        address _freelancer,
        address _client,
        string calldata _metaEvidenceURI
    ) public onlyOwners() returns (uint256 localDisputeId) {
        disputeCount++;
        localDisputeId = disputeCount;

        // Initialize the dispute by assigning fields individually because the struct contains mappings
        DisputeInfo storage dispute = _disputes[localDisputeId];
        dispute.disputeType = _disputeType;
        dispute.status = DisputeStatus.WaitingForFreelancerFee;
        dispute.localDisputeId = localDisputeId;
        dispute.klerosDisputeId = 0;
        dispute.freelancerDisputeFee = 0;
        dispute.clientDisputeFee = 0;
        dispute.feeDepositDeadline = block.timestamp + FEE_DEPOSIT_TIMEOUT;
        dispute.externalId1 = _externalId1;
        dispute.externalId2 = _externalId2;
        dispute.arbitratorExtraData = _arbitratorExtraData;
        dispute.isRuled = false;
        dispute.ruling = 0;
        dispute.freelancer = _freelancer;
        dispute.client = _client;
        dispute.currentRound = 0;
        // Generate random metaEvidenceId and evidenceGroupId
        dispute.metaEvidenceId = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, localDisputeId, "meta"))) % OVERFLOW;
        dispute.evidenceGroupId = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, localDisputeId, "evidence"))) % OVERFLOW;

        // Note: mapping fields inside the struct (e.g., rounds and Round.mappings) are auto-initialized as empty.

        emit MetaEvidence(dispute.metaEvidenceId, _metaEvidenceURI);

        // Emit type-specific creation event
        _emitDisputeCreatedEvent(
            localDisputeId,
            _disputeType,
            _externalId1,
            _externalId2,
            _freelancer,
            _client,
            dispute.feeDepositDeadline
        );

        return localDisputeId;
    }

    /**
     * @dev Pay arbitration fee by freelancer
     * @param _localDisputeId The internal dispute ID (from createDispute or events)
     */
    function payArbitrationFeeByFreelancer(
        address _caller,
        uint256 _localDisputeId,
        bytes calldata _arbitratorExtraData
    ) public onlyOwners() payable {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status != DisputeStatus.Resolved, "Dispute already resolved");

        require(
            block.timestamp <= dispute.feeDepositDeadline,
            "Fee deposit deadline has passed"
        );

        uint256 arbitrationCost = arbitrator.arbitrationCost(_arbitratorExtraData);

        // Update freelancer address if not set
        if (dispute.freelancer == address(0)) {
            dispute.freelancer = _caller;
        }

        require(dispute.freelancer == _caller, "Only freelancer can pay");

        dispute.freelancerDisputeFee += msg.value;

        require(
            dispute.freelancerDisputeFee >= arbitrationCost,
            "Not enough ETH to cover arbitration costs."
        );

        // Emit type-specific event
        _emitFreelancerPayedEvent(
            _localDisputeId,
            dispute.disputeType,
            dispute.externalId1,
            dispute.externalId2,
            _caller,
            msg.value,
            dispute.freelancerDisputeFee
        );

        // Check if both parties have paid
        if (dispute.clientDisputeFee >= arbitrationCost) {
            _raiseDispute(_localDisputeId, arbitrationCost);
        }
    }

    /**
     * @dev Pay arbitration fee by client
     * @param _localDisputeId The internal dispute ID (from createDispute or events)
     */
    function payArbitrationFeeByClient(
        address _caller,
        uint256 _localDisputeId,
        bytes calldata _arbitratorExtraData
    ) public onlyOwners() payable {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status != DisputeStatus.Resolved, "Dispute already resolved");

        require(
            block.timestamp <= dispute.feeDepositDeadline,
            "Fee deposit deadline has passed"
        );

        uint256 arbitrationCost = arbitrator.arbitrationCost(_arbitratorExtraData);

        // Update client address if not set
        if (dispute.client == address(0)) {
            dispute.client = _caller;
        }

        require(dispute.client == _caller, "Only client can pay");

        dispute.clientDisputeFee += msg.value;

        require(
            dispute.clientDisputeFee >= arbitrationCost,
            "Not enough ETH to cover arbitration costs."
        );

        // Emit type-specific event
        _emitClientPayedEvent(
            _localDisputeId,
            dispute.disputeType,
            dispute.externalId1,
            dispute.externalId2,
            _caller,
            msg.value,
            dispute.clientDisputeFee
        );

        // Check if both parties have paid
        if (dispute.freelancerDisputeFee >= arbitrationCost) {
            _raiseDispute(_localDisputeId, arbitrationCost);
        }
    }

    /**
    * @dev Conceede dispute in favor of the other party
    * @param _localDisputeId The internal dispute ID (from createDispute or events)
    * @param _winningSide 1 for freelancer, 2 for client
    */
    function concedeDispute(uint256 _localDisputeId, uint256 _winningSide) external onlyOwners() {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        require(dispute.localDisputeId != 0, "Dispute does not exist");
        if (_winningSide == FREELANCER_WINS) {
            require(dispute.status == DisputeStatus.WaitingForClientFee, "Cannot concede at this stage");
        } else if (_winningSide == CLIENT_WINS) {
            require(dispute.status == DisputeStatus.WaitingForFreelancerFee, "Cannot concede at this stage");
        } else {
            revert("Invalid winning side");
        }

        // Update dispute state
        dispute.status = DisputeStatus.Resolved;
        dispute.isRuled = true;
        dispute.ruling = _winningSide;

        // Reimburse the winning party if they paid
        address winningParty;
        uint256 reimbursement;
        if (_winningSide == FREELANCER_WINS) {
            winningParty = dispute.freelancer;
            reimbursement = dispute.freelancerDisputeFee;
        } else {
            winningParty = dispute.client;
            reimbursement = dispute.clientDisputeFee;
        }

        if (winningParty != address(0) && reimbursement > 0) {
            payable(winningParty).transfer(reimbursement);
        }

        if (dispute.disputeType == DisputeType.Talent) {
            emit TalentDisputeConceded(
                _localDisputeId,
                dispute.externalId1,  // talentId
                dispute.externalId2,  // hiredTalentId
                _winningSide,
                winningParty
            );
        } else if (dispute.disputeType == DisputeType.Gig) {
            emit GigDisputeConceded(
                _localDisputeId,
                dispute.externalId1,  // gigId
                _winningSide,
                winningParty
            );
        }
    }

    /**
    * @dev Get the current status of a dispute
    * @param _localDisputeId The internal dispute ID (from createDispute or events)
    */
    function getDisputeStatus(uint256 _localDisputeId) external view returns (IArbitrator.DisputeStatus) {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        return arbitrator.disputeStatus(dispute.klerosDisputeId);
    }

    /**
    * @dev Get the current ruling of a dispute
    * @param _localDisputeId The internal dispute ID (from createDispute or events)
    */
    function getCurrentRuling(uint256 _localDisputeId) external view returns (uint256) {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        return arbitrator.currentRuling(dispute.klerosDisputeId);
    }

    /**
    * @dev Get the arbitration cost for a new dispute or the appeal cost for the current round depending on the side
    * @param _localDisputeId The internal dispute ID (from createDispute or events)
    * @param _side 1 for freelancer, 2 for client
    */
    function getAppealCost(uint256 _localDisputeId, uint256 _side) external view returns (uint256) {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");

        if (dispute.status == DisputeStatus.WaitingForFreelancerFee || dispute.status == DisputeStatus.WaitingForClientFee) {
            // Dispute not yet raised, return arbitration cost
            return arbitrator.arbitrationCost(dispute.arbitratorExtraData);
        } else if (dispute.status == DisputeStatus.DisputeCreated && arbitrator.disputeStatus(dispute.klerosDisputeId) == IArbitrator.DisputeStatus.Appealable) {
            // Dispute raised and appealable, get appeal cost and apply multiplier
            uint256 appealCost = arbitrator.appealCost(dispute.klerosDisputeId, dispute.arbitratorExtraData);
            uint256 currentRuling = arbitrator.currentRuling(dispute.klerosDisputeId);
            if (_side == currentRuling) {
                // Winner side
                return (appealCost * WINNER_STAKE_MULTIPLIER) / MULTIPLIER_DIVISOR;
            } else {
                // Loser side
                return (appealCost * LOSER_STAKE_MULTIPLIER) / MULTIPLIER_DIVISOR;
            }
        } else {
            // Dispute resolved or not appealable
            return 0;
        }
    }

    function getAppealDeadline(uint256 _localDisputeId) external view returns (uint256) {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");

        if (dispute.status == DisputeStatus.DisputeCreated && arbitrator.disputeStatus(dispute.klerosDisputeId) == IArbitrator.DisputeStatus.Appealable) {
            (, uint256 appealEnd) = arbitrator.appealPeriod(dispute.klerosDisputeId);
            return appealEnd;
        } else {
            return 0;
        }
    }

    /**
    * @dev Check if a dispute fee payment has timed out
    * @param _localDisputeId The internal dispute ID (from createDispute or events)
    */
    function hasTimedOut(uint256 _localDisputeId) external view returns (bool) {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        if (dispute.status == DisputeStatus.WaitingForFreelancerFee || dispute.status == DisputeStatus.WaitingForClientFee) {
            return block.timestamp > dispute.feeDepositDeadline;
        } else {
            return false;
        }
    }

    /**
    * @dev Timeout dispute if one party fails to pay within deadline
    * Winner is the party who paid (or tried to pay)
    */
    function timeoutByInaction(uint256 _localDisputeId) external onlyOwners() {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status != DisputeStatus.DisputeCreated, "Dispute already raised");
        require(dispute.status != DisputeStatus.Resolved, "Dispute already resolved");
        require(
            block.timestamp > dispute.feeDepositDeadline,
            "Timeout period has not passed yet"
        );

        // Determine winner based on who paid
        uint256 ruling;
        address winner;
        uint256 reimbursement;

        bool freelancerPaid = dispute.freelancerDisputeFee != 0;
        bool clientPaid = dispute.clientDisputeFee != 0;

        if (freelancerPaid && !clientPaid) {
            // Freelancer paid, client didn't -> Freelancer wins
            ruling = FREELANCER_WINS;
            winner = dispute.freelancer;
            reimbursement = dispute.freelancerDisputeFee;
        } else if (clientPaid && !freelancerPaid) {
            // Client paid, freelancer didn't -> Client wins
            ruling = CLIENT_WINS;
            winner = dispute.client;
            reimbursement = dispute.clientDisputeFee;
        } else {
            // Both paid enough but timeout somehow triggered -> revert
            revert("Both parties paid, cannot timeout");
        }

        // Update dispute state
        dispute.status = DisputeStatus.Resolved;
        dispute.isRuled = true;
        dispute.ruling = ruling;

        // Reimburse winner
        if (winner != address(0) && reimbursement > 0) {
            payable(winner).transfer(reimbursement);
        }

        if (dispute.disputeType == DisputeType.Talent) {
            emit TalentDisputeTimeoutByInaction(
                _localDisputeId,
                dispute.externalId1,  // talentId
                dispute.externalId2,  // hiredTalentId
                ruling,
                winner
            );
        } else if (dispute.disputeType == DisputeType.Gig) {
            emit GigDisputeTimeoutByInaction(
                _localDisputeId,
                dispute.externalId1,  // gigId
                ruling,
                winner
            );
        }
    }

    /**
    * @dev Resolve all rounds' fees after final ruling
    * Winner is the party who paid (or tried to pay)
    */
    function _resolveRounds(uint256 _localDisputeId) internal {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        require(dispute.localDisputeId != 0, "Dispute does not exist");

        // Get last round using currentRound
        Round storage round = dispute.rounds[dispute.currentRound];

        // If one of the sides is fully funded but the other isn't, rule in favor of the funded side
        // Determine winner based on who paid
        uint256 ruling;

        bool freelancerFullyFunded = round.freelancerFullyFunded;
        bool clientFullyFunded = round.clientFullyFunded;

        if (freelancerFullyFunded && !clientFullyFunded) {
            // Freelancer fully funded, client didn't -> Freelancer wins
            ruling = FREELANCER_WINS;
            _distributeFeesAndRewards(_localDisputeId, FREELANCER_WINS, false);
        } else if (clientFullyFunded && !freelancerFullyFunded) {
            // Client fully funded, freelancer didn't -> Client wins
            ruling = CLIENT_WINS;
            _distributeFeesAndRewards(_localDisputeId, CLIENT_WINS, false);
        } else {
            // Neither fully funded -> Use arbitrator's ruling
            ruling = arbitrator.currentRuling(dispute.klerosDisputeId);
            _distributeFeesAndRewards(_localDisputeId, ruling, true);
        }
    }

    function _distributeFeesAndRewards(uint256 _localDisputeId, uint256 _ruling, bool _reimburseLast) internal {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        uint256 roundsToProcess = dispute.currentRound;

        // Distribute fees and rewards for the last round if needed
        if (_reimburseLast) {
            _resolveRoundFeesAndRewards(_localDisputeId, 0, dispute.currentRound);
            roundsToProcess--;            
        }
        // Iterate backwards through rounds to distribute fees and rewards
        for (uint256 r = roundsToProcess; ; r--) {
            _resolveRoundFeesAndRewards(_localDisputeId, _ruling, r);
            if (r == 0) break;
        }
    }

    function _resolveRoundFeesAndRewards(uint256 _localDisputeId, uint256 _ruling, uint256 _round) internal {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        Round storage round = dispute.rounds[_round];

        // Iterate over all contributions in the round
        for (uint256 i = 0; i < round.freelancerContributors.length; i++) {
            address contributor = round.freelancerContributors[i];
            uint256 contribution = round.freelancerContributions[contributor];
            if (contribution > 0) {
                uint256 reward;
                if (_ruling == FREELANCER_WINS) {
                    // Full reimbursement + share of fee rewards
                    reward = contribution + (round.feeRewards - round.freelancerPayedRoundFee) * contribution / round.freelancerPayedRoundFee;
                } else if (_ruling == 0) {
                    // Full reimbursement only
                    reward = contribution;
                } else {
                    // No reimbursement or rewards
                    reward = 0;
                }
                // Distribute rewards
                if (reward > 0) {
                    payable(contributor).transfer(reward);
                    _emitWithdrawnEvent(
                        _localDisputeId,
                        dispute.disputeType,
                        dispute.externalId1,
                        dispute.externalId2,
                        contributor,
                        reward
                    );
                }
            }
        }
        for (uint256 i = 0; i < round.clientContributors.length; i++) {
            address contributor = round.clientContributors[i];
            uint256 contribution = round.clientContributions[contributor];
            if (contribution > 0) {
                uint256 reward;
                if (_ruling == CLIENT_WINS) {
                    // Full reimbursement + share of fee rewards
                    reward = contribution + (round.feeRewards - round.clientPayedRoundFee) * contribution / round.clientPayedRoundFee;
                } else if (_ruling == 0) {
                    // Full reimbursement only
                    reward = contribution;
                } else {
                    // No reimbursement or rewards
                    reward = 0;
                }
                // Distribute rewards
                if (reward > 0) {
                    payable(contributor).transfer(reward);
                    _emitWithdrawnEvent(
                        _localDisputeId,
                        dispute.disputeType,
                        dispute.externalId1,
                        dispute.externalId2,
                        contributor,
                        reward
                    );
                }
            }
        }
    }

    function finalizeDispute(uint256 _localDisputeId) external {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status == DisputeStatus.DisputeCreated, "Dispute not in arbitration");
        require(!dispute.isRuled, "Dispute already ruled");

        arbitrator.executeRuling(dispute.klerosDisputeId);
    }

    // ============ Convenience Wrapper Functions ============

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Talent - Freelancer)
     */
    function startAndPayTalentDisputeByFreelancer(
        uint256 _talentId,
        uint256 _hiredTalentId,
        address _freelancer,
        address _client,
        bytes calldata _arbitratorExtraData,
        string calldata _metaEvidenceURI
    ) external payable onlyOwners() returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _talentId,
            _hiredTalentId,
            DisputeType.Talent,
            _arbitratorExtraData,
            _freelancer,
            _client,
            _metaEvidenceURI
        );

        payArbitrationFeeByFreelancer(_freelancer, localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Talent - Client)
     */
    function startAndPayTalentDisputeByClient(
        uint256 _talentId,
        uint256 _hiredTalentId,
        address _freelancer,
        address _client,
        bytes calldata _arbitratorExtraData,
        string calldata _metaEvidenceURI
    ) external payable onlyOwners() returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _talentId,
            _hiredTalentId,
            DisputeType.Talent,
            _arbitratorExtraData,
            _freelancer,
            _client,
            _metaEvidenceURI
        );

        payArbitrationFeeByClient(_client, localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Gig - Freelancer)
     */
    function createAndPayGigDisputeByFreelancer(
        uint256 _gigId,
        address _freelancer,
        address _client,
        bytes calldata _arbitratorExtraData,
        string calldata _metaEvidenceURI
    ) external payable onlyOwners() returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _gigId,
            _gigId,
            DisputeType.Gig,
            _arbitratorExtraData,
            _freelancer,
            _client,
            _metaEvidenceURI
        );

        payArbitrationFeeByFreelancer(_freelancer, localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Gig - Client)
     */
    function createAndPayGigDisputeByClient(
        uint256 _gigId,
        address _freelancer,
        address _client,
        bytes calldata _arbitratorExtraData,
        string calldata _metaEvidenceURI
    ) external payable onlyOwners() returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _gigId,
            _gigId,
            DisputeType.Gig,
            _arbitratorExtraData,
            _freelancer,
            _client,
            _metaEvidenceURI
        );

        payArbitrationFeeByClient(_client, localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    // ============ Internal Functions ============

    /**
     * @dev Emit type-specific dispute creation event
     */
    function _emitDisputeCreatedEvent(
        uint256 _localDisputeId,
        DisputeType _disputeType,
        uint256 _externalId1,
        uint256 _externalId2,
        address _freelancer,
        address _client,
        uint256 _feeDepositDeadline
    ) internal {
        if (_disputeType == DisputeType.Talent) {
            emit TalentDisputeCreated(
                _localDisputeId,
                _externalId1,  // talentId
                _externalId2,  // hiredTalentId
                _freelancer,
                _client,
                _feeDepositDeadline
            );
        } else if (_disputeType == DisputeType.Gig) {
            emit GigDisputeCreated(
                _localDisputeId,
                _externalId1,  // gigId
                _freelancer,
                _client,
                _feeDepositDeadline
            );
        }
    }

    /**
     * @dev Emit type-specific event for freelancer payment
     */
    function _emitFreelancerPayedEvent(
        uint256 _localDisputeId,
        DisputeType _disputeType,
        uint256 _externalId1,
        uint256 _externalId2,
        address _freelancer,
        uint256 _amountPaid,
        uint256 _totalAmountPaid
    ) internal {
        if (_disputeType == DisputeType.Talent) {
            emit FreelancerPayedTalentArbitrationFee(
                _localDisputeId,
                _externalId1,  // talentId
                _externalId2,  // hiredTalentId
                _freelancer,
                _amountPaid,
                _totalAmountPaid
            );
        } else if (_disputeType == DisputeType.Gig) {
            emit FreelancerPayedGigArbitrationFee(
                _localDisputeId,
                _externalId1,  // gigId
                _freelancer,
                _amountPaid,
                _totalAmountPaid
            );
        }
    }

    /**
     * @dev Emit type-specific event for client payment
     */
    function _emitClientPayedEvent(
        uint256 _localDisputeId,
        DisputeType _disputeType,
        uint256 _externalId1,
        uint256 _externalId2,
        address _client,
        uint256 _amountPaid,
        uint256 _totalAmountPaid
    ) internal {
        if (_disputeType == DisputeType.Talent) {
            emit ClientPayedTalentArbitrationFee(
                _localDisputeId,
                _externalId1,  // talentId
                _externalId2,  // hiredTalentId
                _client,
                _amountPaid,
                _totalAmountPaid
            );
        } else if (_disputeType == DisputeType.Gig) {
            emit ClientPayedGigArbitrationFee(
                _localDisputeId,
                _externalId1,  // gigId
                _client,
                _amountPaid,
                _totalAmountPaid
            );
        }
    }

    /**
     * @dev Emit type-specific event for dispute raised
     */
    function _emitDisputeRaisedEvent(
        uint256 _localDisputeId,
        uint256 _klerosDisputeId,
        DisputeType _disputeType,
        uint256 _externalId1,
        uint256 _externalId2
    ) internal {
        if (_disputeType == DisputeType.Talent) {
            emit TalentDisputeRaised(
                _localDisputeId,
                _klerosDisputeId,
                _externalId1,  // talentId
                _externalId2   // hiredTalentId
            );
        } else if (_disputeType == DisputeType.Gig) {
            emit GigDisputeRaised(
                _localDisputeId,
                _klerosDisputeId,
                _externalId1   // gigId
            );
        }
    }

    /**
     * @dev Emit type-specific event for dispute raised
     */
    function _emitWithdrawnEvent(
        uint256 _localDisputeId,
        DisputeType _disputeType,
        uint256 _externalId1,
        uint256 _externalId2,
        address _beneficiary,
        uint256 _amount
    ) internal {
        if (_disputeType == DisputeType.Talent) {
            emit TalentFeesAndRewardsWithdrawn(
                _localDisputeId,
                _externalId1,  // talentId
                _externalId2,   // hiredTalentId
                _beneficiary,
                _amount
            );
        } else if (_disputeType == DisputeType.Gig) {
            emit GigFeesAndRewardsWithdrawn(
                _localDisputeId,
                _externalId1,   // gigId
                _beneficiary,
                _amount
            );
        }
    }

    /**
     * @dev Create a dispute in Kleros once both parties have paid
     */
    function _raiseDispute(
        uint256 _localDisputeId,
        uint256 _arbitrationCost
    ) internal {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        require(
            dispute.status != DisputeStatus.DisputeCreated &&
            dispute.status != DisputeStatus.Resolved,
            "Dispute already created or resolved"
        );

        require(!dispute.isRuled, "Dispute already ruled");

        // Pay to Kleros the arbitration cost of one side, the coins from the other party are kept in the contract
        uint256 klerosDisputeId = arbitrator.createDispute{value: _arbitrationCost}(
            AMOUNT_OF_CHOICES,
            dispute.arbitratorExtraData
        );

        dispute.klerosDisputeId = klerosDisputeId;
        dispute.status = DisputeStatus.DisputeCreated;
        klerosDisputeIdToLocalId[klerosDisputeId] = _localDisputeId;

        // Initialize round 0 with initial fees paid
        Round storage round = dispute.rounds[0];
        round.freelancerContributors.push(dispute.freelancer);
        round.freelancerContributions[dispute.freelancer] = dispute.freelancerDisputeFee;
        round.clientContributors.push(dispute.client);
        round.clientContributions[dispute.client] = dispute.clientDisputeFee;
        round.freelancerPayedRoundFee = dispute.freelancerDisputeFee;
        round.clientPayedRoundFee = dispute.clientDisputeFee;
        round.freelancerFullyFunded = true;
        round.clientFullyFunded = true;
        round.feeRewards = dispute.freelancerDisputeFee + dispute.clientDisputeFee - _arbitrationCost;
        
        dispute.currentRound = 1;

        // Emit ERC-1497 Dispute event
        
        emit Dispute(arbitrator, klerosDisputeId, dispute.metaEvidenceId, dispute.evidenceGroupId);
        


        // Emit type-specific custom event
        _emitDisputeRaisedEvent(
            _localDisputeId,
            klerosDisputeId,
            dispute.disputeType,
            dispute.externalId1,
            dispute.externalId2
        );
    }

    /**
     * @dev Execute a ruling of a dispute
     */
    function _executeRuling(uint256 _localDisputeId, uint256 _ruling) internal {
        require(_ruling <= AMOUNT_OF_CHOICES, "Invalid ruling.");

        DisputeInfo storage dispute = _disputes[_localDisputeId];
        require(dispute.status == DisputeStatus.DisputeCreated, "Dispute not in correct state");
        require(!dispute.isRuled, "Dispute already ruled");

        // Update dispute state
        dispute.status = DisputeStatus.Resolved;
        dispute.isRuled = true;
        dispute.ruling = _ruling;

        _resolveRounds(_localDisputeId);

        if (dispute.disputeType == DisputeType.Talent) {
            emit TalentRuling(
                _localDisputeId,
                dispute.externalId1,  // talentId
                dispute.externalId2,  // hiredTalentId
                _ruling
            );
        } else if (dispute.disputeType == DisputeType.Gig) {
            emit GigRuling(
                _localDisputeId,
                dispute.externalId1,  // gigId
                _ruling
            );
        }
    }

    // ============ ERC-792 Implementation ============

    /**
     * @dev Give a ruling for a dispute. Called by the arbitrator.
     */
    function rule(uint256 _disputeId, uint256 _ruling) external {
        require(msg.sender == address(arbitrator), "Only arbitrator can rule");

        uint256 localDisputeId = klerosDisputeIdToLocalId[_disputeId];
        require(localDisputeId != 0, "Dispute does not exist");

        _executeRuling(localDisputeId, _ruling);

        emit Ruling(arbitrator, _disputeId, _ruling);
        
    }

    // ============ Appealing logic ============

    /**
    * @dev Fund an appeal. Can be called by anyone (crowdfunding).
    * @param _localDisputeId The internal dispute ID
    * @param _side The side to fund: 1=Freelancer, 2=Client
    */
    function fundAppeal(
        address _caller,
        uint256 _localDisputeId,
        uint8 _side
    ) external onlyOwners() payable {
        DisputeInfo storage dispute = _disputes[_localDisputeId];

        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status == DisputeStatus.DisputeCreated, "Dispute not in arbitration");
        require(!dispute.isRuled, "Dispute already ruled");
        require(_side == FREELANCER_WINS || _side == CLIENT_WINS, "Invalid side");

        // Check appeal period
        (uint256 appealStart, uint256 appealEnd) = arbitrator.appealPeriod(dispute.klerosDisputeId);
        require(block.timestamp >= appealStart && block.timestamp < appealEnd, "Appeal period is over");

        uint256 currentRuling = arbitrator.currentRuling(dispute.klerosDisputeId);
        require(currentRuling != 0, "Ruling not yet given");

        uint256 multiplier;
        if (_side == currentRuling) {
            // Winner side needs to pay 100%
            multiplier = WINNER_STAKE_MULTIPLIER;
            // Winner can only appeal during the full period
        } else {
            // Loser side needs to pay 200%
            multiplier = LOSER_STAKE_MULTIPLIER;
            // Loser has only half the appeal period
            uint256 loserDeadline = appealStart + ((appealEnd - appealStart) * LOSER_APPEAL_PERIOD_MULTIPLIER) / MULTIPLIER_DIVISOR;
            require(block.timestamp < loserDeadline, "Loser appeal period is over");
        }

        Round storage round = dispute.rounds[dispute.currentRound];
        
        uint256 baseAppealCost = arbitrator.appealCost(dispute.klerosDisputeId, dispute.arbitratorExtraData);

        // Calculate appeal cost if not yet set for this round
        if (round.appealCost == 0) {
            round.appealCost = baseAppealCost;
            round.appealDeadline = appealEnd;
        }

        if (baseAppealCost == OVERFLOW) {
            // Someone already paid full appeal cost
            _createAppeal(_localDisputeId, true);
            if (dispute.disputeType == DisputeType.Talent)
                emit TalentAppealExternallyFunded(_localDisputeId, dispute.currentRound, dispute.externalId1, dispute.externalId2);
            else if (dispute.disputeType == DisputeType.Gig)
                emit GigAppealExternallyFunded(_localDisputeId, dispute.currentRound, dispute.externalId1);
        }

        uint256 requiredAmount = (round.appealCost * multiplier) / MULTIPLIER_DIVISOR;
        uint256 contribution = msg.value;

        uint256 remainingToPay;
        if (_side == FREELANCER_WINS) {
            remainingToPay = requiredAmount - round.freelancerPayedRoundFee;
        } else {
            remainingToPay = requiredAmount - round.clientPayedRoundFee;
        }

        // Cap contribution to what's needed
        if (contribution > remainingToPay) {
            contribution = remainingToPay;
            // Refund excess
            payable(_caller).transfer(msg.value - contribution);
        }

        require(contribution > 0, "No contribution needed");

        uint256 totalPaid;

        // Update round data with contributions to the appeal
        if (_side == FREELANCER_WINS) {
            if (round.freelancerContributions[_caller] == 0) {
                round.freelancerContributors.push(_caller);
            }
            round.freelancerContributions[_caller] += contribution;
            round.freelancerPayedRoundFee += contribution;
            totalPaid = round.freelancerPayedRoundFee;
        } else {
            if (round.clientContributions[_caller] == 0) {
                round.clientContributors.push(_caller);
            }
            round.clientContributions[_caller] += contribution;
            round.clientPayedRoundFee += contribution;
            totalPaid = round.clientPayedRoundFee;
        }

        if (dispute.disputeType == DisputeType.Talent)
            emit TalentAppealContribution(
                _localDisputeId,
                dispute.currentRound,
                dispute.externalId1,  // talentId
                dispute.externalId2,  // hiredTalentId
                _side,
                _caller,
                contribution,
                totalPaid,
                requiredAmount
            );
        else if (dispute.disputeType == DisputeType.Gig)
            emit GigAppealContribution(
                _localDisputeId,
                dispute.currentRound,
                dispute.externalId1,  // talentId or gigId
                _side,
                _caller,
                contribution,
                totalPaid,
                requiredAmount
            );

        // Check if side has fully funded
        if (_side == FREELANCER_WINS && round.freelancerPayedRoundFee >= requiredAmount) {
            round.freelancerFullyFunded = true;
        } else if (_side == CLIENT_WINS && round.clientPayedRoundFee >= requiredAmount) {
            round.clientFullyFunded = true;
        }

        // Check if both sides have paid -> create new appeal
        if (round.freelancerFullyFunded && round.clientFullyFunded) {
            // Start a new round
            _createAppeal(_localDisputeId, false);
        }
    }

    /**
    * @dev Create an appeal in Kleros after both sides have funded
    * @param _localDisputeId The internal dispute ID
    */
    function _createAppeal(uint256 _localDisputeId, bool already_funded) internal {
        DisputeInfo storage dispute = _disputes[_localDisputeId];
        Round storage round = dispute.rounds[dispute.currentRound];

        if (!already_funded) {
            // Appeal in Kleros
            arbitrator.appeal{value: round.appealCost}(
                dispute.klerosDisputeId,
                dispute.arbitratorExtraData
            );
        } else {
            round.appealCost = 0;
        }

        round.feeRewards = round.freelancerPayedRoundFee + round.clientPayedRoundFee - round.appealCost;

        if (dispute.disputeType == DisputeType.Talent)
            emit TalentAppealCreated(
                _localDisputeId,
                dispute.klerosDisputeId,
                dispute.currentRound,
                dispute.externalId1,  // talentId
                dispute.externalId2   // hiredTalentId
            );
        else if (dispute.disputeType == DisputeType.Gig)
            emit GigAppealCreated(
                _localDisputeId,
                dispute.klerosDisputeId,
                dispute.currentRound,
                dispute.externalId1   // gigId
            );
            
        // Move to next round
        dispute.currentRound++;
    }
}