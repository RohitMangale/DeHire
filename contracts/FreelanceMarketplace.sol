// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FreelanceMarketplace {

    struct Job {
        address jobPoster;
        string title;
        string shortDescription;
        string detailedDescription;
        uint256 budget;
        uint256 deadline;
        string image;
        string workUrl;
        bool isCompleted;
        bool isApproved;
        address[] applicants;
        uint256[] applicationIndexes;
    }

    struct Application {
        address applicant;
        string name;
        string previousWorkLink;
        string projectLink;
        bool isReviewed;
        bool isAccepted;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application[]) public jobApplications;
    
    uint256 public numberOfJobs = 0;

    // Function to post a job with a minimum budget of 0.001 ETH
    function postJob(
        string memory _title,
        string memory _shortDescription,
        string memory _detailedDescription,
        uint256 _budget,
        uint256 _deadline,
        string memory _image,
        string memory _workUrl
    ) public payable returns (uint256) {
        // Ensure the budget is at least 0.001 ETH (1 * 10^15 wei)
        require(_budget >= 0.001 ether, "Budget must be at least 0.001 ETH");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        Job storage newJob = jobs[numberOfJobs];
        newJob.jobPoster = msg.sender;
        newJob.title = _title;
        newJob.shortDescription = _shortDescription;
        newJob.detailedDescription = _detailedDescription;
        newJob.budget = _budget;
        newJob.deadline = _deadline;
        newJob.image = _image;
        newJob.workUrl = _workUrl;
        newJob.isCompleted = false;
        newJob.isApproved = false;

        numberOfJobs++;
        return numberOfJobs - 1;
    }

    // Function to apply for a job
    function applyForJob(
        uint256 _jobId,
        string memory _name,
        string memory _previousWorkLink,
        string memory _projectLink
    ) public {
        require(_jobId < numberOfJobs, "Invalid job ID");

        Application memory application = Application({
            applicant: msg.sender,
            name: _name,
            previousWorkLink: _previousWorkLink,
            projectLink: _projectLink,
            isReviewed: false,
            isAccepted: false
        });

        jobApplications[_jobId].push(application);
        jobs[_jobId].applicants.push(msg.sender);
        jobs[_jobId].applicationIndexes.push(jobApplications[_jobId].length - 1);
    }

    // Function to review an applicant's work
    function reviewWork(
        uint256 _jobId,
        uint256 _applicationIndex,
        bool _isAccepted,
        string memory _workUrl
    ) public {
        require(_jobId < numberOfJobs, "Invalid job ID");
        require(_applicationIndex < jobApplications[_jobId].length, "Invalid application index");
        require(jobs[_jobId].jobPoster == msg.sender, "Only job poster can review");

        Application storage application = jobApplications[_jobId][_applicationIndex];
        require(!application.isReviewed, "Application already reviewed");

        if (_isAccepted) {
            jobs[_jobId].workUrl = _workUrl;
            jobs[_jobId].isCompleted = true;
            jobs[_jobId].isApproved = true;
            application.isAccepted = true;

            // Transfer payment to freelancer (assuming budget is available)
            (bool sent, ) = payable(application.applicant).call{value: jobs[_jobId].budget}("");
            require(sent, "Payment failed");
        }

        application.isReviewed = true;
    }

    // Function to get all jobs
    function getJobs() public view returns (Job[] memory) {
        Job[] memory allJobs = new Job[](numberOfJobs);
        for (uint256 i = 0; i < numberOfJobs; i++) {
            allJobs[i] = jobs[i];
        }
        return allJobs;
    }

    // Function to get applications for a specific job
    function getApplications(uint256 _jobId) public view returns (Application[] memory) {
        return jobApplications[_jobId];
    }

    // Function to get all jobs posted by a specific user (job poster)
    function getJobsByPoster(address _jobPoster) public view returns (Job[] memory) {
        uint256 jobCount = 0;
        for (uint256 i = 0; i < numberOfJobs; i++) {
            if (jobs[i].jobPoster == _jobPoster) {
                jobCount++;
            }
        }

        Job[] memory userJobs = new Job[](jobCount);
        uint256 index = 0;
        for (uint256 i = 0; i < numberOfJobs; i++) {
            if (jobs[i].jobPoster == _jobPoster) {
                userJobs[index] = jobs[i];
                index++;
            }
        }

        return userJobs;
    }

    // Function to get all jobs a freelancer has applied to
    function getAppliedJobs(address _applicant) public view returns (Job[] memory) {
        uint256 appliedJobCount = 0;
        for (uint256 i = 0; i < numberOfJobs; i++) {
            for (uint256 j = 0; j < jobApplications[i].length; j++) {
                if (jobApplications[i][j].applicant == _applicant) {
                    appliedJobCount++;
                }
            }
        }

        Job[] memory appliedJobs = new Job[](appliedJobCount);
        uint256 index = 0;
        for (uint256 i = 0; i < numberOfJobs; i++) {
            for (uint256 j = 0; j < jobApplications[i].length; j++) {
                if (jobApplications[i][j].applicant == _applicant) {
                    appliedJobs[index] = jobs[i];
                    index++;
                }
            }
        }

        return appliedJobs;
    }

    // Extended helper: get applied jobs along with review/accept status and job IDs for the given applicant
    function getAppliedJobsWithStatus(address _applicant)
        public
        view
        returns (Job[] memory, bool[] memory, bool[] memory, uint256[] memory)
    {
        uint256 appliedJobCount = 0;
        for (uint256 i = 0; i < numberOfJobs; i++) {
            for (uint256 j = 0; j < jobApplications[i].length; j++) {
                if (jobApplications[i][j].applicant == _applicant) {
                    appliedJobCount++;
                }
            }
        }

        Job[] memory appliedJobs = new Job[](appliedJobCount);
        bool[] memory reviewed = new bool[](appliedJobCount);
        bool[] memory accepted = new bool[](appliedJobCount);
        uint256[] memory jobIds = new uint256[](appliedJobCount);

        uint256 index = 0;
        for (uint256 i = 0; i < numberOfJobs; i++) {
            for (uint256 j = 0; j < jobApplications[i].length; j++) {
                if (jobApplications[i][j].applicant == _applicant) {
                    appliedJobs[index] = jobs[i];
                    reviewed[index] = jobApplications[i][j].isReviewed;
                    accepted[index] = jobApplications[i][j].isAccepted;
                    jobIds[index] = i;
                    index++;
                }
            }
        }

        return (appliedJobs, reviewed, accepted, jobIds);
    }

    function getJobBudget(uint256 jobId) public view returns (uint256) {
    return jobs[jobId].budget;  // Assuming 'jobs' is a mapping containing the job details
    }

    function sendPaymentToApplicant(uint256 _jobId, uint256 _applicationIndex) public payable {
        require(_jobId < numberOfJobs, "Invalid job ID");
        require(_applicationIndex < jobApplications[_jobId].length, "Invalid application index");

        Job storage job = jobs[_jobId];
        Application storage application = jobApplications[_jobId][_applicationIndex];

        require(job.jobPoster == msg.sender, "Only job poster can send payment");
        require(application.isAccepted, "Application is not accepted");

        uint256 amount = job.budget;
        require(amount > 0, "Invalid payment amount");

        // Transfer the payment to the freelancer's address
        (bool sent, ) = payable(application.applicant).call{value: amount}("");
        require(sent, "Payment failed");
    }

    // Function to edit a job (only by job poster, and only if not completed/approved)
    function editJob(
        uint256 _jobId,
        string memory _title,
        string memory _shortDescription,
        string memory _detailedDescription,
        uint256 _budget,
        uint256 _deadline,
        string memory _image,
        string memory _workUrl
    ) public {
        require(_jobId < numberOfJobs, "Invalid job ID");
        Job storage job = jobs[_jobId];
        
        // Only job poster can edit
        require(job.jobPoster == msg.sender, "Only job poster can edit this job");
        
        // Cannot edit if job is completed or approved
        require(!job.isCompleted && !job.isApproved, "Cannot edit completed or approved jobs");
        
        // Validate budget is at least 0.001 ETH
        require(_budget >= 0.001 ether, "Budget must be at least 0.001 ETH");
        
        // Validate deadline is in the future
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        // Update job details
        job.title = _title;
        job.shortDescription = _shortDescription;
        job.detailedDescription = _detailedDescription;
        job.budget = _budget;
        job.deadline = _deadline;
        job.image = _image;
        job.workUrl = _workUrl;
    }

    // Function to allow the contract to receive Ether
    receive() external payable {}
}
