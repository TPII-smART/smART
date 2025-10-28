//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./common/DeliverableInfo.sol";
import "./common/IArbitrableProxy.sol";

/**
 * @title HiredTalentsContract
 * @dev A simplified escrow contract for managing freelance talents.
 * @author SmArt
 */
contract HiredTalentsContract {
    IArbitrableProxy public arbiterProxy;

    bytes public constant arbitratorExtraData = hex"0000000000000000000000000000000000000000000000000000000000000003"; // Court + Jurors quantity for Kleros

    uint256 public constant OVERFLOW = type(uint256).max;

    // Enums for hiredTalent states
    enum HiredTalentState {
        WaitingForApproval,
        Ongoing,
        Finished,
        Cancelled,
        Disputed
    }

    // Struct for individual hiredTalents
    // Each hiredTalent is stored inside a Talent, containing details about the hiredTalent and the people involved
    struct HiredTalent {
        uint256 hiredTalentId;
        address client;
        address freelancer;
        uint256 payment;
        string title;
        string description;
        string category;
        uint256 durationInHours; // Estimated time to complete hiredTalent in hours
        uint256 deadline; // Actual deadline set when hiredTalent is accepted
        HiredTalentState state;
        uint256 createdAt;
        uint256 acceptedAt; // When the hiredTalent was accepted
        uint256 finishedAt; // When the hiredTalent was finished
        uint256 canceledAt; // When the hiredTalent was canceled
        uint256 rejectedAt; // When the hiredTalent was rejected by the client
        uint8 rating; // Rating given by the client, should be between 1 and 5
        bool clientReceived; // Whether the client has received the hiredTalent results
        bool freelancerDelivered; // Whether the freelancer has delivered the hiredTalent results
        bool clientRejected; // Whether the client has rejected the hiredTalent results
        bool clientCancelled; // Whether the client cancelled the hiredTalent
        bool freelancerCancelled; // Whether the freelancer cancelled the hiredTalent
        bool freelancerUploaded; // Whether the freelancer has uploaded a deliverable
        uint256 disputeId; // ID of the dispute in the arbitrator contract, if any
        DeliverableInfo[] deliverableInfo; // Store the deliverable related to the hiredTalent
    }

    // Struct that reduces the amount of parameters needed when submitting a HiredTalent
    struct HiredTalentParams {
        string title;
        string description;
        uint256 payment; // Payment amount in wei
        uint256 durationInHours; // Estimated time to complete hiredTalent in hours
    }

    // Struct for the Talents
    struct Talent {
        uint256 talentId;
        address freelancer;
        uint256 basePayment;
        string title;
        string description;
        string category;
        string bannerImageHash;
        uint256 minimumNoticeTime;
        uint256 averageWorkDuration;
        uint256 createdAt;
        HiredTalent[] hiredTalents;
    }

    // Struct that reduces the amount of parameters needed when submitting a Talent
    struct TalentParams {
        string title;
        string description;
        string category;
        string bannerImageHash;
        uint256 basePayment;
        uint256 minimumNoticeTime;
        uint256 averageWorkDuration;
    }

    // State variables of the contract
    mapping(uint256 => Talent) public postedHiredTalents;
    uint256 public postedHiredTalentsCounter;
    address public owner;

    // Events for Ponder database indexing
    event TalentCreated(
        uint256 indexed talentId,
        address indexed freelancer,
        uint256 basePayment,
        string title,
        string description,
        string category,
        string bannerImageHash,
        uint256 minimumNoticeTime,
        uint256 averageWorkDuration
    );

    event HiredTalentCreated(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address indexed freelancer,
        address client,
        uint256 payment,
        string title,
        string description,
        string category,
        string bannerImageHash,
        uint256 hiredTalentDuration
    );

    event HiredTalentAccepted(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address indexed client,
        uint256 deadline
    );

    event FreelancerMarkedAsDelivered(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address freelancer,
        address client,
        uint256 timestamp
    );

    event ClientMarkedAsReceived(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address client,
        string comment,
        uint256 deliverableUploadedAt,
        uint256 timestamp
    );

    event HiredTalentFinished(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address freelancer,
        address client,
        uint256 payment,
        uint256 timestamp
    );

    event HiredTalentRated(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address client,
        uint8 rating,
        uint256 timestamp
    );

    event HiredTalentCancelled(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        HiredTalentState state,
        bool clientCancelled,
        bool freelancerCancelled,
        uint256 timestamp
    );

    event DeliverableUploaded(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        address indexed freelancer,
        string resource,
        string submissionComment,
        bool isLink,
        bool freelancerUpload,
        uint256 timestamp
    );

    event HiredTalentRejected(
        uint256 indexed talentId,
        uint256 indexed hiredTalentId,
        bool freelancerDelivered,
        bool clientReceived,
        bool clientRejected,
        bool freelancerUploaded,
        string comment,
        uint256 deliverableUploadedAt,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyFreelancer(uint256 _talentId, uint256 _hiredTalentId) {
        require(
            postedHiredTalents[_talentId].hiredTalents[_hiredTalentId].freelancer == msg.sender,
            "Only freelancer can call this"
        );
        _;
    }

    modifier notFreelancer(uint256 _talentId) {
        require(
            postedHiredTalents[_talentId].freelancer != msg.sender,
            "Freelancer cannot create a hiredTalent for their own talent"
        );
        _;
    }

    modifier onlyClient(uint256 _talentId, uint256 _hiredTalentId) {
        require(
            postedHiredTalents[_talentId].hiredTalents[_hiredTalentId].client == msg.sender,
            "Only client can call this"
        );
        _;
    }

    modifier onlyHiredTalentParties(uint256 _talentId, uint256 _hiredTalentId) {
        require(
            postedHiredTalents[_talentId].hiredTalents[_hiredTalentId].freelancer == msg.sender ||
                postedHiredTalents[_talentId].hiredTalents[_hiredTalentId].client == msg.sender,
            "Only hiredTalent parties can call this"
        );
        _;
    }

    modifier talentExists(uint256 _talentId) {
        require(_talentId < postedHiredTalentsCounter, "HiredTalent talent does not exist");
        _;
    }

    modifier hiredTalentExists(uint256 _talentId, uint256 _hiredTalentId) {
        require(_hiredTalentId < postedHiredTalents[_talentId].hiredTalents.length, "HiredTalent does not exist");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @dev Constructor
     * @param _owner Address of the contract owner
     * @param _KlerosArbitrator Address of the Kleros arbitrator for dispute resolution
     */
    constructor(address _owner, address _KlerosArbitrator) {
        require(_KlerosArbitrator != address(0), "Invalid Kleros.io arbiter address");
        arbiterProxy = IArbitrableProxy(_KlerosArbitrator);
        owner = _owner;
    }

    function changeArbitrator(address _newArbitrator) external onlyOwner {
        require(_newArbitrator != address(0), "Invalid arbitrator address");
        arbiterProxy = IArbitrableProxy(_newArbitrator);
    }

    /**
     * @dev Create a new talent (Freelancer creates hiredTalent offer)
     * @param params Struct containing all talent parameters
     */
    function createTalent(TalentParams memory params) external returns (uint256) {
        require(params.basePayment > 0, "Payment must be greater than 0");
        require(params.averageWorkDuration > 0, "Duration must be greater than 0");
        require(params.minimumNoticeTime > 0, "Minimum notice time must be greater than 0");
        require(bytes(params.title).length > 0, "Title cannot be empty");
        require(bytes(params.description).length > 0, "Description cannot be empty");
        require(bytes(params.category).length > 0, "Category cannot be empty");
        require(bytes(params.title).length <= 64, "Title must be up to 64 characters");
        require(bytes(params.description).length <= 512, "Description must be up to 512 characters");
        require(bytes(params.category).length <= 64, "Category must be up to 64 characters");
        require(bytes(params.bannerImageHash).length <= 128, "Banner image hash must be up to 128 characters");

        uint256 talentId = postedHiredTalentsCounter++;

        // Create Talent with all required fields including empty hiredTalents array
        Talent storage newPosting = postedHiredTalents[talentId];
        {
            newPosting.talentId = talentId;
            newPosting.freelancer = msg.sender;
            newPosting.basePayment = params.basePayment;
            newPosting.title = params.title;
            newPosting.description = params.description;
            newPosting.category = params.category;
            newPosting.bannerImageHash = params.bannerImageHash;
            newPosting.minimumNoticeTime = params.minimumNoticeTime;
            newPosting.averageWorkDuration = params.averageWorkDuration;
            newPosting.createdAt = block.timestamp;
            // hiredTalents array is automatically initialized as empty
        }

        emit TalentCreated(
            talentId,
            msg.sender,
            params.basePayment,
            params.title,
            params.description,
            params.category,
            params.bannerImageHash,
            params.minimumNoticeTime,
            params.averageWorkDuration
        );

        return talentId;
    }

    /**
     * @dev Create a new hiredTalent under an existing talent (Client creates hiredTalent)
     * @param _talentId The ID of the talent to create a hiredTalent under
     * @param params Struct containing all hiredTalent parameters
     */
    function createHiredTalent(
        uint256 _talentId,
        HiredTalentParams memory params
    ) external payable talentExists(_talentId) notFreelancer(_talentId) {
        Talent storage talent = postedHiredTalents[_talentId];

        require(msg.value == params.payment, "Must send exact payment amount");
        require(params.payment > 0, "Payment must be greater than 0");
        require(params.durationInHours > 0, "Duration must be greater than 0");
        require(bytes(params.title).length > 0, "Title cannot be empty");
        require(bytes(params.description).length > 0, "Description cannot be empty");
        require(bytes(params.title).length <= 64, "Title exceeds 64 characters");
        require(bytes(params.description).length <= 512, "Description exceeds 512 characters");
        require(bytes(talent.category).length <= 64, "Category exceeds 64 characters");
        require(bytes(talent.bannerImageHash).length <= 128, "Banner image hash exceeds 128 characters");
        require(talent.freelancer != address(0), "Freelancer address must not be zero");
        require(msg.sender != address(0), "Client address must not be zero");

        // Create new hiredTalent
        uint256 hiredTalentId = talent.hiredTalents.length;
        HiredTalent memory newHiredTalent = HiredTalent({
            hiredTalentId: hiredTalentId,
            client: msg.sender,
            freelancer: talent.freelancer,
            payment: params.payment,
            title: params.title,
            description: params.description,
            category: talent.category,
            durationInHours: params.durationInHours,
            deadline: 0, // Deadline will be set when hiredTalent is accepted, while waiting for approval no progress is made
            state: HiredTalentState.WaitingForApproval,
            createdAt: block.timestamp,
            acceptedAt: 0,
            finishedAt: 0,
            canceledAt: 0,
            rejectedAt: 0,
            rating: 0, // Rating is not set until hiredTalent is finished
            clientReceived: false,
            freelancerDelivered: false,
            clientRejected: false,
            clientCancelled: false,
            freelancerCancelled: false,
            freelancerUploaded: false,
            disputeId: 0, // No dispute initially
            deliverableInfo: new DeliverableInfo[](0)
        });

        // Add hiredTalent to the talent
        talent.hiredTalents.push(newHiredTalent);

        emit HiredTalentCreated(
            _talentId,
            hiredTalentId,
            talent.freelancer,
            msg.sender,
            params.payment,
            params.title,
            params.description,
            talent.category,
            talent.bannerImageHash,
            params.durationInHours
        );
    }

    /**
     * @dev Accept an available hiredTalent and set deadline (Freelancer accepts hiredTalent offered by client)
     * @param _talentId The ID of the talent this hiredTalent belongs to
     * @param _hiredTalentId The hiredTalent ID to accept
     */
    function acceptHiredTalent(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(
            hiredTalent.state == HiredTalentState.WaitingForApproval,
            "HiredTalent is not available for acceptance"
        );
        require(msg.sender == hiredTalent.freelancer, "Only freelancer can accept this hiredTalent");
        require(hiredTalent.client != address(0), "HiredTalent has no assigned client");
        require(hiredTalent.durationInHours > 0, "HiredTalent duration must be greater than 0");

        // Set hiredTalent state to ongoing
        hiredTalent.state = HiredTalentState.Ongoing;
        hiredTalent.acceptedAt = block.timestamp;
        hiredTalent.deadline = block.timestamp + (hiredTalent.durationInHours * 1 hours); // Set deadline based on duration

        emit HiredTalentAccepted(_talentId, _hiredTalentId, hiredTalent.client, hiredTalent.deadline);
    }

    /**
     * @dev Confirm client hiredTalent completion (both parties must confirm in order to complete the hiredTalent)
     * This function allows either the client or freelancer to confirm that the hiredTalent has been completed.
     * If both parties confirm, the hiredTalent is marked as finished and payment is released.
     * @param _talentId The ID of the talent this hiredTalent belongs to
     * @param _hiredTalentId The hiredTalent ID to confirm completion
     */
    function confirmClientCompletion(
        uint256 _talentId,
        uint256 _hiredTalentId,
        string calldata _comment
    ) external onlyClient(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Ongoing, "HiredTalent is not ongoing");
        require(hiredTalent.deliverableInfo.length > 0, "No deliverable uploaded yet");
        require(hiredTalent.freelancerUploaded, "Freelancer has not uploaded deliverables");

        DeliverableInfo memory deliverableInfo = hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1];

        require(hiredTalent.client != address(0), "HiredTalent has no assigned client");
        require(hiredTalent.freelancer != address(0), "HiredTalent has no assigned freelancer");
        require(bytes(_comment).length > 0, "Comment cannot be empty.");
        require(bytes(_comment).length <= 256, "Comment must be up to 256 characters.");

        require(!hiredTalent.clientReceived, "Client already confirmed hiredTalent reception");
        hiredTalent.clientReceived = true;
        deliverableInfo.clientResponse = _comment;
        deliverableInfo.state = DeliverableState.Approved;
        deliverableInfo.responseTimestamp = block.timestamp;

        emit ClientMarkedAsReceived(
            _talentId,
            _hiredTalentId,
            msg.sender,
            _comment,
            deliverableInfo.uploadedAt,
            block.timestamp
        );

        // If both parties have confirmed, complete the hiredTalent
        if (hiredTalent.clientReceived && hiredTalent.freelancerDelivered) {
            _completeHiredTalent(_talentId, _hiredTalentId);
        }
    }

    /**
     * @dev Confirm client hiredTalent completion (both parties must confirm in order to complete the hiredTalent)
     * This function allows either the client or freelancer to confirm that the hiredTalent has been completed.
     * If both parties confirm, the hiredTalent is marked as finished and payment is released.
     * @param _talentId The ID of the talent this hiredTalent belongs to
     * @param _hiredTalentId The hiredTalent ID to confirm completion
     * @param _deliverableParams The content of the deliverable (IPFS hash and comment).
     */
    function confirmFreelancerCompletion(
        uint256 _talentId,
        uint256 _hiredTalentId,
        DeliverableParams memory _deliverableParams
    ) external onlyFreelancer(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Ongoing, "HiredTalent is not ongoing");
        require(hiredTalent.client != address(0), "HiredTalent has no assigned client");
        require(hiredTalent.freelancer != address(0), "HiredTalent has no assigned freelancer");
        require(!hiredTalent.freelancerDelivered, "Freelancer already marked the hiredTalent as delivered");

        _uploadDeliverable(_talentId, _hiredTalentId, _deliverableParams);

        hiredTalent.freelancerDelivered = true;
        emit FreelancerMarkedAsDelivered(_talentId, _hiredTalentId, msg.sender, hiredTalent.client, block.timestamp);

        // If both parties have confirmed, complete the hiredTalent
        if (hiredTalent.clientReceived && hiredTalent.freelancerDelivered) {
            _completeHiredTalent(_talentId, _hiredTalentId);
        }
    }

    /**
     * @dev Internal function to complete hiredTalent and release payment
     * @param _talentId The ID of the talent this hiredTalent belongs to
     * @param _hiredTalentId The hiredTalent ID to complete
     */
    function _completeHiredTalent(uint256 _talentId, uint256 _hiredTalentId) internal {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];
        hiredTalent.state = HiredTalentState.Finished;
        hiredTalent.finishedAt = block.timestamp;

        // Sends payment to freelancer
        payable(hiredTalent.freelancer).transfer(hiredTalent.payment);

        emit HiredTalentFinished(
            _talentId,
            _hiredTalentId,
            hiredTalent.freelancer,
            hiredTalent.client,
            hiredTalent.payment,
            hiredTalent.finishedAt
        );
    }

    /**
     * @dev Internal function to rate a hiredTalent
     * @param _talentId The ID of the talent this hiredTalent belongs to
     * @param _hiredTalentId The hiredTalent ID to rate
     * @param _rating The rating given by the client (1-5)
     */
    function rateHiredTalent(
        uint256 _talentId,
        uint256 _hiredTalentId,
        uint8 _rating
    ) external onlyClient(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];
        require(hiredTalent.state == HiredTalentState.Finished, "HiredTalent is not finished");
        require(hiredTalent.rating == 0, "HiredTalent already rated");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");
        require(_rating % 1 == 0, "Rating must be an integer");
        hiredTalent.rating = _rating;
        emit HiredTalentRated(_talentId, _hiredTalentId, msg.sender, _rating, block.timestamp);
    }

    /**
     * @dev Cancel a hiredTalent
     * @param _talentId The ID of the talent this hiredTalent belongs to
     * @param _hiredTalentId The hiredTalent ID to cancel
     */
    function cancelHiredTalent(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external hiredTalentExists(_talentId, _hiredTalentId) onlyHiredTalentParties(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        if (hiredTalent.state == HiredTalentState.WaitingForApproval) {
            // If hiredTalent is still waiting for approval, simply remove it
            hiredTalent.state = HiredTalentState.Cancelled;
        } else if (hiredTalent.state == HiredTalentState.Ongoing) {
            if (msg.sender == hiredTalent.client) {
                hiredTalent.clientCancelled = true;
            } else if (msg.sender == hiredTalent.freelancer) {
                hiredTalent.freelancerCancelled = true;
            }

            // Refund payment to client if there was one
            if (hiredTalent.client != address(0) && hiredTalent.clientCancelled && hiredTalent.freelancerCancelled) {
                hiredTalent.state = HiredTalentState.Cancelled;
                hiredTalent.canceledAt = block.timestamp;
                payable(hiredTalent.client).transfer(hiredTalent.payment);
            }
        } else {
            revert("HiredTalent cannot be cancelled in its current state");
        }

        emit HiredTalentCancelled(
            _talentId,
            _hiredTalentId,
            hiredTalent.state,
            hiredTalent.clientCancelled,
            hiredTalent.freelancerCancelled,
            hiredTalent.canceledAt
        );
    }

    /**
     * @dev Emergency cancel by owner (with refund)
     * @param _hiredTalentId The hiredTalent ID to emergency cancel
     */
    function emergencyCancel(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external onlyOwner hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        hiredTalent.state = HiredTalentState.Cancelled;

        // Refund payment to client if there was one
        if (hiredTalent.client != address(0)) {
            payable(hiredTalent.client).transfer(hiredTalent.payment);
        }

        emit HiredTalentCancelled(
            _talentId,
            _hiredTalentId,
            HiredTalentState.Cancelled,
            hiredTalent.clientCancelled,
            hiredTalent.freelancerCancelled,
            block.timestamp
        );
    }

    /**
     * @dev Get the number of hiredTalents in a talent
     * @param _talentId The ID of the talent
     * @return Number of hiredTalents in the talent
     */
    function getHiredTalentCount(uint256 _talentId) external view talentExists(_talentId) returns (uint256) {
        return postedHiredTalents[_talentId].hiredTalents.length;
    }

    function getTotalHiredTalentsPosted() external view returns (uint256) {
        return postedHiredTalentsCounter;
    }

    function isDeliverableUploaded(
        uint256 talentId,
        uint256 hiredTalentId,
        string memory comment,
        string memory ipfsHash
    ) external view returns (bool) {
        HiredTalent storage hiredTalent = postedHiredTalents[talentId].hiredTalents[hiredTalentId];
        if (hiredTalent.deliverableInfo.length == 0) {
            return false;
        }
        DeliverableInfo memory deliverableInfo = hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1];

        return
            bytes(deliverableInfo.resource).length > 0 &&
            keccak256(bytes(deliverableInfo.submissionComment)) == keccak256(bytes(comment)) &&
            keccak256(bytes(deliverableInfo.resource)) == keccak256(bytes(ipfsHash));
    }

    // Function to receive Ether
    receive() external payable {
        revert("Direct payments not accepted");
    }

    /**
     * @dev Allows the freelancer to upload a deliverable.
     * @param _talentId  Talent ID.
     * @param _hiredTalentId HiredTalent ID.
     * @param _deliverableParams The content of the deliverable (IPFS hash and comment).
     */
    function _uploadDeliverable(
        uint256 _talentId,
        uint256 _hiredTalentId,
        DeliverableParams memory _deliverableParams
    ) internal onlyFreelancer(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Ongoing, "The hiredTalent is not ongoing.");

        require(bytes(_deliverableParams.resource).length > 0, "Resource cannot be empty.");
        require(bytes(_deliverableParams.resource).length <= 256, "Resource must be up to 256 characters.");
        require(bytes(_deliverableParams.submissionComment).length <= 256, "Comment must be up to 256 characters.");

        uint256 _currentDeliverableGroupId = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _talentId, _hiredTalentId, "evidence"))
        ) % OVERFLOW;

        // If there was already a deliverableGroupId generated, keep that one
        if (hiredTalent.deliverableInfo.length > 0) {
            DeliverableInfo memory lastDeliverable = hiredTalent.deliverableInfo[
                hiredTalent.deliverableInfo.length - 1
            ];
            _currentDeliverableGroupId = lastDeliverable.deliverableGroupId;
        }

        DeliverableInfo memory deliverableToUpload = DeliverableInfo({
            resource: _deliverableParams.resource,
            parsedResource: _deliverableParams.parsedResource,
            submissionComment: _deliverableParams.submissionComment,
            uploadedAt: block.timestamp,
            clientResponse: "",
            responseTimestamp: 0,
            isLink: _deliverableParams.isLink,
            state: DeliverableState.Pending,
            deliverableGroupId: _currentDeliverableGroupId
        });

        hiredTalent.freelancerUploaded = true;
        hiredTalent.deliverableInfo.push(deliverableToUpload);

        emit DeliverableUploaded(
            _talentId,
            _hiredTalentId,
            msg.sender,
            deliverableToUpload.resource,
            deliverableToUpload.submissionComment,
            deliverableToUpload.isLink,
            hiredTalent.freelancerUploaded,
            deliverableToUpload.uploadedAt
        );

        arbiterProxy.submitEvidence(
            hiredTalent.freelancer,
            hiredTalent.disputeId,
            deliverableToUpload.deliverableGroupId,
            deliverableToUpload.parsedResource,
            // Avoids checks and operations related to an existing dispute
            true
        );
    }

    function rejectHiredTalent(
        uint256 _talentId,
        uint256 _hiredTalentId,
        string calldata _comment
    ) external onlyClient(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];
        DeliverableInfo memory deliverableInfo = hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1];

        require(hiredTalent.state == HiredTalentState.Ongoing, "HiredTalent is not ongoing");
        require(hiredTalent.client != address(0), "HiredTalent has no assigned client");
        require(hiredTalent.freelancer != address(0), "HiredTalent has no assigned freelancer");
        require(bytes(_comment).length > 0, "Comment cannot be empty.");
        require(bytes(_comment).length <= 256, "Comment must be up to 256 characters.");

        hiredTalent.freelancerDelivered = false;
        hiredTalent.clientReceived = false;
        hiredTalent.clientRejected = true;
        hiredTalent.freelancerUploaded = false;
        deliverableInfo.clientResponse = _comment;
        deliverableInfo.state = DeliverableState.Rejected;
        deliverableInfo.responseTimestamp = block.timestamp;
        hiredTalent.rejectedAt = block.timestamp;

        emit HiredTalentRejected(
            _talentId,
            _hiredTalentId,
            hiredTalent.freelancerDelivered,
            hiredTalent.clientReceived,
            hiredTalent.clientRejected,
            hiredTalent.freelancerUploaded,
            deliverableInfo.clientResponse,
            deliverableInfo.uploadedAt,
            hiredTalent.rejectedAt
        );
    }

    function startDispute(
        uint256 _talentId,
        uint256 _hiredTalentId,
        string calldata _metaEvidenceURI,
        string calldata _reason
    ) external payable onlyHiredTalentParties(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Ongoing, "Dispute can only be started for ongoing hiredTalents");
        require(hiredTalent.disputeId == 0, "Dispute already exists for this hiredTalent");
        require(msg.value > 0, "Must send arbitration fee");
        require(bytes(_metaEvidenceURI).length > 0, "Metadata URI cannot be empty");
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        require(bytes(_reason).length <= 256, "Reason must be up to 256 characters");

        uint256 disputeId;

        if (msg.sender == hiredTalent.freelancer) {
            disputeId = arbiterProxy.startAndPayTalentDisputeByFreelancer{ value: msg.value }(
                _talentId,
                _hiredTalentId,
                hiredTalent.freelancer,
                hiredTalent.client,
                arbitratorExtraData,
                _metaEvidenceURI,
                hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1].deliverableGroupId,
                _reason
            );
        } else if (msg.sender == hiredTalent.client) {
            disputeId = arbiterProxy.startAndPayTalentDisputeByClient{ value: msg.value }(
                _talentId,
                _hiredTalentId,
                hiredTalent.freelancer,
                hiredTalent.client,
                arbitratorExtraData,
                _metaEvidenceURI,
                hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1].deliverableGroupId,
                _reason
            );
        } else {
            revert("Only hired talent parties can start a dispute");
        }

        hiredTalent.state = HiredTalentState.Disputed;
        hiredTalent.disputeId = disputeId;
    }

    function getArbitrationFee() external view returns (uint256) {
        uint256 feeAmount = arbiterProxy.arbitrator().arbitrationCost(arbitratorExtraData);
        return feeAmount;
    }

    function payArbitrationFee(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external payable onlyHiredTalentParties(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Disputed, "No dispute to pay for this hired talent");
        require(hiredTalent.disputeId != 0, "No dispute exists for this hired talent");
        uint256 feeAmount = arbiterProxy.arbitrator().arbitrationCost(arbitratorExtraData);
        require(msg.value >= feeAmount, "Insufficient arbitration fee");

        if (msg.sender == hiredTalent.freelancer) {
            arbiterProxy.payArbitrationFeeByFreelancer{ value: msg.value }(
                msg.sender,
                hiredTalent.disputeId,
                arbitratorExtraData,
                hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1].deliverableGroupId
            );
        } else if (msg.sender == hiredTalent.client) {
            arbiterProxy.payArbitrationFeeByClient{ value: msg.value }(
                msg.sender,
                hiredTalent.disputeId,
                arbitratorExtraData,
                hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1].deliverableGroupId
            );
        } else {
            revert("Only hired talent parties can pay arbitration fee");
        }
    }

    function concedeDispute(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external onlyHiredTalentParties(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Disputed, "No dispute to concede for this hired talent");
        require(hiredTalent.disputeId != 0, "No dispute exists for this hired talent");

        if (msg.sender == hiredTalent.freelancer) {
            // Freelancer concedes, ruling in favor of client
            arbiterProxy.concedeDispute(hiredTalent.disputeId, 2);
        } else if (msg.sender == hiredTalent.client) {
            // Client concedes, ruling in favor of freelancer
            arbiterProxy.concedeDispute(hiredTalent.disputeId, 1);
        } else {
            revert("Only hired talent parties can concede dispute");
        }

        emit HiredTalentFinished(
            _talentId,
            _hiredTalentId,
            hiredTalent.freelancer,
            hiredTalent.client,
            hiredTalent.payment,
            hiredTalent.finishedAt
        );
    }

    function finalizeDispute(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external onlyHiredTalentParties(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Disputed, "No dispute to finalize for this hired talent");
        require(hiredTalent.disputeId != 0, "No dispute exists for this hired talent");

        if (arbiterProxy.hasTimedOut(hiredTalent.disputeId)) {
            arbiterProxy.timeoutByInaction(hiredTalent.disputeId);
        } else {
            arbiterProxy.finalizeDispute(hiredTalent.disputeId);
        }

        uint256 ruling = arbiterProxy.getCurrentRuling(hiredTalent.disputeId);
        address recipient;

        if (ruling == 1) {
            // Ruling in favor of freelancer
            recipient = hiredTalent.freelancer;
        } else if (ruling == 2) {
            // Ruling in favor of client
            recipient = hiredTalent.client;
        } else {
            revert("Invalid ruling from arbitrator");
        }

        hiredTalent.state = HiredTalentState.Finished;
        hiredTalent.finishedAt = block.timestamp;
        payable(recipient).transfer(hiredTalent.payment);

        emit HiredTalentFinished(
            _talentId,
            _hiredTalentId,
            hiredTalent.freelancer,
            hiredTalent.client,
            hiredTalent.payment,
            hiredTalent.finishedAt
        );
    }

    function fundAppeal(
        uint256 _talentId,
        uint256 _hiredTalentId,
        uint8 _side
    ) external payable hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Disputed, "No dispute to appeal for this hired talent");
        require(hiredTalent.disputeId != 0, "No dispute exists for this hired talent");
        require(_side == 1 || _side == 2, "Invalid side");

        if (msg.sender == hiredTalent.freelancer) {
            require(_side == 1, "Freelancer can only fund their own side");
            arbiterProxy.fundAppeal{ value: msg.value }(msg.sender, hiredTalent.disputeId, _side);
        } else if (msg.sender == hiredTalent.client) {
            require(_side == 2, "Client can only fund their own side");
            arbiterProxy.fundAppeal{ value: msg.value }(msg.sender, hiredTalent.disputeId, _side);
        } else {
            arbiterProxy.fundAppeal{ value: msg.value }(msg.sender, hiredTalent.disputeId, _side);
        }
    }

    function getCurrentRuling(
        uint256 _talentId,
        uint256 _hiredTalentId
    ) external view hiredTalentExists(_talentId, _hiredTalentId) returns (uint256) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Disputed, "No disputes for this hired talent");
        require(hiredTalent.disputeId != 0, "No dispute exists for this hired talent");

        return arbiterProxy.getCurrentRuling(hiredTalent.disputeId);
    }

    function submitEvidence(
        uint256 _talentId,
        uint256 _hiredTalentId,
        string calldata _evidenceURI
    ) external onlyHiredTalentParties(_talentId, _hiredTalentId) hiredTalentExists(_talentId, _hiredTalentId) {
        HiredTalent storage hiredTalent = postedHiredTalents[_talentId].hiredTalents[_hiredTalentId];

        require(hiredTalent.state == HiredTalentState.Disputed, "No dispute to submit evidence for this hired talent");
        require(hiredTalent.disputeId >= 0, "No dispute exists for this hired talent");
        require(bytes(_evidenceURI).length > 0, "Evidence URI cannot be empty");

        arbiterProxy.submitEvidence(
            msg.sender,
            hiredTalent.disputeId,
            hiredTalent.deliverableInfo[hiredTalent.deliverableInfo.length - 1].deliverableGroupId,
            _evidenceURI,
            // If this method is called, we want to emit the evidence event in an ongoing dispute
            false
        );
    }
}
