//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./common/DeliverableInfo.sol";

interface IRealityETH {
    function askQuestion(
        uint256 template_id,
        string calldata question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce
    ) external payable returns (bytes32);
    function resultFor(bytes32 question_id) external view returns (bytes32);
    function submitAnswerFor(
        bytes32 question_id,
        bytes32 answer,
        uint256 max_previous,
        address answerer
    ) external payable;
}

interface IArbiterContract {
    function arbitrationFee() external view returns (uint256);
    function requestArbitration(bytes32 question_id, uint256 lastSeenBond) external payable;
}

/**
 * @title GigsContract
 * @dev A contract for managing gigs where clients post work requests and freelancers apply with proposals.
 * @author SmArt
 */
contract GigsContract {

    // Reality.eth contract address
    IRealityETH public reality;

    IArbiterContract public arbitratorAddress;

    // Enums for gig and application states
    enum GigState {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Disputed
    }
    enum ApplicationState {
        Pending,
        Accepted,
        Rejected,
        Withdrawn
    }

    // Struct for freelancer applications to gigs
    struct Application {
        uint256 applicationId;
        address freelancer;
        uint256 proposedPayment;
        uint256 proposedDurationInHours;
        ApplicationState state;
        uint256 createdAt;
        string proposalComment; // Comment from freelancer with their proposal
        string rejectionComment; // Comment from client when rejecting
    }

    // Struct that reduces the amount of parameters needed when submitting an application
    struct ApplicationParams {
        uint256 proposedPayment;
        uint256 proposedDurationInHours;
        string proposal; // Freelancer's proposal/pitch
    }

    // Struct that reduces the amount of parameters needed when creating a gig
    struct GigParams {
        string title;
        string description;
        string category; // e.g., "Writing", "Web Development", "Design"
        uint256 maxDurationInHours; // Maximum time client is willing to wait
        string gigBannerImageHash; // IPFS hash of the gig banner image
        uint256 basePayment; // Base ETH client is willing to pay
    }

    // Struct for individual gigs posted by clients
    struct Gig {
        uint256 gigId;
        address client;
        address acceptedFreelancer; // The freelancer whose application was accepted
        uint256 basePayment; // Base ETH client is willing to pay
        uint256 finalPayment; // Final agreed payment (from accepted application)
        string title;
        string description;
        string category;
        uint256 maxDurationInHours; // Maximum time client is willing to wait
        uint256 finalDurationInHours; // Final agreed duration (from accepted application)
        uint256 deadline; // Actual deadline set when application is accepted
        GigState state;
        uint256 createdAt;
        uint256 acceptedAt; // When an application was accepted
        uint256 canceledAt; // When an application was canceled
        uint256 rejectedAt; // When the job was rejected by the client
        uint256 finishedAt; // When an application was finished
        bool clientReceived; // Whether the client has received the work results
        bool freelancerDelivered; // Whether the freelancer has delivered the work results
        uint8 rating; // Rating given by the client (1-5)
        Application[] applications; // All applications for this gig
        uint256 acceptedApplicationId; // ID of the accepted application
        string gigBannerImageHash; // IPFS hash of the gig banner image
        bool clientRejected; // Whether the client has rejected the job results
        bool clientCancelled; // Whether the client cancelled the job
        bool freelancerCancelled; // Whether the freelancer cancelled the job
        uint256 disputeQuestionId; // Question ID for dispute resolution
        bool freelancerUploaded; // Whether the freelancer has uploaded deliverables for the gig
        DeliverableInfo[] deliverableInfo; // Store the deliverable related to the job
    }

    // State variables of the contract
    mapping(uint256 => Gig) public postedGigs;
    uint256 public postedGigsCounter;
    address public owner;

    // Events for database indexing
    event GigCreated(
        uint256 indexed gigId,
        address indexed client,
        uint256 basePayment,
        string title,
        string description,
        string category,
        uint256 maxDurationInHours,
        string gigBannerImageHash
    );

    event ApplicationSubmitted(
        uint256 indexed gigId,
        uint256 indexed applicationId,
        address indexed freelancer,
        uint256 proposedPayment,
        uint256 proposedDurationInHours,
        string proposalComment
    );

    event ApplicationAccepted(
        uint256 indexed gigId,
        uint256 indexed applicationId,
        address indexed freelancer,
        uint256 finalPayment,
        uint256 finalDurationInHours,
        uint256 deadline
    );

    event ApplicationRejected(
        uint256 indexed gigId,
        uint256 indexed applicationId,
        address indexed freelancer,
        string rejectionComment
    );

    event ApplicationWithdrawn(
        uint256 indexed gigId,
        uint256 indexed applicationId,
        address indexed freelancer,
        string rejectionComment
    );

    event FreelancerMarkedAsDelivered(uint256 indexed gigId, address freelancer, uint256 timestamp);

    event ClientMarkedAsReceived(uint256 indexed gigId, address client, uint256 timestamp);

    event GigRated(uint256 indexed gigId, address client, uint8 rating, uint256 timestamp);

    event GigCompleted(uint256 indexed gigId, address freelancer, address client, uint256 payment, uint256 timestamp);

    event GigRejected(
        uint256 indexed gigId,
        address client,
        bool freelancerDelivered,
        bool clientReceived,
        bool clientRejected,
        bool freelancerUploaded,
        uint256 timestamp
    );

    event CommentAdded(
        uint256 indexed gigId,
        address indexed client,
        string response,
        uint256 deliverableUploadedAt,
        uint256 timestamp
    );

    event GigCancelled(
        uint256 indexed gigId,
        GigState state,
        bool clientCancelled,
        bool freelancerCancelled,
        uint256 timestamp
    );

    event DeliverableUploaded(
        uint256 indexed gigId,
        address indexed freelancer,
        string resource,
        string submissionComment,
        bool isLink,
        bool freelancerUploaded,
        uint256 uploadedAt
    );

    event DisputeStarted(
        uint256 indexed gigId,
        bytes32 questionId,
        address indexed requester
    );

    // Modifiers
    modifier onlyClient(uint256 _gigId) {
        require(postedGigs[_gigId].client == msg.sender, "Only client can call this");
        _;
    }

    modifier onlyAcceptedFreelancer(uint256 _gigId) {
        require(postedGigs[_gigId].acceptedFreelancer == msg.sender, "Only accepted freelancer can call this");
        _;
    }

    modifier onlyGigParties(uint256 _gigId) {
        require(
            postedGigs[_gigId].client == msg.sender || postedGigs[_gigId].acceptedFreelancer == msg.sender,
            "Only gig parties can call this"
        );
        _;
    }

    modifier gigExists(uint256 _gigId) {
        require(_gigId < postedGigsCounter, "Gig does not exist");
        _;
    }

    modifier applicationExists(uint256 _gigId, uint256 _applicationId) {
        require(_applicationId < postedGigs[_gigId].applications.length, "Application does not exist");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @dev Constructor
     * @param _owner Address of the contract owner
     * @param _reality Address of the Reality.eth contract
     * @param _arbitrator Address of the arbitrator for dispute resolution
     */
    constructor(address _owner, address _reality, address _arbitrator) {
        require(_reality != address(0), "Invalid Reality.eth address");
        reality = IRealityETH(_reality);
        arbitratorAddress = IArbiterContract(_arbitrator);
        owner = _owner;
    }

    function createGig(GigParams memory params) external returns (uint256) {
        require(params.maxDurationInHours > 0, "Duration must be greater than 0");
        require(bytes(params.title).length > 0, "Title cannot be empty");
        require(bytes(params.description).length > 0, "Description cannot be empty");
        require(bytes(params.category).length > 0, "Category cannot be empty");
        require(params.basePayment > 0, "Base payment must be greater than 0");
        require(bytes(params.title).length <= 64, "Title must be up to 64 characters");
        require(bytes(params.description).length <= 512, "Description must be up to 512 characters");
        require(bytes(params.category).length <= 64, "Category must be up to 64 characters");
        require(bytes(params.gigBannerImageHash).length <= 128, "Banner image hash must be up to 128 characters");

        uint256 gigId = postedGigsCounter++;
        Gig storage newGig = postedGigs[gigId];
        {
            newGig.gigId = gigId;
            newGig.client = msg.sender;
            newGig.acceptedFreelancer = address(0);
            newGig.basePayment = params.basePayment;
            newGig.finalPayment = 0;
            newGig.title = params.title;
            newGig.description = params.description;
            newGig.category = params.category;
            newGig.maxDurationInHours = params.maxDurationInHours;
            newGig.finalDurationInHours = 0;
            newGig.deadline = 0;
            newGig.state = GigState.Open;
            newGig.createdAt = block.timestamp;
            newGig.acceptedAt = 0;
            newGig.clientReceived = false;
            newGig.freelancerDelivered = false;
            newGig.freelancerUploaded = false;
            newGig.rating = 0;
            newGig.acceptedApplicationId = 0;
            newGig.gigBannerImageHash = params.gigBannerImageHash;
            newGig.disputeQuestionId = 0; // No dispute initially
        }

        emit GigCreated(
            gigId,
            msg.sender,
            params.basePayment,
            params.title,
            params.description,
            params.category,
            params.maxDurationInHours,
            params.gigBannerImageHash
        );

        return gigId;
    }

    /**
     * @dev Apply to a gig (Freelancer submits application)
     * @param _gigId The ID of the gig to apply for
     * @param params struct containing proposed payment, duration, and proposal comment
     */
    function applyToGig(uint256 _gigId, ApplicationParams memory params) external gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Open, "Gig is not accepting applications");
        require(msg.sender != gig.client, "Client cannot apply to their own gig");
        require(params.proposedPayment > 0, "Proposed payment must be greater than 0");
        require(params.proposedDurationInHours > 0, "Duration must be greater than 0");
        require(bytes(params.proposal).length > 0, "Proposal comment cannot be empty");
        require(bytes(params.proposal).length <= 512, "Proposal comment must be up to 512 characters");

        _validateApplication(_gigId);

        // Create new application
        uint256 applicationId = gig.applications.length;
        Application memory newApplication = Application({
            applicationId: applicationId,
            freelancer: msg.sender,
            proposedPayment: params.proposedPayment,
            proposedDurationInHours: params.proposedDurationInHours,
            proposalComment: params.proposal,
            state: ApplicationState.Pending,
            createdAt: block.timestamp,
            rejectionComment: ""
        });

        // Add application to the gig
        gig.applications.push(newApplication);

        emit ApplicationSubmitted(
            _gigId,
            applicationId,
            msg.sender,
            params.proposedPayment,
            params.proposedDurationInHours,
            params.proposal
        );
    }

    /**
     * @dev Internal function to validate application parameters
     */
    function _validateApplication(uint256 _gigId) internal view {
        Gig storage gig = postedGigs[_gigId];

        // Check if freelancer has already applied
        for (uint256 i = 0; i < gig.applications.length; i++) {
            require(gig.applications[i].freelancer != msg.sender, "Already applied to this gig");
        }
    }

    /**
     * @dev Accept an application (Client accepts freelancer's proposal)
     * @param _gigId The ID of the gig
     * @param _applicationId The application ID to accept
     */
    function acceptApplication(
        uint256 _gigId,
        uint256 _applicationId
    ) external payable gigExists(_gigId) applicationExists(_gigId, _applicationId) onlyClient(_gigId) {
        Gig storage gig = postedGigs[_gigId];
        Application storage application = gig.applications[_applicationId];

        require(gig.state == GigState.Open, "Gig is not accepting applications");
        require(application.state == ApplicationState.Pending, "Application is not pending");
        require(msg.value == application.proposedPayment, "Must pay the agreed price");

        // Accept the application
        _processAcceptance(_gigId, _applicationId);

        // Reject all other pending applications
        _rejectOtherApplications(_gigId, _applicationId);
    }

    /**
     * @dev Internal function to process application acceptance
     */
    function _processAcceptance(uint256 _gigId, uint256 _applicationId) internal {
        Gig storage gig = postedGigs[_gigId];
        Application storage application = gig.applications[_applicationId];

        require(gig.state == GigState.Open, "Gig is not accepting applications");
        require(application.state == ApplicationState.Pending, "Application is not pending");

        // Accept the application
        application.state = ApplicationState.Accepted;
        gig.acceptedFreelancer = application.freelancer;
        gig.finalPayment = application.proposedPayment;
        gig.finalDurationInHours = application.proposedDurationInHours;
        gig.acceptedApplicationId = _applicationId;
        gig.state = GigState.InProgress;
        gig.acceptedAt = block.timestamp;
        gig.deadline = block.timestamp + (application.proposedDurationInHours * 1 hours);

        emit ApplicationAccepted(
            _gigId,
            _applicationId,
            application.freelancer,
            application.proposedPayment,
            application.proposedDurationInHours,
            gig.deadline
        );
    }

    /**
     * @dev Internal function to reject other pending applications
     */
    function _rejectOtherApplications(uint256 _gigId, uint256 _acceptedId) internal {
        Gig storage gig = postedGigs[_gigId];

        for (uint256 i = 0; i < gig.applications.length; i++) {
            if (i != _acceptedId && gig.applications[i].state == ApplicationState.Pending) {
                gig.applications[i].state = ApplicationState.Rejected;
                gig.applications[i].rejectionComment = "Another application was selected";
                emit ApplicationRejected(
                    _gigId,
                    i,
                    gig.applications[i].freelancer,
                    gig.applications[i].rejectionComment
                );
            }
        }
    }

    /**
     * @dev Reject an application (Client rejects freelancer's proposal)
     * @param _gigId The ID of the gig
     * @param _applicationId The application ID to reject
     * @param _rejectionComment Comment explaining why the application was rejected
     */
    function rejectApplication(
        uint256 _gigId,
        uint256 _applicationId,
        string memory _rejectionComment
    ) external gigExists(_gigId) applicationExists(_gigId, _applicationId) onlyClient(_gigId) {
        Gig storage gig = postedGigs[_gigId];
        Application storage application = gig.applications[_applicationId];

        require(gig.state == GigState.Open, "Gig is not accepting applications");
        require(application.state == ApplicationState.Pending, "Application is not pending");
        require(bytes(_rejectionComment).length <= 512, "Rejection comment must be up to 512 characters");

        application.state = ApplicationState.Rejected;
        application.rejectionComment = _rejectionComment;

        emit ApplicationRejected(_gigId, _applicationId, application.freelancer, _rejectionComment);
    }

    /**
     * @dev Confirm gig completion (both parties must confirm to complete the gig)
     * @param _gigId The gig ID to confirm completion
     */
    function confirmFreelancerCompletion(uint256 _gigId) external gigExists(_gigId) onlyAcceptedFreelancer(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "Gig is not in progress");
        require(gig.acceptedFreelancer != address(0), "No freelancer assigned");

        require(!gig.freelancerDelivered, "Freelancer already marked as delivered");
        require(gig.freelancerUploaded, "Freelancer has not uploaded deliverables");

        gig.freelancerDelivered = true;
        emit FreelancerMarkedAsDelivered(_gigId, msg.sender, block.timestamp);

        // If both parties have confirmed, complete the gig
        if (gig.clientReceived && gig.freelancerDelivered) {
            _completeGig(_gigId);
        }
    }

    function confirmClientCompletion(
        uint256 _gigId,
        string calldata _clientResponse
    ) external gigExists(_gigId) onlyClient(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "Gig is not in progress");
        require(gig.deliverableInfo.length > 0, "No deliverable uploaded yet");
        require(gig.freelancerUploaded, "Freelancer has not uploaded deliverables");

        DeliverableInfo storage deliverableInfo = gig.deliverableInfo[gig.deliverableInfo.length - 1];

        require(gig.acceptedFreelancer != address(0), "No freelancer assigned");
        require(gig.freelancerUploaded, "Freelancer has not uploaded deliverables");
        require(bytes(_clientResponse).length > 0, "Comment cannot be empty");
        require(bytes(_clientResponse).length <= 256, "Comment must be up to 256 characters");
        require(!gig.clientReceived, "Client already confirmed reception");

        gig.clientReceived = true;
        emit ClientMarkedAsReceived(_gigId, msg.sender, block.timestamp);

        deliverableInfo.clientResponse = _clientResponse;
        emit CommentAdded(_gigId, msg.sender, _clientResponse, deliverableInfo.uploadedAt, block.timestamp);

        if (gig.clientReceived && gig.freelancerDelivered) {
            _completeGig(_gigId);
        }
    }

    /**
     * @dev Rate the gig (only client can rate after completion)
     * @param _gigId The gig ID to rate
     * @param _rating The rating to give (1-5)
     */
    function rateGig(uint256 _gigId, uint8 _rating) external gigExists(_gigId) onlyClient(_gigId) {
        Gig storage gig = postedGigs[_gigId];
        require(gig.state == GigState.Completed, "Gig is not completed");
        require(gig.rating == 0, "Gig already rated");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");
        require(_rating % 1 == 0, "Rating must be an integer");

        gig.rating = _rating;
        emit GigRated(_gigId, msg.sender, _rating, block.timestamp);
    }

    /**
     * @dev Internal function to complete gig and release payment
     * @param _gigId The gig ID to complete
     */
    function _completeGig(uint256 _gigId) internal {
        Gig storage gig = postedGigs[_gigId];
        gig.state = GigState.Completed;
        gig.finishedAt = block.timestamp;

        // Send agreed payment to freelancer
        payable(gig.acceptedFreelancer).transfer(gig.finalPayment);

        emit GigCompleted(_gigId, gig.acceptedFreelancer, gig.client, gig.finalPayment, gig.finishedAt);
    }

    /**
     * @dev Cancel a gig
     * @param _gigId The gig ID to cancel
     */
    function cancelGig(uint256 _gigId) external gigExists(_gigId) onlyGigParties(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        if (gig.state == GigState.Open) {
            // If gig is still open, simply cancel the gig
            gig.state = GigState.Cancelled;
        } else if (gig.state == GigState.InProgress) {
            // If gig is in progress, cancel and refund full amount to client

            if (msg.sender == gig.client) {
                gig.clientCancelled = true;
            } else if (msg.sender == gig.acceptedFreelancer) {
                gig.freelancerCancelled = true;
            }

            // Refund payment to client if there was one
            if (gig.client != address(0) && gig.clientCancelled && gig.freelancerCancelled) {
                gig.state = GigState.Cancelled;
                gig.canceledAt = block.timestamp;
                payable(gig.client).transfer(gig.finalPayment);
            }
        } else {
            revert("Gig cannot be cancelled in its current state");
        }

        emit GigCancelled(_gigId, gig.state, gig.clientCancelled, gig.freelancerCancelled, gig.canceledAt);
    }

    function withdrawApplication(
        uint256 _gigId,
        uint256 _applicationId
    ) external gigExists(_gigId) applicationExists(_gigId, _applicationId) {
        Gig storage gig = postedGigs[_gigId];
        Application storage application = gig.applications[_applicationId];

        require(application.freelancer == msg.sender, "Only the applicant can withdraw their application");
        require(application.state == ApplicationState.Pending, "Only pending applications can be withdrawn");

        application.state = ApplicationState.Withdrawn;
        application.rejectionComment = "Application withdrawn by freelancer";

        emit ApplicationWithdrawn(_gigId, _applicationId, msg.sender, application.rejectionComment);
    }

    /**
     * @dev Emergency cancel by owner (with full refund to client)
     * @param _gigId The gig ID to emergency cancel
     */
    function emergencyCancel(uint256 _gigId) external onlyOwner gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        gig.state = GigState.Cancelled;

        // Refund full amount to client if gig is in progress
        if (gig.state == GigState.InProgress) {
            payable(gig.client).transfer(gig.basePayment);
        }

        gig.canceledAt = block.timestamp;

        emit GigCancelled(_gigId, GigState.Cancelled, gig.clientCancelled, gig.freelancerCancelled, gig.canceledAt);
    }

    function getTotalGigsPosted() external view returns (uint256) {
        return postedGigsCounter;
    }

    // Function to receive Ether
    receive() external payable {
        revert("Direct payments not accepted");
    }

    /**
     * @dev Allows the freelancer to upload a file.
     * @param _gigId Gig ID.
     * @param _deliverableParams The content of the file (IPFS hash and comment).
     */
    function uploadDeliverable(
        uint256 _gigId,
        DeliverableParams memory _deliverableParams
    ) external onlyAcceptedFreelancer(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "The gig is not in progress.");

        require(bytes(_deliverableParams.resource).length > 0, "Resource cannot be empty.");
        require(bytes(_deliverableParams.resource).length <= 256, "Resource must be up to 256 characters.");
        require(bytes(_deliverableParams.submissionComment).length <= 256, "Comment must be up to 256 characters.");

        DeliverableInfo memory deliverableToUpload = DeliverableInfo({
            resource: _deliverableParams.resource,
            submissionComment: _deliverableParams.submissionComment,
            uploadedAt: block.timestamp,
            clientResponse: "",
            isLink: _deliverableParams.isLink
        });

        gig.freelancerUploaded = true;
        gig.deliverableInfo.push(deliverableToUpload);

        emit DeliverableUploaded(
            _gigId,
            msg.sender,
            deliverableToUpload.resource,
            deliverableToUpload.submissionComment,
            deliverableToUpload.isLink,
            gig.freelancerUploaded,
            deliverableToUpload.uploadedAt
        );
    }

    function rejectGig(uint256 _gigId, string calldata _comment) external onlyClient(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];
        DeliverableInfo memory deliverableInfo = gig.deliverableInfo[gig.deliverableInfo.length - 1];

        require(gig.state == GigState.InProgress, "The gig is not in progress.");
        require(gig.client != address(0), "The gig has no assigned client.");
        require(gig.acceptedFreelancer != address(0), "The gig has no assigned freelancer.");
        require(bytes(_comment).length > 0, "Comment cannot be empty.");
        require(bytes(_comment).length <= 256, "Comment must be up to 256 characters.");

        gig.freelancerDelivered = false;
        gig.clientReceived = false;
        gig.clientRejected = true;
        gig.rejectedAt = block.timestamp;
        gig.freelancerUploaded = false;

        emit GigRejected(
            _gigId,
            gig.client,
            gig.freelancerDelivered,
            gig.clientReceived,
            gig.clientRejected,
            gig.freelancerUploaded,
            gig.rejectedAt
        );
        emit CommentAdded(_gigId, msg.sender, _comment, deliverableInfo.uploadedAt, block.timestamp);
    }

    // Convert uints to strings properly
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }


    /**
     * @dev Start a dispute for a gig (either party can start a dispute)
     * @param _gigId The ID of the gig to dispute
     * @param _comment Comment explaining the reason for the dispute
     * @param _bountyAmount Amount to be used as bounty for the dispute
     * @param _bondAmount Amount to be used as bond for the first answer
     * @param _escalateToArbitrator Whether to escalate the dispute to an arbitrator immediately
     */
    function startDispute(
        uint256 _gigId,
        string memory _comment,
        uint256 _bountyAmount,
        uint256 _bondAmount,
        bool _escalateToArbitrator
    ) external payable onlyGigParties(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];
        require(gig.state == GigState.InProgress, "Gig not in progress");
        require(bytes(_comment).length > 0, "Comment cannot be empty");
        require(msg.value > 0, "Payed amount must be greater than 0");
        require(_bountyAmount > 0, "Bounty amount must be greater than 0");
        require(_bondAmount > 0, "Bond amount must be greater than 0");
        // Get arbitration fee from arbitrator contract
        uint256 arbitrationFee = arbitratorAddress.arbitrationFee();
        require(arbitrationFee > 0, "Arbitration fee must be greater than 0");
        if (_escalateToArbitrator) {
            require(msg.value >= _bondAmount + _bountyAmount + arbitrationFee, "Insufficient funds to cover bounty, bond, and arbitration fee");
        } else {
            require(msg.value >= _bondAmount + _bountyAmount, "Insufficient funds to cover bounty and bond");
        }

        string memory senderRole = msg.sender == gig.client ? "Client" : "Freelancer";
        string memory comment = string(
            abi.encodePacked(senderRole, "\u0027s comment\u003A ", _comment)
        );

        string memory filesString = "";
        if (gig.deliverableInfo.length == 0) {
            filesString = "No files attached";
        } else {
            for (uint256 i = 0; i < gig.deliverableInfo.length; i++) {
                filesString = string(abi.encodePacked(
                    filesString,
                    gig.deliverableInfo[i].isLink ? "Link\u003A " : "IPFS\u003A ",
                    gig.deliverableInfo[i].resource
                ));
                if (i < gig.deliverableInfo.length - 1) {
                    filesString = string(abi.encodePacked(filesString, " \u007C "));
                }
            }
        }

        string memory questionData = string(
            abi.encodePacked(
                "Did the freelancer fulfill the gig contract agreement? -> ",
                comment,
                " -> Files: \u007C ",
                filesString,
                "\u241f",
                "freelance",
                "\u241f",
                "en"
            )
        );

        // Forward the bounty to Reality.eth and create the question
        try reality.askQuestion{value: _bountyAmount}(
            uint256(0),
            questionData,
            address(arbitratorAddress),
            uint32(300),
            uint32(block.timestamp),
            uint256(_gigId * 1000 + block.timestamp)
        ) returns (bytes32 questionId) {
            // Store the question ID in the gig
            gig.state = GigState.Disputed;
            gig.disputeQuestionId = uint256(questionId);

            // Answer the question depending on who is calling
            // Client wants to answer "No" (freelancer did not fulfill)
            // Freelancer wants to answer "Yes" (freelancer did fulfill)
            uint256 answer = msg.sender == gig.client ? uint256(0) : uint256(1);

            require(address(this).balance >= _bondAmount, "Not enough left for bond");

            // Submit the answer with the provided bond
            reality.submitAnswerFor{value: _bondAmount}(questionId, bytes32(answer), 0, msg.sender);
            // If escalateToArbitrator is true, request arbitration
            if (_escalateToArbitrator) {
                arbitratorAddress.requestArbitration{value: arbitrationFee}(questionId, _bondAmount);
            }

            emit DisputeStarted(_gigId, questionId, msg.sender);
        } catch {
            revert("Reality.eth failed: low-level error");
        }
    }

    function getDisputeResult(uint256 _gigId) external view gigExists(_gigId) returns (bytes32) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "Gig is not disputed");
        require(gig.disputeQuestionId != 0, "No dispute question ID");

        bytes32 questionId = bytes32(gig.disputeQuestionId);
        return reality.resultFor(questionId);
    }

    function resolveDispute(uint256 _gigId) external onlyGigParties(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "Gig is not disputed");
        require(gig.disputeQuestionId != 0, "No dispute question ID");

        bytes32 questionId = bytes32(gig.disputeQuestionId);
        bytes32 result;
        try reality.resultFor(questionId) returns (bytes32 r) {
            result = r;
        } catch (bytes memory revertData) {
            if (revertData.length == 32 && keccak256(revertData) == keccak256(abi.encodePacked(bytes32("question must be finalized")))) {
            revert("question must be finalized");
            } else {
            revert("Reality.eth failed: low-level error");
            }
        }

        // If result is bytes32(0), treat as "No" answer (client wins)
        if (result == bytes32(uint256(1))) {
            // Freelancer wins, release payment
            payable(gig.acceptedFreelancer).transfer(gig.finalPayment);
        } else {
            // Client wins, refund payment
            payable(gig.client).transfer(gig.finalPayment);
        }

        gig.state = GigState.Completed;
        gig.finishedAt = block.timestamp;
        emit GigCompleted(_gigId, gig.acceptedFreelancer, gig.client, gig.finalPayment, gig.finishedAt);
    }
}

