// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IArbitrator.sol";

/**
 * @title IArbitrableProxy
 * Interface matching public/external signatures implemented in ArbiterProxy
 */
interface IArbitrableProxy {
    // ============ Enums ============
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

    // ============ Basic getters ============
    function arbitrator() external view returns (IArbitrator);

    function disputeCount() external view returns (uint256);

    // ============ Creation / fee payment / lifecycle ============
    function createDispute(
        uint256 _externalId1,
        uint256 _externalId2,
        DisputeType _disputeType,
        bytes calldata _arbitratorExtraData,
        address _freelancer,
        address _client
    ) external returns (uint256 localDisputeId);

    function startAndPayTalentDisputeByFreelancer(
        uint256 _talentId,
        uint256 _hiredTalentId,
        address _client,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId);

    function startAndPayTalentDisputeByClient(
        uint256 _talentId,
        uint256 _hiredTalentId,
        address _freelancer,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId);

    function createAndPayGigDisputeByFreelancer(
        uint256 _gigId,
        address _client,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId);

    function createAndPayGigDisputeByClient(
        uint256 _gigId,
        address _freelancer,
        bytes calldata _arbitratorExtraData
    ) external payable returns (uint256 localDisputeId);

    function payArbitrationFeeByFreelancer(
        uint256 _localDisputeId,
        bytes calldata _arbitratorExtraData
    ) external payable;

    function payArbitrationFeeByClient(
        uint256 _localDisputeId,
        bytes calldata _arbitratorExtraData
    ) external payable;

    function timeoutByInaction(uint256 _localDisputeId) external;

    // ============ Appeal interactions ============

    function fundAppeal(uint256 _localDisputeId, uint8 _side) external payable;

    function withdrawFeesAndRewards(
        uint256 _localDisputeId,
        address payable _beneficiary,
        uint256 _round
    ) external;

    // ============ Events ============
    event TalentDisputeCreated(
        uint256 indexed localDisputeId,
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address freelancer,
        address client,
        uint256 feeDepositDeadline
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

    event GigDisputeCreated(
        uint256 indexed localDisputeId,
        uint256 indexed gigId,
        address freelancer,
        address client,
        uint256 feeDepositDeadline
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

    event GigDisputeTimeoutByInaction(
        uint256 indexed localDisputeId,
        uint256 indexed gigId,
        uint256 ruling,
        address winner
    );

    event TalentDisputeTimeoutByInaction(
        uint256 indexed localDisputeId,
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        uint256 ruling,
        address winner
    );

    event GigAppealContribution(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 gigId,
        uint8 side,
        address contributor,
        uint256 amount,
        uint256 totalPaid,
        uint256 requiredAmount
    );

    event TalentAppealContribution(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 talentId,
        uint256 hiredTalentId,
        uint8 side,
        address contributor,
        uint256 amount,
        uint256 totalPaid,
        uint256 requiredAmount
    );

    event GigAppealCreated(
        uint256 indexed localDisputeId,
        uint256 indexed klerosDisputeId,
        uint256 indexed round,
        uint256 gigId
    );

    event TalentAppealCreated(
        uint256 indexed localDisputeId,
        uint256 indexed klerosDisputeId,
        uint256 indexed round,
        uint256 talentId,
        uint256 hiredTalentId
    );

    event GigFeesAndRewardsWithdrawn(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 gigId,
        address beneficiary,
        uint256 reward
    );

    event TalentFeesAndRewardsWithdrawn(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 talentId,
        uint256 hiredTalentId,
        address beneficiary,
        uint256 reward
    );

    event TalentRoundRuling(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 talentId,
        uint256 hiredTalentId,
        uint256 ruling
    );

    event GigRoundRuling(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 gigId,
        uint256 ruling
    );

    event TalentRoundTimeoutByInaction(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 talentId,
        uint256 hiredTalentId,
        uint256 ruling,
        address winner
    );

    event GigRoundTimeoutByInaction(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 gigId,
        uint256 ruling,
        address winner
    );

    event TalentAppealExternallyFunded(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 indexed talentId,
        uint256 hiredTalentId
    );

    event GigAppealExternallyFunded(
        uint256 indexed localDisputeId,
        uint256 indexed round,
        uint256 indexed gigId
    );

}