// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRealityETH {
    function notifyOfArbitrationRequest(bytes32 question_id, address requester) external;
    function submitAnswerByArbitrator(bytes32 question_id, bytes32 answer, address answerer) external;
    function assignWinnerAndSubmitAnswerByArbitrator(
        bytes32 question_id,
        bytes32 answer,
        address payee_if_wrong,
        bytes32 last_history_hash,
        bytes32 last_answer_or_commitment_id,
        address last_answerer
    ) external;
}

/**
 * @title SimpleArbitrator
 * @dev Basic arbitrator contract for Reality.eth integration
 */
contract ArbiterContract {

    // Reality.eth contract address
    IRealityETH public realitio;

    // Address of the contract owner
    address public owner;

    // Fixed (And minimum) arbitration fee
    uint256 public arbitrationFee;

    // Pending arbitration requests
    mapping(bytes32 => ArbitrationRequest) public arbitrationRequests;

    // Struct to hold arbitration request details
    struct ArbitrationRequest {
        address requester;
        uint256 feePaid;
        bool isPending;
        bool isSettled;
    }

    // Events emitted by the contract
    event ArbitrationRequested(bytes32 indexed question_id, address indexed requester, uint256 fee);
    event ArbitrationSettled(bytes32 indexed question_id, bytes32 answer, address answerer);
    event FeeUpdated(uint256 newFee);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validQuestion(bytes32 question_id) {
        require(question_id != bytes32(0), "Invalid question ID");
        _;
    }

    /**
     * @dev Constructor
     * @param _realitio Address of the Reality.eth contract
     * @param _arbitrationFee Fixed (And minimal) fee for arbitration services
     */
    constructor(address _realitio, uint256 _arbitrationFee) {
        require(_realitio != address(0), "Invalid Reality.eth address");
        realitio = IRealityETH(_realitio);
        owner = msg.sender;
        arbitrationFee = _arbitrationFee;
    }

    /**
     * @dev Returns the dispute fee for a given question
     * @param question_id The ID of the question
     * @return The arbitration fee
     */
    function getDisputeFee(bytes32 question_id) external view validQuestion(question_id) returns (uint256) {
        return arbitrationFee;
    }

    /**
     * @dev Request arbitration for a question
     * @param question_id The ID of the question to arbitrate
     */
    function requestArbitration(bytes32 question_id) external payable validQuestion(question_id) {
        require(msg.value >= arbitrationFee, "Insufficient arbitration fee");
        require(!arbitrationRequests[question_id].isPending, "Arbitration already requested");

        // Store the arbitration request
        arbitrationRequests[question_id] = ArbitrationRequest({
            requester: msg.sender,
            feePaid: msg.value,
            isPending: true,
            isSettled: false
        });

        // Notify Reality.eth contract
        realitio.notifyOfArbitrationRequest(question_id, msg.sender);

        emit ArbitrationRequested(question_id, msg.sender, msg.value);
    }

    /**
     * @dev Submit arbitration decision (owner only for MVP)
     * @param question_id The ID of the question
     * @param answer The arbitrated answer
     * @param answerer The address to receive the reward (usually the requester)
     */
    function submitArbitrationAnswer(
        bytes32 question_id,
        bytes32 answer,
        address answerer
    ) external onlyOwner validQuestion(question_id) {
        ArbitrationRequest storage request = arbitrationRequests[question_id];
        require(request.isPending, "No pending arbitration for this question");
        require(!request.isSettled, "Arbitration already settled");

        // Mark as settled
        request.isSettled = true;
        request.isPending = false;

        // Submit answer to Reality.eth
        realitio.submitAnswerByArbitrator(question_id, answer, answerer);

        emit ArbitrationSettled(question_id, answer, answerer);
    }

    /**
     * @dev Enhanced arbitration submission with winner assignment (v2.1+)
     * @param question_id The ID of the question
     * @param answer The arbitrated answer
     * @param payee_if_wrong Address to receive payout if the final answer was wrong
     * @param last_history_hash Hash from the question history
     * @param last_answer_or_commitment_id Last answer/commitment ID
     * @param last_answerer Address of the last answerer
     */
    function submitArbitrationAnswerWithWinner(
        bytes32 question_id,
        bytes32 answer,
        address payee_if_wrong,
        bytes32 last_history_hash,
        bytes32 last_answer_or_commitment_id,
        address last_answerer
    ) external onlyOwner validQuestion(question_id) {
        ArbitrationRequest storage request = arbitrationRequests[question_id];
        require(request.isPending, "No pending arbitration for this question");
        require(!request.isSettled, "Arbitration already settled");

        // Mark as settled
        request.isSettled = true;
        request.isPending = false;

        // Submit answer with winner assignment
        realitio.assignWinnerAndSubmitAnswerByArbitrator(
            question_id,
            answer,
            payee_if_wrong,
            last_history_hash,
            last_answer_or_commitment_id,
            last_answerer
        );

        emit ArbitrationSettled(question_id, answer, payee_if_wrong);
    }

    /**
     * @dev Update arbitration fee (owner only)
     * @param newFee The new arbitration fee
     */
    function updateArbitrationFee(uint256 newFee) external onlyOwner {
        arbitrationFee = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }

    /**
     * @dev Transfer ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }

    /**
     * @dev Get arbitration request details
     * @param question_id The question ID
     * @return ArbitrationRequest struct
     */
    function getArbitrationRequest(bytes32 question_id) external view returns (ArbitrationRequest memory) {
        return arbitrationRequests[question_id];
    }

    /**
     * @dev Check if arbitration is pending for a question
     * @param question_id The question ID
     * @return True if arbitration is pending
     */
    function isArbitrationPending(bytes32 question_id) external view returns (bool) {
        return arbitrationRequests[question_id].isPending;
    }
}