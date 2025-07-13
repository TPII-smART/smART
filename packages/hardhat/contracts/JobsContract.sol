//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title JobsContract
 * @dev A simplified escrow contract for managing freelance job postings.
 * @author SmArt
 */
contract JobsContract {

    // Enums for job states
    enum JobState { WaitingForApproval, Ongoing, Finished, Cancelled, Disputed }

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
        bool clientReceived; // Whether the client has received the job results
        bool freelancerDelivered; // Whether the freelancer has delivered the job results
    }

    // Struct for the JobPostings
    struct JobPosting {
        uint256 postingId;
        address freelancer;
        uint256 basePayment;
        string title;
        string description;
        string category;
        string bannerImageUrl;
        uint256 minimumNoticeTime;
        uint256 averageWorkDuration;
        uint256 createdAt;
        Job[] jobs;
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
        string bannerImageUrl,
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
        string bannerImageUrl,
        uint256 jobDuration
    );

    event JobAccepted(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address indexed client,
        uint256 deadline
    );

    event FreelancerMarkedAsDelivered(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address freelancer,
        uint256 timestamp
    );

    event ClientMarkedAsReceived(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address client,
        uint256 timestamp
    );

    event JobFinished(
        uint256 indexed postingId,
        uint256 indexed jobId,
        address freelancer,
        address client,
        uint256 payment
    );

    event JobCancelled(
        uint256 indexed postingId,
        uint256 indexed jobId,
        JobState state,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyFreelancer(uint256 _postingId, uint256 _jobId) {
        require(postedJobs[_postingId].jobs[_jobId].freelancer == msg.sender, "Only freelancer can call this");
        _;
    }

    modifier notFreelancer(uint256 _postingId) {
        require(postedJobs[_postingId].freelancer != msg.sender, "Freelancer cannot create a job for their own posting");
        _;
    }

    modifier onlyClient(uint256 _postingId, uint256 _jobId) {
        require(postedJobs[_postingId].jobs[_jobId].client == msg.sender, "Only client can call this");
        _;
    }

    modifier onlyJobParties(uint256 _postingId, uint256 _jobId) {
        require(
            postedJobs[_postingId].jobs[_jobId].freelancer == msg.sender || postedJobs[_postingId].jobs[_jobId].client == msg.sender,
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
     * @param _title of the Job Posting
     * @param _description of the Job
     * @param _bannerImageUrl URL to the job's banner image
     * @param _basePayment Average payment for the job in wei
     * @param _minimumNoticeTime Minimum notice time in hours
     * @param _estimatedDurationHours Estimated time to complete job in hours
     * @param _category Job category (e.g., "3D Modeling", "Web Development")
     */
    function createJobPosting(
        string memory _title,
        string memory _description,
        string memory _bannerImageUrl,
        uint256 _basePayment,
        uint256 _estimatedDurationHours,
        uint256 _minimumNoticeTime,
        string memory _category
    ) external  returns (uint256) {
        require(_basePayment > 0, "Payment must be greater than 0");
        require(_estimatedDurationHours > 0, "Duration must be greater than 0");
        require(_minimumNoticeTime > 0, "Minimum notice time must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");

        uint256 postingId = postedJobsCounter++;

        // Create JobPosting with all required fields including empty jobs array
        JobPosting storage newPosting = postedJobs[postingId];
        newPosting.postingId = postingId;
        newPosting.freelancer = msg.sender;
        newPosting.basePayment = _basePayment;
        newPosting.title = _title;
        newPosting.description = _description;
        newPosting.category = _category;
        newPosting.bannerImageUrl = _bannerImageUrl;
        newPosting.minimumNoticeTime = _minimumNoticeTime;
        newPosting.averageWorkDuration = _estimatedDurationHours;
        newPosting.createdAt = block.timestamp;
        // jobs array is automatically initialized as empty

        emit JobPostingCreated(
            postingId,
            msg.sender,
            _basePayment,
            _title,
            _description,
            _category,
            _bannerImageUrl,
            _minimumNoticeTime,
            _estimatedDurationHours
        );

        return postingId;
    }

    /**
     * @dev Create a new job under an existing job posting (Client creates job)
     * @param _postingId The ID of the job posting to create a job under
     * @param _payment The payment amount for the job in wei
     * @param _description The job description
     * @param _durationInHours Estimated time to complete job in hours
     */
     function createJob(
        uint256 _postingId,
        uint256 _payment,
        string memory _title,
        string memory _description,
        uint256 _durationInHours
     ) external payable postingExists(_postingId) notFreelancer(_postingId) {
        JobPosting storage posting = postedJobs[_postingId];

        require(msg.value == _payment, "Must send exact payment amount");
        require(_payment > 0, "Payment must be greater than 0");
        require(_durationInHours > 0, "Duration must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        // Create new job
        uint256 jobId = posting.jobs.length;
        Job memory newJob = Job({
            jobId: jobId,
            client: msg.sender,
            freelancer: posting.freelancer,
            payment: _payment,
            title: _title,
            description: _description,
            category: posting.category,
            durationInHours: _durationInHours,
            deadline: 0, // Deadline will be set when job is accepted, while waiting for approval no progress is made
            state: JobState.WaitingForApproval,
            createdAt: block.timestamp,
            acceptedAt: 0,
            clientReceived: false,
            freelancerDelivered: false
        });

        // Add job to the posting
        posting.jobs.push(newJob);

        emit JobCreated(
            _postingId,
            jobId,
            posting.freelancer,
            msg.sender,
            _payment,
            posting.title,
            _description,
            posting.category,
            posting.bannerImageUrl,
            _durationInHours
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

        emit JobAccepted(
            _postingId,
            _jobId,
            job.client,
            job.deadline
        );
    }

    /**
     * @dev Confirm job completion (both parties must confirm in order to complete the job)
     * This function allows either the client or freelancer to confirm that the job has been completed.
     * If both parties confirm, the job is marked as finished and payment is released.
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to confirm completion
     */
    function confirmCompletion(uint256 _postingId, uint256 _jobId) external onlyJobParties(_postingId, _jobId) jobExists(_postingId, _jobId) {
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

        // Sends payment to freelancer
        payable(job.freelancer).transfer(job.payment);

        emit JobFinished(
            _postingId,
            _jobId,
            job.freelancer,
            job.client,
            job.payment
        );
    }

    /**
     * @dev Cancel a job
     * @param _postingId The ID of the job posting this job belongs to
     * @param _jobId The job ID to cancel
     */
    function cancelJob(uint256 _postingId, uint256 _jobId) external jobExists(_postingId, _jobId) onlyJobParties(_postingId, _jobId) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];

        if (job.state == JobState.WaitingForApproval) {
            // If job is still waiting for approval, simply remove it
            job.state = JobState.Cancelled;
        } else if (job.state == JobState.Ongoing) {
            // If job is ongoing, set it to cancelled and refund client
            job.state = JobState.Cancelled;

            // Refund payment to client if there was one
            if (job.client != address(0)) {
                payable(job.client).transfer(job.payment);
            }
        } else {
            revert("Job cannot be cancelled in its current state");
        }

        emit JobCancelled(_postingId, _jobId, JobState.Cancelled, block.timestamp);

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

        emit JobCancelled(_postingId, _jobId, JobState.Cancelled, block.timestamp);
    }

    // Optimized view functions to avoid stack too deep errors

    /**
     * @dev Get basic job info
     */
    function getJobBasics(uint256 _postingId, uint256 _jobId) external view jobExists(_postingId, _jobId) returns (
        address freelancer,
        address client,
        uint256 payment,
        JobState state
    ) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];
        return (job.freelancer, job.client, job.payment, job.state);
    }

    /**
     * @dev Get job content
     */
    function getJobContent(uint256 _postingId, uint256 _jobId) external view jobExists(_postingId, _jobId) returns (
        string memory title,
        string memory description,
        string memory category,
        uint256 deadline
    ) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];
        return (job.title, job.description, job.category, job.deadline);
    }

    /**
     * @dev Get job timestamps and confirmations
     */
    function getJobStatus(uint256 _postingId, uint256 _jobId) external view jobExists(_postingId, _jobId) returns (
        uint256 createdAt,
        uint256 acceptedAt,
        bool clientReceived,
        bool freelancerDelivered
    ) {
        Job storage job = postedJobs[_postingId].jobs[_jobId];
        return (job.createdAt, job.acceptedAt, job.clientReceived, job.freelancerDelivered);
    }

    /**
     * @dev Get complete job info (alternative approach using fewer variables)
     */
    function getCompleteJob(uint256 _postingId, uint256 _jobId) external view jobExists(_postingId, _jobId) returns (Job memory) {
        return postedJobs[_postingId].jobs[_jobId];
    }

    /**
     * @dev Helper function to convert hours to human readable format
     * @param _hours Number of hours
     */
    function formatDuration(uint256 _hours) external pure returns (string memory) {
        if (_hours < 24) {
            return string(abi.encodePacked(_uint2str(_hours), " hours"));
        } else {
            uint256 remainingDays = _hours / 24;
            uint256 remainingHours = _hours % 24;
            if (remainingHours == 0) {
                return string(abi.encodePacked(_uint2str(remainingDays), " days"));
            } else {
                return string(abi.encodePacked(_uint2str(remainingDays), " days, ", _uint2str(remainingHours), " hours"));
            }
        }
    }

    /**
     * @dev Helper function to convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
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
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function getTotalJobsPosted() external view returns (uint256) {
        return postedJobsCounter;
    }

    // Function to receive Ether
    receive() external payable {
        revert("Direct payments not accepted");
    }
}