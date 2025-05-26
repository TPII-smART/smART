//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title JobsContract
 * @dev A simplified escrow contract for freelance work
 * @author Juan Manuel Pascual Osorio
 */
contract JobsContract {

    // Enums for job states
    enum JobState { Available, Ongoing, Finished, Cancelled }

    // Struct for job details
    struct Job {
        uint256 jobId;
        address client;
        address freelancer;
        uint256 payment;
        string title;
        string description;
        uint256 estimatedDuration; // Duration in seconds (hours/days)
        uint256 deadline; // Actual deadline set when job is accepted
        JobState state;
        uint256 createdAt;
        uint256 acceptedAt; // When the job was accepted
        bool clientConfirmed;
        bool freelancerConfirmed;
    }

    // State variables
    mapping(uint256 => Job) public jobs;
    uint256 public jobCounter;
    uint256 public platformFee = 250; // 2.5% in basis points (100 basis points = 1%)
    address public owner;

    // Events for Ponder database indexing
    event JobCreated(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 payment,
        string title,
        string description,
        uint256 estimatedDuration,
        uint256 createdAt
    );

    event JobAccepted(
        uint256 indexed jobId,
        address indexed client,
        uint256 deadline,
        uint256 acceptedAt
    );

    event JobCompleted(
        uint256 indexed jobId,
        address indexed freelancer,
        address indexed client,
        uint256 payment,
        uint256 timestamp
    );

    event JobCancelled(
        uint256 indexed jobId,
        uint256 timestamp
    );

    event ConfirmationReceived(
        uint256 indexed jobId,
        address indexed confirmer,
        bool isClient,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Only freelancer can call this");
        _;
    }

    modifier onlyClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Only client can call this");
        _;
    }

    modifier onlyJobParties(uint256 _jobId) {
        require(
            jobs[_jobId].freelancer == msg.sender || jobs[_jobId].client == msg.sender,
            "Only job parties can call this"
        );
        _;
    }

    modifier jobExists(uint256 _jobId) {
        require(_jobId < jobCounter, "Job does not exist");
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
     * @param _title Job title
     * @param _description Job description
     * @param _payment Required payment amount in wei
     * @param _estimatedDurationHours Estimated time to complete job in hours
     */
    function createJob(
        string memory _title,
        string memory _description,
        uint256 _payment,
        uint256 _estimatedDurationHours
    ) external returns (uint256) {
        require(_payment > 0, "Payment must be greater than 0");
        require(_estimatedDurationHours > 0, "Duration must be greater than 0");
        require(_estimatedDurationHours <= 8760, "Duration cannot exceed 1 year (8760 hours)");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        uint256 jobId = jobCounter++;
        uint256 estimatedDurationSeconds = _estimatedDurationHours * 1 hours;

        jobs[jobId] = Job({
            jobId: jobId,
            client: address(0), // No client assigned yet
            freelancer: msg.sender, // Freelancer creates the job
            payment: _payment,
            title: _title,
            description: _description,
            estimatedDuration: estimatedDurationSeconds,
            deadline: 0, // Will be set when job is accepted
            state: JobState.Available,
            createdAt: block.timestamp,
            acceptedAt: 0,
            clientConfirmed: false,
            freelancerConfirmed: false
        });

        emit JobCreated(
            jobId,
            msg.sender, // freelancer
            _payment,
            _title,
            _description,
            estimatedDurationSeconds,
            block.timestamp
        );

        return jobId;
    }

    /**
     * @dev Accept an available job and set deadline (Client accepts freelancer's job offer)
     * @param _jobId The job ID to accept
     */
    function acceptJob(uint256 _jobId) external payable jobExists(_jobId) {
        Job storage job = jobs[_jobId];

        require(job.state == JobState.Available, "Job is not available");
        require(job.freelancer != msg.sender, "Freelancer cannot accept their own job");
        require(msg.value == job.payment, "Must send exact payment amount");

        // Set client and calculate deadline
        job.client = msg.sender;
        job.acceptedAt = block.timestamp;
        job.deadline = block.timestamp + job.estimatedDuration;
        job.state = JobState.Ongoing;

        emit JobAccepted(_jobId, msg.sender, job.deadline, block.timestamp);
    }

    /**
     * @dev Confirm job completion (both parties must confirm)
     * @param _jobId The job ID to confirm completion
     */
    function confirmCompletion(uint256 _jobId) external onlyJobParties(_jobId) jobExists(_jobId) {
        Job storage job = jobs[_jobId];

        require(job.state == JobState.Ongoing, "Job is not ongoing");
        require(job.client != address(0), "Job has no assigned client");

        // Set confirmation based on who is calling
        if (msg.sender == job.client) {
            require(!job.clientConfirmed, "Client already confirmed");
            job.clientConfirmed = true;
            emit ConfirmationReceived(_jobId, msg.sender, true, block.timestamp);
        } else {
            require(!job.freelancerConfirmed, "Freelancer already confirmed");
            job.freelancerConfirmed = true;
            emit ConfirmationReceived(_jobId, msg.sender, false, block.timestamp);
        }

        // If both parties have confirmed, complete the job
        if (job.clientConfirmed && job.freelancerConfirmed) {
            _completeJob(_jobId);
        }
    }

    /**
     * @dev Internal function to complete job and release payment
     * @param _jobId The job ID to complete
     */
    function _completeJob(uint256 _jobId) internal {
        Job storage job = jobs[_jobId];
        job.state = JobState.Finished;

        // Calculate platform fee and freelancer payment
        uint256 feeAmount = (job.payment * platformFee) / 10000;
        uint256 freelancerPayment = job.payment - feeAmount;

        // Transfer payments
        if (feeAmount > 0) {
            payable(owner).transfer(feeAmount);
        }
        payable(job.freelancer).transfer(freelancerPayment);

        emit JobCompleted(
            _jobId,
            job.freelancer,
            job.client,
            freelancerPayment,
            block.timestamp
        );
    }

    /**
     * @dev Cancel a job
     * @param _jobId The job ID to cancel
     */
    function cancelJob(uint256 _jobId) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];

        // Available jobs can only be cancelled by the freelancer who created them
        if (job.state == JobState.Available) {
            require(msg.sender == job.freelancer, "Only freelancer can cancel available job");
        }
            // For ongoing jobs, either party can cancel
        else if (job.state == JobState.Ongoing) {
            require(
                msg.sender == job.freelancer || msg.sender == job.client,
                "Only job parties can cancel ongoing job"
            );
            // Refund payment to client if job was ongoing
            payable(job.client).transfer(job.payment);
        } else {
            revert("Cannot cancel job in current state");
        }

        job.state = JobState.Cancelled;
        emit JobCancelled(_jobId, block.timestamp);
    }

    /**
     * @dev Emergency cancel by owner (with refund)
     * @param _jobId The job ID to emergency cancel
     */
    function emergencyCancel(uint256 _jobId) external onlyOwner jobExists(_jobId) {
        Job storage job = jobs[_jobId];

        require(
            job.state == JobState.Available || job.state == JobState.Ongoing,
            "Cannot cancel finished job"
        );

        job.state = JobState.Cancelled;

        // Refund payment to client if there was one
        if (job.client != address(0)) {
            payable(job.client).transfer(job.payment);
        }

        emit JobCancelled(_jobId, block.timestamp);
    }

    // Optimized view functions to avoid stack too deep errors

    /**
     * @dev Get basic job info
     */
    function getJobBasics(uint256 _jobId) external view jobExists(_jobId) returns (
        address freelancer,
        address client,
        uint256 payment,
        JobState state
    ) {
        Job storage job = jobs[_jobId];
        return (job.freelancer, job.client, job.payment, job.state);
    }

    /**
     * @dev Get job content
     */
    function getJobContent(uint256 _jobId) external view jobExists(_jobId) returns (
        string memory title,
        string memory description,
        uint256 estimatedDuration,
        uint256 deadline
    ) {
        Job storage job = jobs[_jobId];
        return (job.title, job.description, job.estimatedDuration, job.deadline);
    }

    /**
     * @dev Get job timestamps and confirmations
     */
    function getJobStatus(uint256 _jobId) external view jobExists(_jobId) returns (
        uint256 createdAt,
        uint256 acceptedAt,
        bool clientConfirmed,
        bool freelancerConfirmed
    ) {
        Job storage job = jobs[_jobId];
        return (job.createdAt, job.acceptedAt, job.clientConfirmed, job.freelancerConfirmed);
    }

    /**
     * @dev Get complete job info (alternative approach using fewer variables)
     */
    function getCompleteJob(uint256 _jobId) external view jobExists(_jobId) returns (Job memory) {
        return jobs[_jobId];
    }

    /**
     * @dev Get jobs by state (for frontend filtering)
     * @param _state The job state to filter by
     * @param _limit Maximum number of jobs to return
     * @param _offset Starting index for pagination
     */
    function getJobsByState(JobState _state, uint256 _limit, uint256 _offset)
    external
    view
    returns (uint256[] memory)
    {
        // First pass: count matching jobs
        uint256 matchCount = 0;
        for (uint256 i = 0; i < jobCounter; i++) {
            if (jobs[i].state == _state) {
                matchCount++;
            }
        }

        // Handle pagination bounds
        if (_offset >= matchCount) {
            return new uint256[](0);
        }

        uint256 endIndex = _offset + _limit;
        if (endIndex > matchCount) {
            endIndex = matchCount;
        }

        uint256 resultLength = endIndex - _offset;
        uint256[] memory result = new uint256[](resultLength);

        // Second pass: collect the paginated results
        uint256 currentMatch = 0;
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < jobCounter && resultIndex < resultLength; i++) {
            if (jobs[i].state == _state) {
                if (currentMatch >= _offset) {
                    result[resultIndex] = i;
                    resultIndex++;
                }
                currentMatch++;
            }
        }

        return result;
    }

    /**
     * @dev Get jobs by user (freelancer or client)
     * @param _user The user address
     * @param _asFreelancer True to get jobs where user is freelancer, false for client
     */
    function getUserJobs(address _user, bool _asFreelancer)
    external
    view
    returns (uint256[] memory)
    {
        // Count matching jobs first
        uint256 count = 0;
        for (uint256 i = 0; i < jobCounter; i++) {
            if (_asFreelancer && jobs[i].freelancer == _user) {
                count++;
            } else if (!_asFreelancer && jobs[i].client == _user) {
                count++;
            }
        }

        // Create result array and populate
        uint256[] memory result = new uint256[](count);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < jobCounter && resultIndex < count; i++) {
            if (_asFreelancer && jobs[i].freelancer == _user) {
                result[resultIndex] = i;
                resultIndex++;
            } else if (!_asFreelancer && jobs[i].client == _user) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }

        return result;
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

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Platform fee cannot exceed 10%");
        platformFee = _newFee;
    }

    function getTotalJobs() external view returns (uint256) {
        return jobCounter;
    }

    // Function to receive Ether
    receive() external payable {
        revert("Direct payments not accepted");
    }
}