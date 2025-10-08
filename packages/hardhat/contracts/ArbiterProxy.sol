// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

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
contract ArbiterProxy is IArbitrableProxy, IEvidence {

    // ============ State Variables ============

    IArbitrator public override arbitrator;
    uint256 public disputeCount = 0;

    // Constants
    uint256 public constant AMOUNT_OF_CHOICES = 2;
    uint8 constant FREELANCER_WINS = 1;
    uint8 constant CLIENT_WINS = 2;
    string constant RULING_OPTIONS = "Freelancer is proven right;Client of the freelancer is proven right"; // A plain English of what rulings do. Need to be redefined by the child class.
    uint256 public constant FEE_DEPOSIT_TIMEOUT = 10 days;

    // ============ Appeal Constants ============

    uint256 public constant WINNER_STAKE_MULTIPLIER = 10000; // Basis points (100%)
    uint256 public constant LOSER_STAKE_MULTIPLIER = 20000;  // Basis points (200%)
    uint256 public constant LOSER_APPEAL_PERIOD_MULTIPLIER = 5000; // 50% of total period
    uint256 public constant MULTIPLIER_DIVISOR = 10000;

    // ============ Enums ============

    /**
     * @dev Types of disputes that can be arbitrated
     */
    enum DisputeType {
        Talent,
        Gig
    }

    enum DisputeStatus {
        WaitingForFreelancerFee,
        WaitingForClientFee,
        DisputeCreated,
        Resolved
    }

    // ============ Structs ============


    /**
    * @dev Information about a funding round for appeals
    */
    struct Round {
        mapping(address => uint256) freelancerContributions; // Contributor address => amount contributed for freelancer
        mapping(address => uint256) clientContributions;    // Contributor address => amount contributed for client
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
    }

    // ============ Storage Mappings ============

    // Main storage: internal dispute ID => DisputeInfo
    mapping(uint256 => DisputeInfo) public disputes;

    // Reverse mapping: Kleros dispute ID => internal dispute ID
    mapping(uint256 => uint256) public klerosDisputeIdToLocalId;

    // ============ Type-Specific Events ============

    /**
     * @dev Emitted when a talent dispute is created
     * Frontend should index: talentId + hiredTalentId → localDisputeId
     */
    event TalentDisputeCreated(
        uint256 indexed localDisputeId,
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address freelancer,
        address client
    );

    event FreelancerPayedTalentArbitrationFee(
        uint256 indexed localDisputeId,
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address freelancer,
        uint256 amountPaid,
        uint256 totalAmountPaid
    );

    event ClientPayedTalentArbitrationFee(
        uint256 indexed localDisputeId,
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address client,
        uint256 amountPaid,
        uint256 totalAmountPaid
    );

    event TalentDisputeRaised(
        uint256 indexed localDisputeId,
        uint256 indexed klerosDisputeId,
        uint256 indexed talentId,
        uint256 hiredTalentId
    );

    /**
     * @dev Emitted when a gig dispute is created
     * Frontend should index: gigId → localDisputeId
     */
    event GigDisputeCreated(
        uint256 indexed localDisputeId,
        uint256 indexed gigId,
        address freelancer,
        address client
    );

    event FreelancerPayedGigArbitrationFee(
        uint256 indexed localDisputeId,
        uint256 indexed gigId,
        address indexed freelancer,
        uint256 amountPaid,
        uint256 totalAmountPaid
    );

    event ClientPayedGigArbitrationFee(
        uint256 indexed localDisputeId,
        uint256 indexed gigId,
        address indexed client,
        uint256 amountPaid,
        uint256 totalAmountPaid
    );

    event GigDisputeRaised(
        uint256 indexed localDisputeId,
        uint256 indexed klerosDisputeId,
        uint256 indexed gigId
    );

    event DisputeTimeoutByInaction(
        uint256 indexed localDisputeId,
        uint256 ruling,
        address winner
    );

    event Ruling(
        IArbitrator indexed arbitrator,
        uint256 indexed disputeID,
        uint256 ruling
    );

    event AppealContribution(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint8 side,
        address contributor,
        uint256 amount
    );

    event AppealCreated(
        uint256 indexed localDisputeId,
        uint256 indexed klerosDisputeId,
        uint256 indexed round
    );

    event FeesAndRewardsWithdrawn(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        address indexed beneficiary,
        uint256 reward
    );


    // ============ Constructor ============

    constructor(address _KlerosArbitrator) {
        arbitrator = IArbitrator(_KlerosArbitrator);
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
        address _client
    ) external returns (uint256 localDisputeId) {
        disputeCount++;
        localDisputeId = disputeCount;

        // Initialize the dispute
        disputes[localDisputeId] = DisputeInfo({
            disputeType: _disputeType,
            status: DisputeStatus.WaitingForFreelancerFee,
            localDisputeId: localDisputeId,
            klerosDisputeId: 0,
            freelancerDisputeFee: 0,
            clientDisputeFee: 0,
            feeDepositDeadline: block.timestamp + FEE_DEPOSIT_TIMEOUT,
            externalId1: _externalId1,
            externalId2: _externalId2,
            arbitratorExtraData: _arbitratorExtraData,
            isRuled: false,
            ruling: 0,
            freelancer: _freelancer,
            client: _client
        });

        // Emit type-specific creation event
        _emitDisputeCreatedEvent(
            localDisputeId,
            _disputeType,
            _externalId1,
            _externalId2,
            _freelancer,
            _client
        );

        return localDisputeId;
    }

    /**
     * @dev Pay arbitration fee by freelancer
     * @param _localDisputeId The internal dispute ID (from createDispute or events)
     */
    function payArbitrationFeeByFreelancer(
        uint256 _localDisputeId,
        bytes calldata _arbitratorExtraData
    ) public payable {
        DisputeInfo storage dispute = disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status != DisputeStatus.Resolved, "Dispute already resolved");

        require(
            block.timestamp <= dispute.feeDepositDeadline,
            "Fee deposit deadline has passed"
        );

        uint256 arbitrationCost = arbitrator.arbitrationCost(_arbitratorExtraData);

        // Update freelancer address if not set
        if (dispute.freelancer == address(0)) {
            dispute.freelancer = msg.sender;
        }

        require(dispute.freelancer == msg.sender, "Only freelancer can pay");

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
            msg.sender,
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
        uint256 _localDisputeId,
        bytes calldata _arbitratorExtraData
    ) public payable {
        DisputeInfo storage dispute = disputes[_localDisputeId];
        require(dispute.localDisputeId != 0, "Dispute does not exist");
        require(dispute.status != DisputeStatus.Resolved, "Dispute already resolved");

        require(
            block.timestamp <= dispute.feeDepositDeadline,
            "Fee deposit deadline has passed"
        );

        uint256 arbitrationCost = arbitrator.arbitrationCost(_arbitratorExtraData);

        // Update client address if not set
        if (dispute.client == address(0)) {
            dispute.client = msg.sender;
        }

        require(dispute.client == msg.sender, "Only client can pay");

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
            msg.sender,
            msg.value,
            dispute.clientDisputeFee
        );

        // Check if both parties have paid
        if (dispute.freelancerDisputeFee >= arbitrationCost) {
            _raiseDispute(_localDisputeId, arbitrationCost);
        }
    }

    /**
    * @dev Timeout dispute if one party fails to pay within deadline
    * Winner is the party who paid (or tried to pay)
    */
    function timeoutByInaction(uint256 _localDisputeId) external {
        DisputeInfo storage dispute = disputes[_localDisputeId];

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
            payable(winner).send(reimbursement);
        }

        emit DisputeTimeoutByInaction(_localDisputeId, ruling, winner);
    }


    // ============ Convenience Wrapper Functions ============

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Talent - Freelancer)
     */
    function startAndPayTalentDisputeByFreelancer(
        uint256 _talentId,
        uint256 _hiredTalentId,
        address _client,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _talentId,
            _hiredTalentId,
            DisputeType.Talent,
            _arbitratorExtraData,
            msg.sender,
            _client
        );

        payArbitrationFeeByFreelancer(localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Talent - Client)
     */
    function startAndPayTalentDisputeByClient(
        uint256 _talentId,
        uint256 _hiredTalentId,
        address _freelancer,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _talentId,
            _hiredTalentId,
            DisputeType.Talent,
            _arbitratorExtraData,
            _freelancer,
            msg.sender
        );

        payArbitrationFeeByClient(localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Gig - Freelancer)
     */
    function createAndPayGigDisputeByFreelancer(
        uint256 _gigId,
        address _client,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _gigId,
            _gigId,
            DisputeType.Gig,
            _arbitratorExtraData,
            msg.sender,
            _client
        );

        payArbitrationFeeByFreelancer(localDisputeId, _arbitratorExtraData);

        return localDisputeId;
    }

    /**
     * @dev Convenience: Create dispute and pay fee in one transaction (Gig - Client)
     */
    function createAndPayGigDisputeByClient(
        uint256 _gigId,
        address _freelancer,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId) {
        localDisputeId = createDispute(
            _gigId,
            _gigId,
            DisputeType.Gig,
            _arbitratorExtraData,
            _freelancer,
            msg.sender
        );

        payArbitrationFeeByClient(localDisputeId, _arbitratorExtraData);

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
        address _client
    ) internal {
        if (_disputeType == DisputeType.Talent) {
            emit TalentDisputeCreated(
                _localDisputeId,
                _externalId1,  // talentId
                _externalId2,  // hiredTalentId
                _freelancer,
                _client
            );
        } else if (_disputeType == DisputeType.Gig) {
            emit GigDisputeCreated(
                _localDisputeId,
                _externalId1,  // gigId
                _freelancer,
                _client
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
     * @dev Create a dispute in Kleros once both parties have paid
     */
    function _raiseDispute(
        uint256 _localDisputeId,
        uint256 _arbitrationCost
    ) internal {
        DisputeInfo storage dispute = disputes[_localDisputeId];

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
        dispute.currentRound = 0;
        klerosDisputeIdToLocalId[klerosDisputeId] = _localDisputeId;

        // Initialize round 0 with initial fees paid
        Round storage round = dispute.rounds[0];
        round.freelancerPayedRoundFee = dispute.freelancerDisputeFee;
        round.clientPayedRoundFee = dispute.clientDisputeFee;
        round.freelancerFullyFunded = true;
        round.clientFullyFunded = true;
        round.feeRewards = dispute.freelancerDisputeFee + dispute.clientDisputeFee - _arbitrationCost;

        // Emit ERC-1497 Dispute event
        // ToDO: metaEvidenceID and evidenceGroupID are both 0 for now
        emit Dispute(arbitrator, klerosDisputeId, 0, 0);

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

        DisputeInfo storage dispute = disputes[_localDisputeId];
        require(dispute.status == DisputeStatus.DisputeCreated, "Dispute not in correct state");
        require(!dispute.isRuled, "Dispute already ruled");

        // Update dispute state
        dispute.status = DisputeStatus.Resolved;
        dispute.isRuled = true;
        dispute.ruling = _ruling;
    }

    // ============ ERC-792 Implementation ============

    /**
     * @dev Give a ruling for a dispute. Called by the arbitrator.
     */
    function rule(uint256 _klerosDisputeId, uint256 _ruling) external override {
        require(msg.sender == address(arbitrator), "Only arbitrator can rule");

        uint256 localDisputeId = klerosDisputeIdToLocalId[_klerosDisputeId];
        require(localDisputeId != 0, "Dispute does not exist");

        _executeRuling(localDisputeId, _ruling);

        emit Ruling(arbitrator, _klerosDisputeId, _ruling);
    }

    // ============ Appealing logic ============

    /**
    * @dev Fund an appeal. Can be called by anyone (crowdfunding).
    * @param _localDisputeId The internal dispute ID
    * @param _side The side to fund: 1=Freelancer, 2=Client
    */
    function fundAppeal(
        uint256 _localDisputeId,
        uint8 _side
    ) external payable {
        DisputeInfo storage dispute = disputes[_localDisputeId];

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

        // Calculate appeal cost if not yet set for this round
        if (round.appealCost == 0) {
            uint256 baseAppealCost = arbitrator.appealCost(dispute.klerosDisputeId, dispute.arbitratorExtraData);
            round.appealCost = baseAppealCost;
            round.appealDeadline = appealEnd;
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
            payable(msg.sender).send(msg.value - contribution);
        }

        require(contribution > 0, "No contribution needed");

        // Update round data with contributions to the appeal
        if (_side == FREELANCER_WINS) {
            round.freelancerContributions[msg.sender] += contribution;
            round.freelancerPayedRoundFee += contribution;
        } else {
            round.clientContributions[msg.sender] += contribution;
            round.clientPayedRoundFee += contribution;
        }

        emit AppealContribution(
            _localDisputeId,
            dispute.currentRound,
            _side,
            msg.sender,
            contribution
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
            _createAppeal(_localDisputeId);
        }
    }

    /**
    * @dev Create an appeal in Kleros after both sides have funded
    * @param _localDisputeId The internal dispute ID
    */
    function _createAppeal(uint256 _localDisputeId) internal {
        DisputeInfo storage dispute = disputes[_localDisputeId];
        Round storage round = dispute.rounds[dispute.currentRound];

        // Appeal in Kleros
        arbitrator.appeal{value: round.appealCost}(
            dispute.klerosDisputeId,
            dispute.arbitratorExtraData
        );

        // Calculate fee rewards for this round
        // Total paid minus the appeal cost
        round.feeRewards = round.freelancerContributions + round.clientContributions - round.appealCost;

        // Move to next round
        dispute.currentRound++;

        emit AppealCreated(
            _localDisputeId,
            dispute.klerosDisputeId,
            dispute.currentRound - 1
        );
    }

    /**
     * @dev Withdraw appeal fees after dispute is resolved
     * Contributors to the winning side get their money back + rewards
     *
     * @param _localDisputeId The internal dispute ID
     * @param _beneficiary Address to withdraw for
     * @param _round The round to withdraw from
     */
    function withdrawFeesAndRewards(
        uint256 _localDisputeId,
        address payable _beneficiary,
        uint256 _round
    ) external {
        DisputeInfo storage dispute = disputes[_localDisputeId];

        require(dispute.isRuled, "Dispute not resolved yet");

        Round storage round = dispute.rounds[_round];
        uint256 finalRuling = dispute.ruling;

        uint256 reward;

        if (finalRuling == 0) {
            // Tie - both sides get proportional refund
            uint256 freelancerContribution = round.freelancerContributions[_beneficiary];
            uint256 clientContribution = round.clientContributions[_beneficiary];

            uint256 totalContribution = freelancerContribution + clientContribution;

            if (totalContribution > 0) {
                // Proportional refund
                uint256 totalPaid = round.freelancerContributions + round.clientContributions;
                reward = (totalContribution * round.feeRewards) / totalPaid;
                reward += totalContribution; // Base refund

                // Mark as withdrawn
                round.freelancerContributions[_beneficiary] = 0;
                round.clientContributions[_beneficiary] = 0;
            }
        } else {
            // Winner takes all
            uint256 contribution;
            uint256 winningSideTotalPaid;
            if (finalRuling == FREELANCER_WINS) {
                // Freelancer won
                contribution = round.freelancerContributions[_beneficiary];
                winningSideTotalPaid = round.freelancerContributions;
            } else if (finalRuling == CLIENT_WINS) {
                // Client won
                contribution = round.clientContributions[_beneficiary];
                winningSideTotalPaid = round.clientContributions;
            }

            if (contribution > 0) {
                // Winner gets: contribution + proportional share of rewards
                reward = contribution + (contribution * round.feeRewards) / winningSideTotalPaid;

                // Mark as withdrawn
                if (finalRuling == FREELANCER_WINS) {
                    round.freelancerContributions[_beneficiary] = 0;
                } else if (finalRuling == CLIENT_WINS) {
                    round.clientContributions[_beneficiary] = 0;
                }
            }
        }

        require(reward > 0, "Nothing to withdraw");

        _beneficiary.send(reward);

        emit FeesAndRewardsWithdrawn(
            _localDisputeId,
            _round,
            _beneficiary,
            reward
        );
    }
}