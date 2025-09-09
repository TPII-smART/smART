//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./common/FileInfo.sol";

/**
 * @title JobsContract
 * @dev A simplified escrow contract for managing freelance job postings.
 * @author SmArt
 */
contract JobsContract {
    // Enums for job states
    enum JobState {
        WaitingForApproval,
        Ongoing,
        Finished,
        Cancelled,
        Disputed
    }

    // Struct for individual jobs
    // Each job is stored inside a JobPosting, containing details about the job and the people involved
    struct Job {
        uint256 jobId;
        address client;
        address freelancer;
        uint256 payment;
        string title;
        string description;
        string category;
        uint256 durationInHours; // Estimated time to complete job in hours
        uint256 deadline; // Actual deadline set when job is accepted
        JobState state;
        uint256 createdAt;
        uint256 acceptedAt; // When the job was accepted
        uint256 finishedAt; // When the job was finished
        uint256 canceledAt; // When the job was canceled
        uint256 rejectedAt; // When the job was rejected by the client
        uint8 rating; // Rating given by the client, should be between 1 and 5
        bool clientReceived; // Whether the client has received the job results
        bool freelancerDelivered; // Whether the freelancer has delivered the job results
        bool clientRejected; // Whether the client has rejected the job results
        bool clientCancelled; // Whether the client cancelled the job
        bool freelancerCancelled; // Whether the freelancer cancelled the job
        FileInfo fileInfo; // Store the file related to the job
    }

    // Struct that reduces the amount of parameters needed when submitting a Job
    struct JobParams {
        string title;
        string description;
        uint256 payment; // Payment amount in wei
        uint256 durationInHours; // Estimated time to complete job in hours
    }

    // Struct for the JobPostings
    struct JobPosting {
        uint256 postingId;
        address freelancer;
        uint256 basePayment;
        string title;
        string description;
        string category;
        string bannerImageHash;
        uint256 minimumNoticeTime;
        uint256 averageWorkDuration;
        uint256 createdAt;
        Job[] jobs;
    }

    // Struct that reduces the amount of parameters needed when submitting a JobPosting
    struct JobPostingParams {
        string title;
        string description;
        string category;
        string bannerImageHash;
        uint256 basePayment;
        uint256 minimumNoticeTime;
        uint256 averageWorkDuration;
    }

    // State variables of the contract
    mapping(uint256 => JobPosting) public postedJobs;
    uint256 public postedJobsCounter;
    address public owner;

    // Events for Ponder database indexing
    event JobPostingCreated(
        uint256 indexed postingId,
        address indexed freelancer,
        uint256 basePayment,
        string title,
        string description,
        string category,
        string bannerImageHash,
        uint256 minimumNoticeTime,
        uint256 averageWorkDuration
    );

    event JobCreated(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address indexed freelancer,
        address client,
        uint256 payment,
        string title,
        string description,
        string category,
        string bannerImageHash,
        uint256 jobDuration
    );

    event JobAccepted(uint256 indexed postingId, uint256 indexed jobId, address indexed client, uint256 deadline);

    event FreelancerMarkedAsDelivered(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address freelancer,
        uint256 timestamp
    );

    event ClientMarkedAsReceived(uint256 indexed postingId, uint256 indexed jobId, address client, uint256 timestamp);

    event JobFinished(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address freelancer,
        address client,
        uint256 payment,
        uint256 timestamp
    );

    event JobRated(uint256 indexed postingId, uint256 indexed jobId, address client, uint8 rating, uint256 timestamp);

    event JobCancelled(
        uint256 indexed postingId,
        uint256 indexed jobId,
        JobState state,
        bool clientCancelled,
        bool freelancerCancelled,
        uint256 timestamp
    );

    event FileUploaded(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address indexed freelancer,
        string resource,
        string submissionComment,
        bool isLink,
        uint256 timestamp
    );

    event CommentAdded(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address indexed client,
        string response,
        uint256 timestamp
    );

    event JobRejected(
        uint256 indexed postingId,
        uint256 indexed jobId,
        bool freelancerDelivered,
        bool clientReceived,
        bool clientRejected,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyFreelancer(uint256 _postingId, uint256 _jobId) {
        require(postedJobs[_postingId].jobs[_jobId].freelancer == msg.sender, "Only freelancer can call this");
        _;
    }

    modifier notFreelancer(uint256 _postingId) {
        require(
            postedJobs[_postingId].freelancer != msg.sender,
            "Freelancer cannot create a job for their own posting"
        );
        _;
    }

    modifier onlyClient(uint256 _postingId, uint256 _jobId) {
        require(postedJobs[_postingId].jobs[_jobId].client == msg.sender, "Only client can call this");
        _;
    }

    modifier onlyJobParties(uint256 _postingId, uint256 _jobId) {
        require(
            postedJobs[_postingId].jobs[_jobId].freelancer == msg.sender ||
                postedJobs[_postingId].jobs[_jobId].client == msg.sender,
            "Only job parties can call this"
        );
        _;
    }

    modifier postingExists(uint256 _postingId) {
        require(_postingId < postedJobsCounter, "Job posting does not exist");
        _;
    }

    modifier jobExists(uint256 _postingId, uint256 _jobId) {
        require(_jobId < postedJobs[_postingId].jobs.length, "Job does not exist");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    /**
     * @dev Create a new job posting (Freelancer creates job offer)
     * @param params Struct containing all job posting parameters
     */
    function createJobPosting(JobPostingParams memory params) external returns (uint256) {
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

        uint256 postingId = postedJobsCounter++;

        // Create JobPosting with all required fields including empty jobs array
        JobPosting storage newPosting = postedJobs[postingId];
        {
            newPosting.postingId = postingId;
            newPosting.freelancer = msg.sender;
            newPosting.basePayment = params.basePayment;
            newPosting.title = params.title;
            newPosting.description = params.description;
            newPosting.category = params.category;
            newPosting.bannerImageHash = params.bannerImageHash;
            newPosting.minimumNoticeTime = params.minimumNoticeTime;
            newPosting.averageWorkDuration = params.averageWorkDuration;
            newPosting.createdAt = block.timestamp;
            // jobs array is automatically initialized as empty
        }

        emit JobPostingCreated(
            postingId,
            msg.sender,
            params.basePayment,
            params.title,
            params.description,
            params.category,
            params.bannerImageHash,
            params.minimumNoticeTime,
            params.averageWorkDuration
        );

        return postingId;
    }

    /**
     * @dev Create a new job under an existing job posting (Client creates job)
     * @param _postingId The ID of the job posting to create a job under
     * @param params Struct containing all job parameters
     */
    function createJob(
        uint256 _postingId,
        JobParams memory params
    ) external payable postingExists(_postingId) notFreelancer(_postingId) {
        JobPosting storage posting = postedJobs[_postingId];

        require(msg.value == params.payment, "Must send exact payment amount");
        require(params.payment > 0, "Payment must be greater than 0");
        require(params.durationInHours > 0, "Duration must be greater than 0");
        require(bytes(params.title).length > 0, "Title cannot be empty");
        require(bytes(params.description).length > 0, "Description cannot be empty");
        require(bytes(params.title).length <= 64, "Title exceeds 64 characters");
        require(bytes(params.description).length <= 512, "Description exceeds 512 characters");
        require(bytes(posting.category).length <= 64, "Category exceeds 64 characters");
        require(bytes(posting.bannerImageHash).length <= 128, "Banner image hash exceeds 128 characters");
        require(posting.freelancer != address(0), "Freelancer address must not be zero");
        require(msg.sender != address(0), "Client address must not be zero");

        // Create new job
        uint256 jobId = posting.jobs.length;
        Job memory newJob = Job({
            jobId: jobId,
            client: msg.sender,
            freelancer: posting.freelancer,
            payment: params.payment,
            title: params.title,
            description: params.description,
            category: posting.category,
            durationInHours: params.durationInHours,
            deadline: 0, // Deadline will be set when job is accepted, while waiting for approval no progress is made
            state: JobState.WaitingForApproval,
            createdAt: block.timestamp,
            acceptedAt: 0,
            finishedAt: 0,
            canceledAt: 0,
            rejectedAt: 0,
            rating: 0, // Rating is not set until job is finished
            clientReceived: false,
            freelancerDelivered: false,
            clientRejected: false,
            clientCancelled: false,
            freelancerCancelled: false,
            fileInfo: FileInfo({
                resource: "",
                uploadedAt: 0,
                submissionComment: "",
                clientResponse: "",
                isLink: false
            })
        });

        // Add job to the posting
        posting.jobs.push(newJob);

        emit JobCreated(
            _postingId,
            jobId,
            posting.freelancer,
            msg.sender,
            params.payment,
            params.title,
            params.description,
            posting.category,
            posting.bannerImageHash,
            params.durationInHours
        );
    }

    /**
     * @dev Accept an available job and set deadline (Freelancer accepts job offered by client)
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to accept
     */
    function acceptJob(uint256 _postingId, uint256 _jobId) external jobExists(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        require(job.state == JobState.WaitingForApproval, "Job is not available for acceptance");
        require(msg.sender == job.freelancer, "Only freelancer can accept this job");
        require(job.client != address(0), "Job has no assigned client");
        require(job.durationInHours > 0, "Job duration must be greater than 0");

        // Set job state to ongoing
        job.state = JobState.Ongoing;
        job.acceptedAt = block.timestamp;
        job.deadline = block.timestamp + (job.durationInHours * 1 hours); // Set deadline based on duration

        emit JobAccepted(_postingId, _jobId, job.client, job.deadline);
    }

    /**
     * @dev Confirm job completion (both parties must confirm in order to complete the job)
     * This function allows either the client or freelancer to confirm that the job has been completed.
     * If both parties confirm, the job is marked as finished and payment is released.
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to confirm completion
     */
    function confirmCompletion(
        uint256 _postingId,
        uint256 _jobId
    ) external onlyJobParties(_postingId, _jobId) jobExists(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        require(job.state == JobState.Ongoing, "Job is not ongoing");
        require(job.client != address(0), "Job has no assigned client");
        require(job.freelancer != address(0), "Job has no assigned freelancer");

        // Set confirmation based on who is calling
        if (msg.sender == job.client) {
            require(!job.clientReceived, "Client already confirmed job reception");
            job.clientReceived = true;
            emit ClientMarkedAsReceived(_postingId, _jobId, msg.sender, block.timestamp);
        } else {
            require(!job.freelancerDelivered, "Freelancer already marked the job as delivered");
            job.freelancerDelivered = true;
            emit FreelancerMarkedAsDelivered(_postingId, _jobId, msg.sender, block.timestamp);
        }

        // If both parties have confirmed, complete the job
        if (job.clientReceived && job.freelancerDelivered) {
            _completeJob(_postingId, _jobId);
        }
    }

    /**
     * @dev Internal function to complete job and release payment
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to complete
     */
    function _completeJob(uint256 _postingId, uint256 _jobId) internal {
        Job storage job = postedJobs[_postingId].jobs[_jobId];
        job.state = JobState.Finished;
        job.finishedAt = block.timestamp;

        // Sends payment to freelancer
        payable(job.freelancer).transfer(job.payment);

        emit JobFinished(_postingId, _jobId, job.freelancer, job.client, job.payment, job.finishedAt);
    }

    /**
     * @dev Internal function to rate a job
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to rate
     * @param _rating The rating given by the client (1-5)
     */
    function rateJob(uint256 _postingId, uint256 _jobId, uint8 _rating) external onlyClient(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];
        require(job.state == JobState.Finished, "Job is not finished");
        require(job.rating == 0, "Job already rated");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");
        require(_rating % 1 == 0, "Rating must be an integer");
        job.rating = _rating;
        emit JobRated(_postingId, _jobId, msg.sender, _rating, block.timestamp);
    }

    /**
     * @dev Cancel a job
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to cancel
     */
    function cancelJob(
        uint256 _postingId,
        uint256 _jobId
    ) external jobExists(_postingId, _jobId) onlyJobParties(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        if (job.state == JobState.WaitingForApproval) {
            // If job is still waiting for approval, simply remove it
            job.state = JobState.Cancelled;
        } else if (job.state == JobState.Ongoing) {
            job.state = JobState.Cancelled;

            if (msg.sender == job.client) {
                job.clientCancelled = true;
            } else if (msg.sender == job.freelancer) {
                job.freelancerCancelled = true;
            }

            // Refund payment to client if there was one
            if (job.client != address(0) && job.clientCancelled && job.freelancerCancelled) {
                payable(job.client).transfer(job.payment);
            }
        } else {
            revert("Job cannot be cancelled in its current state");
        }

        job.canceledAt = block.timestamp;

        emit JobCancelled(
            _postingId,
            _jobId,
            JobState.Cancelled,
            job.clientCancelled,
            job.freelancerCancelled,
            job.canceledAt
        );
    }

    /**
     * @dev Emergency cancel by owner (with refund)
     * @param _jobId The job ID to emergency cancel
     */
    function emergencyCancel(uint256 _postingId, uint256 _jobId) external onlyOwner jobExists(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        job.state = JobState.Cancelled;

        // Refund payment to client if there was one
        if (job.client != address(0)) {
            payable(job.client).transfer(job.payment);
        }

        emit JobCancelled(
            _postingId,
            _jobId,
            JobState.Cancelled,
            job.clientCancelled,
            job.freelancerCancelled,
            block.timestamp
        );
    }

    /**
     * @dev Get the number of jobs in a posting
     * @param _postingId The ID of the job posting
     * @return Number of jobs in the posting
     */
    function getJobCount(uint256 _postingId) external view postingExists(_postingId) returns (uint256) {
        return postedJobs[_postingId].jobs.length;
    }

    function getTotalJobsPosted() external view returns (uint256) {
        return postedJobsCounter;
    }

    function isFileUploaded(
        uint256 postingId,
        uint256 jobId,
        string memory comment,
        string memory ipfsHash
    ) external view returns (bool) {
        FileInfo memory fileInfo = postedJobs[postingId].jobs[jobId].fileInfo;

        return
            bytes(fileInfo.resource).length > 0 &&
            keccak256(bytes(fileInfo.submissionComment)) == keccak256(bytes(comment)) &&
            keccak256(bytes(fileInfo.resource)) == keccak256(bytes(ipfsHash));
    }

    // Function to receive Ether
    receive() external payable {
        revert("Direct payments not accepted");
    }

    /**
     * @dev Allows the freelancer to upload a file.
     * @param _postingId  JobPosting ID.
     * @param _jobId Job ID.
     * @param _fileParams The content of the file (IPFS hash and comment).
     */
    function uploadFile(
        uint256 _postingId,
        uint256 _jobId,
        FileParams memory _fileParams
    ) external onlyFreelancer(_postingId, _jobId) jobExists(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        require(job.state == JobState.Ongoing, "The job is not ongoing.");

        require(bytes(_fileParams.resource).length > 0, "Resource cannot be empty.");
        require(bytes(_fileParams.resource).length <= 256, "Resource must be up to 256 characters.");
        require(bytes(_fileParams.submissionComment).length <= 256, "Comment must be up to 256 characters.");

        job.fileInfo = FileInfo({
            resource: _fileParams.resource,
            submissionComment: _fileParams.submissionComment,
            uploadedAt: block.timestamp,
            clientResponse: "",
            isLink: _fileParams.isLink
        });

        emit FileUploaded(
            _postingId,
            _jobId,
            msg.sender,
            job.fileInfo.resource,
            job.fileInfo.submissionComment,
            job.fileInfo.isLink,
            job.fileInfo.uploadedAt
        );
    }

    /**
     * @dev Allows the client to add a response to the last uploaded file.
     * @param _postingId JobPosting ID.
     * @param _jobId Job ID.
     * @param _comment Comment text.
     */
    function addCommentToJob(
        uint256 _postingId,
        uint256 _jobId,
        string calldata _comment
    ) external onlyClient(_postingId, _jobId) jobExists(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        require(job.state == JobState.Ongoing, "The job is not ongoing.");
        require(bytes(_comment).length > 0, "Comment cannot be empty.");
        require(bytes(_comment).length <= 256, "Comment must be up to 256 characters.");

        job.fileInfo.clientResponse = _comment;

        emit CommentAdded(_postingId, _jobId, msg.sender, _comment, block.timestamp);
    }

    function rejectJob(
        uint256 _postingId,
        uint256 _jobId
    ) external onlyClient(_postingId, _jobId) jobExists(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        require(job.state == JobState.Ongoing, "Job is not ongoing");
        require(job.client != address(0), "Job has no assigned client");
        require(job.freelancer != address(0), "Job has no assigned freelancer");

        job.freelancerDelivered = false;
        job.clientReceived = false;
        job.clientRejected = true;
        job.rejectedAt = block.timestamp;

        emit JobRejected(
            _postingId,
            _jobId,
            job.freelancerDelivered,
            job.clientReceived,
            job.clientRejected,
            job.rejectedAt
        );
    }
}
