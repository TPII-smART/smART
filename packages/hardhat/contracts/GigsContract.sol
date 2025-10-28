//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./common/DeliverableInfo.sol";
import "./common/IArbitrableProxy.sol";

/**
 * @title GigsContract
 * @dev A contract for managing gigs where clients post work requests and freelancers apply with proposals.
 * @author SmArt
 */
contract GigsContract {
    IArbitrableProxy public arbiterProxy;

    bytes public constant arbitratorExtraData = hex"0000000000000000000000000000000000000000000000000000000000000003"; // Court + Jurors quantity for Kleros

    uint256 public constant OVERFLOW = type(uint256).max;

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
        bool freelancerUploaded; // Whether the freelancer has uploaded deliverables for the gig
        uint256 disputeId; // ID of the dispute in the arbitrator contract, if any
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

    event ClientMarkedAsReceived(
        uint256 indexed gigId,
        address client,
        string comment,
        uint256 deliverableUploadedAt,
        uint256 timestamp
    );

    event GigRated(uint256 indexed gigId, address client, uint8 rating, uint256 timestamp);

    event GigCompleted(uint256 indexed gigId, address freelancer, address client, uint256 payment, uint256 timestamp);

    event GigRejected(
        uint256 indexed gigId,
        address client,
        bool freelancerDelivered,
        bool clientReceived,
        bool clientRejected,
        bool freelancerUploaded,
        string comment,
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
     * @param _KlerosArbitrator Address of the Kleros arbitrator for dispute resolution
     */
    constructor(address _owner, address _KlerosArbitrator) {
        require(_KlerosArbitrator != address(0), "Invalid Kleros arbitrator address");
        arbiterProxy = IArbitrableProxy(_KlerosArbitrator);
        owner = _owner;
    }

    function changeArbitrator(address _newArbitrator) external onlyOwner {
        require(_newArbitrator != address(0), "Invalid arbitrator address");
        arbiterProxy = IArbitrableProxy(_newArbitrator);
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
            newGig.disputeId = 0; // No dispute initially
            newGig.gigBannerImageHash = params.gigBannerImageHash;
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
     * @param _deliverableParams The deliverable information submitted by the freelancer
     */
    function confirmFreelancerCompletion(
        uint256 _gigId,
        DeliverableParams memory _deliverableParams
    ) external gigExists(_gigId) onlyAcceptedFreelancer(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "Gig is not in progress");
        require(gig.acceptedFreelancer != address(0), "No freelancer assigned");

        require(!gig.freelancerDelivered, "Freelancer already marked as delivered");

        _uploadDeliverable(_gigId, _deliverableParams);

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
        deliverableInfo.clientResponse = _clientResponse;
        deliverableInfo.state = DeliverableState.Approved;
        deliverableInfo.responseTimestamp = block.timestamp;

        emit ClientMarkedAsReceived(_gigId, msg.sender, _clientResponse, deliverableInfo.uploadedAt, block.timestamp);

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
    function _uploadDeliverable(
        uint256 _gigId,
        DeliverableParams memory _deliverableParams
    ) internal onlyAcceptedFreelancer(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "The gig is not in progress.");

        require(bytes(_deliverableParams.resource).length > 0, "Resource cannot be empty.");
        require(bytes(_deliverableParams.resource).length <= 256, "Resource must be up to 256 characters.");
        require(bytes(_deliverableParams.submissionComment).length <= 256, "Comment must be up to 256 characters.");

        uint256 _currentDeliverableGroupId = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _gigId, "evidence"))
        ) % OVERFLOW;

        // If there was already a deliverableGroupId generated, keep that one
        if (gig.deliverableInfo.length > 0) {
            DeliverableInfo memory lastDeliverable = gig.deliverableInfo[gig.deliverableInfo.length - 1];
            _currentDeliverableGroupId = lastDeliverable.deliverableGroupId;
        }

        DeliverableInfo memory deliverableToUpload = DeliverableInfo({
            resource: _deliverableParams.resource,
            parsedResource: _deliverableParams.parsedResource,
            submissionComment: _deliverableParams.submissionComment,
            uploadedAt: block.timestamp,
            responseTimestamp: 0,
            clientResponse: "",
            isLink: _deliverableParams.isLink,
            state: DeliverableState.Pending,
            deliverableGroupId: _currentDeliverableGroupId
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

        arbiterProxy.submitEvidence(
            gig.acceptedFreelancer,
            gig.disputeId,
            gig.deliverableInfo[gig.deliverableInfo.length - 1].deliverableGroupId,
            deliverableToUpload.parsedResource,
            // Avoids checks and operations related to an existing dispute
            true
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

        deliverableInfo.clientResponse = _comment;
        deliverableInfo.state = DeliverableState.Rejected;
        deliverableInfo.responseTimestamp = block.timestamp;

        emit GigRejected(
            _gigId,
            gig.client,
            gig.freelancerDelivered,
            gig.clientReceived,
            gig.clientRejected,
            gig.freelancerUploaded,
            _comment,
            deliverableInfo.uploadedAt,
            gig.rejectedAt
        );
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
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function startDispute(
        uint256 _gigId,
        string calldata _metaEvidenceURI,
        string calldata _reason
    ) external payable onlyGigParties(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "Dispute can only be started for ongoing gigs");
        require(gig.disputeId == 0, "Dispute already exists for this gig");
        require(msg.value > 0, "Must send arbitration fee");
        require(bytes(_metaEvidenceURI).length > 0, "Meta evidence URI cannot be empty");
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        require(bytes(_reason).length <= 256, "Reason must be up to 256 characters");

        uint256 disputeId;

        if (msg.sender == gig.acceptedFreelancer) {
            disputeId = arbiterProxy.createAndPayGigDisputeByFreelancer{ value: msg.value }(
                _gigId,
                gig.acceptedFreelancer,
                gig.client,
                arbitratorExtraData,
                _reason,
                gig.deliverableInfo[gig.deliverableInfo.length - 1].deliverableGroupId
            );
        } else if (msg.sender == gig.client) {
            disputeId = arbiterProxy.createAndPayGigDisputeByClient{ value: msg.value }(
                _gigId,
                gig.acceptedFreelancer,
                gig.client,
                arbitratorExtraData,
                _reason,
                gig.deliverableInfo[gig.deliverableInfo.length - 1].deliverableGroupId
            );
        } else {
            revert("Only gig parties can start a dispute");
        }

        gig.state = GigState.Disputed;
        gig.disputeId = disputeId;
    }

    function getArbitrationFee() external view returns (uint256) {
        uint256 feeAmount = arbiterProxy.arbitrator().arbitrationCost(arbitratorExtraData);
        return feeAmount;
    }

    function payArbitrationFee(uint256 _gigId) external payable onlyGigParties(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "No dispute to pay for this gig");
        require(gig.disputeId != 0, "No dispute exists for this gig");
        uint256 feeAmount = arbiterProxy.arbitrator().arbitrationCost(arbitratorExtraData);
        require(msg.value >= feeAmount, "Insufficient arbitration fee");

        if (msg.sender == gig.acceptedFreelancer) {
            arbiterProxy.payArbitrationFeeByFreelancer{ value: msg.value }(
                msg.sender,
                gig.disputeId,
                arbitratorExtraData,
                gig.deliverableInfo[gig.deliverableInfo.length - 1].deliverableGroupId
            );
        } else if (msg.sender == gig.client) {
            arbiterProxy.payArbitrationFeeByClient{ value: msg.value }(
                msg.sender,
                gig.disputeId,
                arbitratorExtraData,
                gig.deliverableInfo[gig.deliverableInfo.length - 1].deliverableGroupId
            );
        } else {
            revert("Only gig parties can pay arbitration fee");
        }
    }

    function concedeDispute(uint256 _gigId) external onlyGigParties(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "No dispute to concede for this gig");
        require(gig.disputeId != 0, "No dispute exists for this gig");

        if (msg.sender == gig.acceptedFreelancer) {
            // Freelancer concedes, ruling in favor of client
            arbiterProxy.concedeDispute(gig.disputeId, 2);
        } else if (msg.sender == gig.client) {
            // Client concedes, ruling in favor of freelancer
            arbiterProxy.concedeDispute(gig.disputeId, 1);
        } else {
            revert("Only hired talent parties can concede dispute");
        }

        emit GigCompleted(_gigId, gig.acceptedFreelancer, gig.client, gig.finalPayment, gig.finishedAt);
    }

    function finalizeDispute(uint256 _gigId) external onlyGigParties(_gigId) gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "No dispute to finalize for this gig");
        require(gig.disputeId != 0, "No dispute exists for this gig");

        if (arbiterProxy.hasTimedOut(gig.disputeId)) {
            arbiterProxy.timeoutByInaction(gig.disputeId);
        } else {
            arbiterProxy.finalizeDispute(gig.disputeId);
        }

        uint256 ruling = arbiterProxy.getCurrentRuling(gig.disputeId);
        address recipient;

        if (ruling == 1) {
            // Ruling in favor of freelancer
            recipient = gig.acceptedFreelancer;
        } else if (ruling == 2) {
            // Ruling in favor of client
            recipient = gig.client;
        } else {
            revert("Invalid ruling from arbitrator");
        }

        gig.state = GigState.Completed;
        gig.finishedAt = block.timestamp;
        payable(recipient).transfer(gig.finalPayment);

        emit GigCompleted(_gigId, gig.acceptedFreelancer, gig.client, gig.finalPayment, gig.finishedAt);
    }

    function fundAppeal(uint256 _gigId, uint8 _side) external payable gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "No dispute to appeal for this gig");
        require(gig.disputeId != 0, "No dispute exists for this gig");
        require(_side == 1 || _side == 2, "Invalid side");

        if (msg.sender == gig.acceptedFreelancer) {
            require(_side == 1, "Freelancer can only fund their own side");
            arbiterProxy.fundAppeal{ value: msg.value }(msg.sender, gig.disputeId, _side);
        } else if (msg.sender == gig.client) {
            require(_side == 2, "Client can only fund their own side");
            arbiterProxy.fundAppeal{ value: msg.value }(msg.sender, gig.disputeId, _side);
        } else {
            arbiterProxy.fundAppeal{ value: msg.value }(msg.sender, gig.disputeId, _side);
        }
    }

    function getCurrentRuling(uint256 _gigId) external view gigExists(_gigId) returns (uint256) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "No dispute for this gig");
        require(gig.disputeId != 0, "No dispute exists for this gig");

        return arbiterProxy.getCurrentRuling(gig.disputeId);
    }

    function submitEvidence(
        uint256 _gigId,
        string calldata _evidenceURI,
        uint256 _evidenceGroupId
    ) external gigExists(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.Disputed, "No dispute ongoing for this gig");
        require(gig.disputeId >= 0, "No dispute exists for this gig");
        require(bytes(_evidenceURI).length > 0, "Evidence URI cannot be empty");

        arbiterProxy.submitEvidence(
            msg.sender,
            gig.disputeId,
            _evidenceGroupId,
            _evidenceURI,
            // If this method is called, we want to emit the evidence event in an ongoing dispute
            false
        );
    }
}
