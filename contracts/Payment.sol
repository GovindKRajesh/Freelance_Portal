// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Job.sol";

contract PaymentManagement {
    IERC20 public stablecoin;
    JobManagement public jobManagement;

    struct Milestone {
        uint256 jobId;
        uint256 amount;
        string description;
        bool isReleased;
    }

    // Mapping from milestoneId to Milestone
    mapping(uint256 => Milestone) public milestones;

    // Mapping from jobId to milestoneId
    mapping(uint256 => uint256[]) public jobToMilestone;

    uint256 public nextMilestoneId; // To keep track of the next available milestoneId

    event MilestoneCreated(uint256 indexed milestoneId, uint256 jobId, uint256 amount, string description);
    event MilestoneReleased(uint256 indexed milestoneId, uint256 jobId, uint256 amount);

    /**
     * @dev Constructor to initialize the PaymentManagement contract.
     * @param _stablecoin Address of the stablecoin (e.g. USDC).
     * @param _jobManagement Address of the JobManagement contract.
     */
    constructor(address _stablecoin, address _jobManagement) {
        stablecoin = IERC20(_stablecoin);
        jobManagement = JobManagement(_jobManagement);
        nextMilestoneId = 0;
    }

    /**
     * @dev Create a new milestone for a specific job.
     * @param jobId ID of the job related to the milestone.
     * @param amount Amount of stablecoin for the milestone.
     * @param description Description of the milestone.
     */
    function createMilestone(uint256 jobId, uint256 amount, string memory description) public {
        JobManagement.Job memory job = jobManagement.viewJob(jobId);
        require(job.isOpen, "Job is not open");
        require(msg.sender == job.clientAddress, "Only the client can create a milestone");
        require(amount > 0, "Milestone amount must be greater than zero");
        
        require(stablecoin.balanceOf(msg.sender) >= amount, "Insufficient Balance");
        require(stablecoin.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Create the milestone
        milestones[nextMilestoneId] = Milestone(jobId, amount, description, false);
        
        // Map jobId to milestoneId
        jobToMilestone[jobId].push(nextMilestoneId);

        emit MilestoneCreated(nextMilestoneId, jobId, amount, description);

        // Increment nextMilestoneId for the next created milestone
        nextMilestoneId++;
    }

    /**
     * @dev Release a specific milestone, transferring funds from this contract to the freelancer.
     * @param milestoneId ID of the milestone to release.
     * @param freelancerAddress Address to send the released funds.
     */
    function releaseMilestone(uint256 milestoneId, address freelancerAddress) public {
        require(!milestones[milestoneId].isReleased, "Milestone already released");

        uint256 jobId = milestones[milestoneId].jobId;
        JobManagement.Job memory job = jobManagement.viewJob(jobId);
        require(job.isOpen, "Job is not open");
        require(msg.sender == job.clientAddress, "Only the client can release a milestone");

        milestones[milestoneId].isReleased = true;

        uint256 amount = milestones[milestoneId].amount;
        require(stablecoin.transfer(freelancerAddress, amount), "Transfer failed");

        emit MilestoneReleased(milestoneId, milestones[milestoneId].jobId, amount);
    }

    /**
     * @dev Retrieve the milestones for a specific job.
     * @param jobId The ID of the job for which to retrieve milestones.
     * @return result An array of Milestone structs representing the milestones for the given job.
     */
    function getMilestones(uint256 jobId) public view returns (Milestone[] memory) {
        // Assuming you have an array or list of milestoneIds for the given jobId
        uint256[] memory milestoneIds = jobToMilestone[jobId];

        // Create an array to hold the milestones
        Milestone[] memory result = new Milestone[](milestoneIds.length);

        // Iterate through the milestoneIds and fetch each corresponding milestone
        for (uint256 i = 0; i < milestoneIds.length; i++) {
            result[i] = milestones[milestoneIds[i]];
        }

        return result;
    }
}