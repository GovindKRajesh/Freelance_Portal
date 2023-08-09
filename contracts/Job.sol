// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./User.sol";

contract JobManagement {
    
    struct Job {
        uint256 jobId;
        address clientAddress;
        string title;
        string description;
        uint256 payment; // Payment in USD
        string experienceLevel; // "Junior", "Mid", "Senior", etc.
        bool isOpen;
    }

    // Mapping to hold job postings by ID
    mapping(uint256 => Job) public jobs;

    // Mapping to hold job applications by job ID
    mapping(uint256 => address[]) public jobApplications;

    // Counter for job IDs
    uint256 public jobCounter = 0;

    // Reference to UserManagement contract
    UserManagement userManagement;

    // Events
    event JobCreated(uint256 jobId, string title);
    event JobEdited(uint256 jobId, string title);
    event JobClosed(uint256 indexed jobId);
    event JobDeleted(uint256 jobId);
    event JobApplied(uint256 jobId, address freelancerAddress);
    
    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
    }

    /**
     * @dev Create a new job posting.
     * @param title Title of the job.
     * @param description Description of the job.
     * @param payment Payment amount for the job.
     * @param experienceLevel Required experience level for the job.
     */
    function createJob(string memory title, string memory description, uint256 payment, string memory experienceLevel) public {
        require(userManagement.isUserRegistered(msg.sender), "User is not registered.");
        require(!userManagement.isUserFreelancer(msg.sender), "Freelancers cannot create jobs.");

        jobs[jobCounter] = Job(jobCounter, msg.sender, title, description, payment, experienceLevel, true);

        emit JobCreated(jobCounter, title);
        jobCounter++;
    }

    /**
     * @dev Edit the details of an existing job posting.
     * @param jobId ID of the job to be edited.
     * @param title New title of the job.
     * @param description New description of the job.
     * @param payment New payment amount for the job.
     * @param experienceLevel New required experience level for the job.
     */
    function editJob(uint256 jobId, string memory title, string memory description, uint256 payment, string memory experienceLevel) public {
        require(jobs[jobId].clientAddress == msg.sender, "Only the client can edit the job.");
        require(jobs[jobId].isOpen, "Job must be open to edit.");

        jobs[jobId].title = title;
        jobs[jobId].description = description;
        jobs[jobId].payment = payment;
        jobs[jobId].experienceLevel = experienceLevel;

        emit JobEdited(jobId, title);
    }

     /**
     * @dev Close an open job posting.
     * @param jobId ID of the job to be closed.
     */
    function closeJob(uint256 jobId) public {
        require(jobs[jobId].clientAddress == msg.sender, "Only the client can close the job.");
        require(jobs[jobId].isOpen, "Job is already closed.");

        jobs[jobId].isOpen = false;

        emit JobClosed(jobId);
    }

     /**
     * @dev Apply to an open job posting as a freelancer.
     * @param jobId ID of the job to apply to.
     */
    function applyToJob(uint256 jobId) public {
        require(userManagement.isUserFreelancer(msg.sender), "Only freelancers can apply.");
        require(jobs[jobId].isOpen, "Job is not open for applications.");

        jobApplications[jobId].push(msg.sender);

        emit JobApplied(jobId, msg.sender);
    }

     /**
     * @dev View the details of a specific job posting by ID.
     * @param jobId ID of the job to view.
     * @return Job details as a Job struct.
     */
    function viewJob(uint256 jobId) public view returns (Job memory) {
        return jobs[jobId];
    }
}