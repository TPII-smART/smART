//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GigsContract
 * @dev A contract for managing gigs where clients post work requests and freelancers apply with proposals.
 * @author SmArt
 */
contract GigsContract {
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
        Rejected
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
        uint256 finishedAt; // When an application was finished
        bool clientReceived; // Whether the client has received the work results
        bool freelancerDelivered; // Whether the freelancer has delivered the work results
        Application[] applications; // All applications for this gig
        uint256 acceptedApplicationId; // ID of the accepted application
        string gigBannerImageHash; // IPFS hash of the gig banner image
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

    event FreelancerMarkedAsDelivered(uint256 indexed gigId, address freelancer, uint256 timestamp);

    event ClientMarkedAsReceived(uint256 indexed gigId, address client, uint256 timestamp);

    event GigCompleted(uint256 indexed gigId, address freelancer, address client, uint256 payment, uint256 timestamp);

    event GigCancelled(uint256 indexed gigId, GigState state, uint256 timestamp);

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

    constructor(address _owner) {
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
            newGig.acceptedApplicationId = 0;
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
     */
    function confirmCompletion(uint256 _gigId) external gigExists(_gigId) onlyGigParties(_gigId) {
        Gig storage gig = postedGigs[_gigId];

        require(gig.state == GigState.InProgress, "Gig is not in progress");
        require(gig.acceptedFreelancer != address(0), "No freelancer assigned");

        // Set confirmation based on who is calling
        if (msg.sender == gig.client) {
            require(!gig.clientReceived, "Client already confirmed reception");
            gig.clientReceived = true;
            emit ClientMarkedAsReceived(_gigId, msg.sender, block.timestamp);
        } else {
            require(!gig.freelancerDelivered, "Freelancer already marked as delivered");
            gig.freelancerDelivered = true;
            emit FreelancerMarkedAsDelivered(_gigId, msg.sender, block.timestamp);
        }

        // If both parties have confirmed, complete the gig
        if (gig.clientReceived && gig.freelancerDelivered) {
            _completeGig(_gigId);
        }
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
            gig.state = GigState.Cancelled;
            payable(gig.client).transfer(gig.finalPayment);
        } else {
            revert("Gig cannot be cancelled in its current state");
        }

        gig.canceledAt = block.timestamp;

        emit GigCancelled(_gigId, GigState.Cancelled, gig.canceledAt);
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

        emit GigCancelled(_gigId, GigState.Cancelled, gig.canceledAt);
    }

    function getTotalGigsPosted() external view returns (uint256) {
        return postedGigsCounter;
    }

    // Function to receive Ether
    receive() external payable {
        revert("Direct payments not accepted");
    }
}
