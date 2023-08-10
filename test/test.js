const hre = require("hardhat");
const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");

describe("User", function () {
    async function deployFixture() {

        // Deploying User.sol
        const user = await hre.ethers.deployContract("UserManagement", []);
        await user.waitForDeployment();

        return { user };
    }

    describe("Register", function() {

        it("Should accept a registration and emit the appropriate event", async function () {
            const { user } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();

            const name = "TestName";
            const contact = "123 A Block B Street";
            const isCont = true;
            const sender = signer.address;

            // Updating the token address to the test token.
            await expect(user.connect(signer).registerUser(name, contact, isCont))
                .to.emit(user, "UserRegistered")
                .withArgs(sender, name, isCont);
        });

        it("Should not allow a user to register twice", async function () {
            const { user } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
          
            const name = "TestName";
            const contact = "123 A Block B Street";
            const isCont = true;
          
            // First registration should succeed
            await user.connect(signer).registerUser(name, contact, isCont);
          
            // Second registration should fail
            await expect(user.connect(signer).registerUser(name, contact, isCont))
                .to.be.revertedWith("User is already registered.");
          });
    });

    describe("Fetch User", function() {

        it("Should return the details of a registered user", async function () {
            const { user } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            const name = "TestName";
            const contact = "123 A Block B Street";
            const isCont = true;
        
            // Register a user
            await user.connect(signer).registerUser(name, contact, isCont);
        
            // Retrieve and verify user details
            const userDetails = await user.connect(signer).getUser(signer.address);
            expect(userDetails[1]).to.equal(name);
            expect(userDetails[2]).to.equal(contact);
            expect(userDetails[3]).to.equal(isCont);
        });

        it("Should revert when trying to get details of a non-registered user", async function () {
            const { user } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            // Try to retrieve details without registering the user
            await expect(user.connect(signer).getUser(signer.address)).to.be.revertedWith("User is not registered.");
        });
    });
});

describe("Job", function () {
    async function deployFixture() {

        // Deploying User.sol
        const userContract = await hre.ethers.deployContract("UserManagement", []);
        await userContract.waitForDeployment();
        const user = userContract.getAddress();

        // Deploying Job.sol
        const jobContract = await hre.ethers.deployContract("JobManagement", [user]);
        await jobContract.waitForDeployment();

        return { userContract, jobContract };
    }

    describe("Create Job", function() {

        it("Should create a new job and emit the appropriate event", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();

            // Registering the user as a client
            await userContract.registerUser("TestName", "123 A Block B Street", false);
            
            // Defining the parameters for the new job
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";

            // Creating the job and checking for the event
            await expect(jobContract.connect(signer).createJob(title, description, payment, experienceLevel))
                .to.emit(jobContract, "JobCreated")
                .withArgs(0, title);
        });

        it("Should revert if a freelancer tries to create a job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            // Registering a user as a freelancer
            await userContract.registerUser("TestName", "123 A Block B Street", true);
        
            // Attempting to create a job
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
        
            await expect(jobContract.connect(signer).createJob(title, description, payment, experienceLevel))
                .to.be.revertedWith("Freelancers cannot create jobs.");
        });

        it("Should revert if an unregistered user tries to create a job", async function () {
            const { jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            // Parameters for the new job
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
        
            await expect(jobContract.connect(signer).createJob(title, description, payment, experienceLevel))
                .to.be.revertedWith("User is not registered.");
        });
        
        it("Should increment the job counter after creating multiple jobs", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            // Registering a user
            await userContract.registerUser("TestName", "123 A Block B Street", false);
        
            // Creating three jobs
            for (let i = 0; i < 3; i++) {
                const title = `Software Developer ${i}`;
                const description = "Develop a DApp";
                const payment = 1000;
                const experienceLevel = "Intermediate";
        
                await jobContract.connect(signer).createJob(title, description, payment, experienceLevel);
            }
        
            // Checking the job counter
            expect(await jobContract.jobCounter()).to.equal(3);
        });        
    });

    describe("Edit Job", function() {

        it("Should edit an existing job and emit the appropriate event", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            // Registering a user and creating a job
            await userContract.registerUser("TestName", "123 A Block B Street", false);
            await jobContract.connect(signer).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
        
            // Editing the job
            const newTitle = "Senior Developer";
            const newDescription = "Develop a complex DApp";
            const newPayment = 1500;
            const newExperienceLevel = "Advanced";
        
            await expect(jobContract.connect(signer).editJob(0, newTitle, newDescription, newPayment, newExperienceLevel))
                .to.emit(jobContract, "JobEdited")
                .withArgs(0, newTitle);
        });
        
        it("Should revert if an unauthorized user tries to edit the job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [clientSigner, unauthorizedSigner] = await hre.ethers.getSigners();
        
            // Registering a client and creating a job
            await userContract.registerUser("TestName", "123 A Block B Street", false);
            await jobContract.connect(clientSigner).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
        
            // Attempting to edit the job by an unauthorized user
            await expect(jobContract.connect(unauthorizedSigner).editJob(0, "New Title", "New Description", 2000, "Beginner"))
                .to.be.revertedWith("Only the client can edit the job.");
        });
        
        it("Should revert if trying to edit a closed job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
        
            // Registering a user and creating a job
            await userContract.registerUser("TestName", "123 A Block B Street", false);
            await jobContract.connect(signer).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
        
            // Closing the job
            await jobContract.connect(signer).closeJob(0);
        
            // Attempting to edit the closed job
            await expect(jobContract.connect(signer).editJob(0, "New Title", "New Description", 2000, "Beginner"))
                .to.be.revertedWith("Job must be open to edit.");
        });        
    });

    describe("Close Job", function () {

        it("Should close an open job by the client", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
    
            // Registering a user
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Creating a job
            const jobId = 0;
            await jobContract.connect(signer).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
    
            // Closing the job
            await expect(jobContract.connect(signer).closeJob(jobId))
                .to.emit(jobContract, "JobClosed")
                .withArgs(jobId);
            
            // Fetching the job details to validate it's closed
            const job = await jobContract.viewJob(jobId);
            expect(job.isOpen).to.equal(false);
        });
    
        it("Should revert if a freelancer tries to close a job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer, freelancer] = await hre.ethers.getSigners();
    
            // Registering a user as a client
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Registering a freelancer
            await userContract.connect(freelancer).registerUser("TestFreelancer", "456 C Block D Street", true);
    
            // Creating a job
            const jobId = 0;
            await jobContract.connect(signer).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
    
            // Expecting a revert when freelancer tries to close the job
            await expect(jobContract.connect(freelancer).closeJob(jobId)).to.be.revertedWith("Only the client can close the job.");
        });
    
        it("Should revert if trying to close a job that's already closed", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();
    
            // Registering a user
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Creating a job
            const jobId = 0;
            await jobContract.connect(signer).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
    
            // Closing the job
            await jobContract.connect(signer).closeJob(jobId);
    
            // Expecting a revert when trying to close the job again
            await expect(jobContract.connect(signer).closeJob(jobId)).to.be.revertedWith("Job is already closed.");
        });
    });
    
    describe("Apply to Job", function () {

        it("Should allow a freelancer to apply for an open job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer] = await hre.ethers.getSigners();
    
            // Registering a client
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Registering a freelancer
            await userContract.connect(freelancer).registerUser("TestFreelancer", "456 C Block D Street", true);
    
            // Creating a job by the client
            const jobId = 0;
            await jobContract.connect(client).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
    
            // Applying for the job by the freelancer
            await expect(jobContract.connect(freelancer).applyToJob(jobId))
                .to.emit(jobContract, "JobApplied")
                .withArgs(jobId, freelancer.address);
        });
    
        it("Should revert if a client tries to apply for a job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client] = await hre.ethers.getSigners();
    
            // Registering a client
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Creating a job
            const jobId = 0;
            await jobContract.connect(client).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
    
            // Expecting a revert when client tries to apply for the job
            await expect(jobContract.connect(client).applyToJob(jobId)).to.be.revertedWith("Only freelancers can apply.");
        });
    
        it("Should revert if trying to apply for a job that's not open", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer] = await hre.ethers.getSigners();
    
            // Registering a client
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Registering a freelancer
            await userContract.connect(freelancer).registerUser("TestFreelancer", "456 C Block D Street", true);
    
            // Creating a job
            const jobId = 0;
            await jobContract.connect(client).createJob("Software Developer", "Develop a DApp", 1000, "Intermediate");
    
            // Closing the job
            await jobContract.connect(client).closeJob(jobId);
    
            // Expecting a revert when trying to apply for a closed job
            await expect(jobContract.connect(freelancer).applyToJob(jobId)).to.be.revertedWith("Job is not open for applications.");
        });
    });

    describe("Select freelancer", function () {
        it("Should select a freelancer for an open job and emit the appropriate event", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer] = await hre.ethers.getSigners();
    
            // Registering the client and freelancer
            await userContract.connect(client).registerUser("ClientName", "123 A Block B Street", false);
            await userContract.connect(freelancer).registerUser("FreelancerName", "456 C Block D Street", true);
    
            // Creating a job as the client
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
            await jobContract.connect(client).createJob(title, description, payment, experienceLevel);
    
            // Applying to the job as the freelancer
            const jobId = 0; // assuming this is the correct job ID
            await jobContract.connect(freelancer).applyToJob(jobId);
    
            // Selecting the freelancer for the job
            await expect(jobContract.connect(client).selectFreelancer(jobId, freelancer.address))
                .to.emit(jobContract, "FreelancerSelected")
                .withArgs(jobId, freelancer.address);
        });
    
        it("Should revert when a non-client tries to select a freelancer", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer, otherUser] = await hre.ethers.getSigners();
    
            // Registering the client and freelancer
            await userContract.connect(client).registerUser("ClientName", "123 A Block B Street", false);
            await userContract.connect(freelancer).registerUser("FreelancerName", "456 C Block D Street", true);
    
            // Creating a job as the client
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
            await jobContract.connect(client).createJob(title, description, payment, experienceLevel);
    
            // Applying to the job as the freelancer
            const jobId = 0; // assuming this is the correct job ID
            await jobContract.connect(freelancer).applyToJob(jobId);
    
            // Trying to select the freelancer as a different user should revert
            await expect(jobContract.connect(otherUser).selectFreelancer(jobId, freelancer.address))
                .to.be.revertedWith("Only the client can select the freelancer.");
        });

        it("Should revert when trying to select a freelancer for a closed job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer] = await hre.ethers.getSigners();
        
            // Registering the client and freelancer
            await userContract.connect(client).registerUser("ClientName", "123 A Block B Street", false);
            await userContract.connect(freelancer).registerUser("FreelancerName", "456 C Block D Street", true);
        
            // Creating a job as the client
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
            await jobContract.connect(client).createJob(title, description, payment, experienceLevel);
        
            // Applying to the job as the freelancer
            const jobId = 0; // assuming this is the correct job ID
            await jobContract.connect(freelancer).applyToJob(jobId);
        
            // Closing the job
            await jobContract.connect(client).closeJob(jobId);
        
            // Trying to select the freelancer for a closed job should revert
            await expect(jobContract.connect(client).selectFreelancer(jobId, freelancer.address))
                .to.be.revertedWith("Job must be open to select a freelancer.");
        });

        it("Should revert when trying to select a freelancer who has not applied for the job", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer, otherFreelancer] = await hre.ethers.getSigners();
        
            // Registering the client and freelancers
            await userContract.connect(client).registerUser("ClientName", "123 A Block B Street", false);
            await userContract.connect(freelancer).registerUser("FreelancerName", "456 C Block D Street", true);
            await userContract.connect(otherFreelancer).registerUser("OtherFreelancerName", "789 E Block F Street", true);
        
            // Creating a job as the client
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
            await jobContract.connect(client).createJob(title, description, payment, experienceLevel);
        
            // Applying to the job as the freelancer
            const jobId = 0; // assuming this is the correct job ID
            await jobContract.connect(freelancer).applyToJob(jobId);
        
            // Trying to select a freelancer who has not applied for the job should revert
            await expect(jobContract.connect(client).selectFreelancer(jobId, otherFreelancer.address))
                .to.be.revertedWith("Freelancer must have applied for the job.");
        });

        it("Should select a freelancer for the job and delete all corresponding job applications", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client, freelancer] = await hre.ethers.getSigners();
    
            // Assuming client and freelancer are registered
            await userContract.connect(client).registerUser("ClientName", "123 A Block B Street", false);
            await userContract.connect(freelancer).registerUser("FreelancerName", "456 C Block D Street", true);
    
            // Defining the parameters for the new job
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
    
            // Creating the job
            await jobContract.connect(client).createJob(title, description, payment, experienceLevel);
    
            // Applying to the job as a freelancer
            await jobContract.connect(freelancer).applyToJob(0);
    
            // Selecting the freelancer for the job
            await jobContract.connect(client).selectFreelancer(0, freelancer.address);
    
            // Getting the job details
            const job = await jobContract.viewJob(0);
    
            // Check if the freelancer is selected for the job
            expect(job.freelancerAddress).to.equal(freelancer.address);
    
            // Check if the corresponding job applications have been deleted
            const applications = await jobContract.getJobApplications(0);
            expect(applications.length).to.equal(0);
        });
    });

    describe("View Job", function () {

        it("Should return the details of a specific job by ID", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [client] = await hre.ethers.getSigners();
    
            // Registering a client
            await userContract.registerUser("TestClient", "123 A Block B Street", false);
    
            // Defining the parameters for the new job
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";
    
            // Creating a job by the client
            const jobId = 0;
            await jobContract.connect(client).createJob(title, description, payment, experienceLevel);
    
            // Viewing the job
            const jobDetails = await jobContract.viewJob(jobId);
    
            // Asserting the job details
            expect(jobDetails.clientAddress).to.equal(client.address);
            expect(jobDetails.title).to.equal(title);
            expect(jobDetails.description).to.equal(description);
            expect(jobDetails.payment).to.equal(payment);
            expect(jobDetails.experienceLevel).to.equal(experienceLevel);
            expect(jobDetails.isOpen).to.be.true;
        });
    });
});

describe("Milestones and Payment", function () {
    async function deployFixture() {
        const [deployer] = await ethers.getSigners();

        // Deploying USDC.sol
        const USDC = await hre.ethers.deployContract("USDC", [], deployer);
        await USDC.waitForDeployment();
        const usdc = await USDC.getAddress();
    
        // Deploying User.sol
        const userContract = await hre.ethers.deployContract("UserManagement", []);
        await userContract.waitForDeployment();
        const user = userContract.getAddress();

        // Deploying Job.sol
        const jobContract = await hre.ethers.deployContract("JobManagement", [user]);
        await jobContract.waitForDeployment();
        const job = jobContract.getAddress();
    
        // Deploying Payment.sol
        const paymentContract = await hre.ethers.deployContract("PaymentManagement", [usdc, job]);
        await paymentContract.waitForDeployment();
    
        return { USDC, userContract, jobContract, paymentContract };
    }

    async function basicSetup(amount, pay) {
        const { USDC, userContract, jobContract, paymentContract } = await deployFixture();
        const [deployer, client, freelancer, anotherUser] = await ethers.getSigners();

        const usdcDecimals = await USDC.decimals();
        const transferAmount = BigInt(amount) * BigInt(10) ** usdcDecimals;
        const paymentContAddress = await paymentContract.getAddress();
    
        // Transfer some USDC to the client
        await USDC.connect(deployer).transfer(client.address, transferAmount);
    
        // Client approves PaymentManagement contract to spend USDC
        await USDC.connect(client).approve(paymentContAddress, transferAmount);
    
        // Registering Client and Freelancer wallets
        await userContract.connect(client).registerUser("Client", "123 A Block B Street", false);
        await userContract.connect(freelancer).registerUser("Freelancer", "456 C Block D Street", true);

        const title = "Software Developer";
        const payment = BigInt(pay) * BigInt(10) ** usdcDecimals;
        const description = "Develop a DApp";
        const experienceLevel = "Intermediate";
        await jobContract.connect(client).createJob(title, description, payment, experienceLevel);

        return { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer, anotherUser };
    }

    describe("Create Milestone", function () {
        
        it("Should create a milestone for an open job", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client } = await basicSetup(1000, 1000);
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            await expect(paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription))
                .to.emit(paymentContract, "MilestoneCreated");
        });

        it("Should revert when creating a milestone for a closed job or using non-client", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer } = await basicSetup(1000, 1000);

            // Attempting to create a milestone by a non-client should revert
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            await expect(paymentContract.connect(freelancer).createMilestone(jobId, milestoneAmount, milestoneDescription))
                .to.be.revertedWith("Only the client can create a milestone");

            // Closing Job
            await jobContract.connect(client).closeJob(jobId);

            // Attempting to create a milestone should revert
            await expect(paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription))
                .to.be.revertedWith("Job is not open");
        });
        
        it("Should create multiple milestones for a single job", async function () {            
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client } = await basicSetup(1000, 1000);

            // Create multiple milestones
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, "First Milestone");
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, "Second Milestone");

            // Check that the milestones have been created
            const milestones = await paymentContract.getMilestones(jobId); // Assuming a method to retrieve milestones
            expect(milestones.length).to.equal(2);
        });
        
        it("Should revert when creating a milestone with insufficient funds", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client } = await basicSetup(100, 1000);

            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            const paymentContAddress = await paymentContract.getAddress();

            // Provide approval for the full milestone amount of 500
            await USDC.connect(client).approve(paymentContAddress, milestoneAmount);
        
            // Attempting to create a milestone of value 500 when balance is 100 USDC
            await expect(paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription))
                .to.be.revertedWith("Insufficient Balance");
        });
        
        it("Should revert when creating a milestone with zero amount", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client } = await basicSetup(1000, 1000);
            const jobId = 0;
            const milestoneDescription = "First Milestone";
        
            // Attempting to create a milestone with zero amount
            await expect(paymentContract.connect(client).createMilestone(jobId, 0, milestoneDescription))
                .to.be.revertedWith("Milestone amount must be greater than zero");
        });
    });

    describe("Release Milestone", function () {

        it("Should release a valid milestone", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer } = await basicSetup(1000, 1000);

            // Create a milestone for the job
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription);
        
            // Get the milestoneId for the created milestone
            const milestoneId = 0;

            // Applying to the job as the freelancer
            await jobContract.connect(freelancer).applyToJob(jobId);

            // Selecting the job application
            await jobContract.connect(client).selectFreelancer(jobId, freelancer.address);
        
            // Get the freelancer's initial balance
            const initialBalance = await USDC.balanceOf(freelancer.address);
        
            // Release the milestone
            await expect(paymentContract.connect(client).releaseMilestone(milestoneId))
                .to.emit(paymentContract, "MilestoneReleased");
        
            // Verify that the milestone is marked as released
            const milestone = await paymentContract.milestones(milestoneId);
            expect(milestone.isReleased).to.equal(true);
        
            // Verify that the freelancer's balance has increased by the milestone amount
            const finalBalance = await USDC.balanceOf(freelancer.address);
            expect(finalBalance).to.equal(initialBalance + BigInt(milestoneAmount));
        });
        
        it("Should revert if the milestone has already been released", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer } = await basicSetup(1000, 1000);
            
            // Create a milestone for the job
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription);
        
            // Get the milestoneId for the created milestone
            const milestoneId = 0;

            // Applying to the job as the freelancer
            await jobContract.connect(freelancer).applyToJob(jobId);

            // Selecting the job application
            await jobContract.connect(client).selectFreelancer(jobId, freelancer.address);
        
            // Release the milestone for the first time
            await paymentContract.connect(client).releaseMilestone(milestoneId);
        
            // Verify that the milestone is marked as released
            const milestone = await paymentContract.milestones(milestoneId);
            expect(milestone.isReleased).to.equal(true);
        
            // Attempting to release the milestone again should revert
            await expect(paymentContract.connect(client).releaseMilestone(milestoneId))
                .to.be.revertedWith("Milestone already released");
        });

        it("Should revert if the job associated with the milestone is not open", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer } = await basicSetup(1000, 1000);
            
            // Create a milestone for the job
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription);
        
            // Get the milestoneId for the created milestone
            const milestoneId = 0;

            // Applying to the job as the freelancer
            await jobContract.connect(freelancer).applyToJob(jobId);

            // Selecting the job application
            await jobContract.connect(client).selectFreelancer(jobId, freelancer.address);
        
            // Close the job, assuming you have a method for this in the jobContract
            await jobContract.connect(client).closeJob(jobId);
        
            // Attempting to release the milestone when the job is not open should revert
            await expect(paymentContract.connect(client).releaseMilestone(milestoneId))
                .to.be.revertedWith("Job is not open");
        });
        
        it("Should revert if the caller is not the client of the associated job", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer, anotherUser } = await basicSetup(1000, 1000);
            
            // Create a milestone for the job
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
            const milestoneDescription = "First Milestone";
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, milestoneDescription);
        
            // Get the milestoneId for the created milestone
            const milestoneId = 0;

            // Applying to the job as the freelancer
            await jobContract.connect(freelancer).applyToJob(jobId);

            // Selecting the job application
            await jobContract.connect(client).selectFreelancer(jobId, freelancer.address);
        
            // Attempting to release the milestone by a user who is not the client of the associated job should revert
            await expect(paymentContract.connect(anotherUser).releaseMilestone(milestoneId))
                .to.be.revertedWith("Only the client can release a milestone");
        });        
    });

    describe("Retrieve Milestone", function () {

        it("Should return an empty array if there are no milestones for the given jobId", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer } = await basicSetup(1000, 1000);
            
            // Get the milestones for the job
            const jobId = 0;
            const milestones = await paymentContract.getMilestones(jobId);
        
            // Expect the result to be an empty array
            expect(milestones.length).to.equal(0);
        });
        
        it("Should return all the milestones for the given jobId", async function () {
            const { USDC, userContract, jobContract, paymentContract, usdcDecimals, client, freelancer } = await basicSetup(1000, 1000);
            
            const jobId = 0;
            const milestoneAmount = BigInt(500) * BigInt(10) ** usdcDecimals;
        
            // Create multiple milestones for the job
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, "First Milestone");
            await paymentContract.connect(client).createMilestone(jobId, milestoneAmount, "Second Milestone");
        
            // Get the milestones for the job using the getMilestones method
            const milestones = await paymentContract.getMilestones(jobId);
        
            // Expect the result to contain both milestones
            expect(milestones.length).to.equal(2);
            expect(milestones[0].description).to.equal("First Milestone");
            expect(milestones[1].description).to.equal("Second Milestone");
        });
    });

    describe("Get All Open Jobs", function() {

        it("Should retrieve all open jobs with no freelancer selected", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();

            // Assuming a user is registered
            await userContract.registerUser("TestName", "123 A Block B Street", false);
            
            // Defining the parameters for new jobs
            const title = "Software Developer";
            const description = "Develop a DApp";
            const payment = 1000;
            const experienceLevel = "Intermediate";

            // Creating multiple jobs
            await jobContract.connect(signer).createJob(title, description, payment, experienceLevel);
            await jobContract.connect(signer).createJob(title, description, payment, experienceLevel);

            // Fetching all open jobs
            const openJobs = await jobContract.getAllOpenJobs();

            // Checking if the number of open jobs and their details are correct
            expect(openJobs.length).to.equal(2);
            for (const job of openJobs) {
                expect(job.title).to.equal(title);
                expect(job.description).to.equal(description);
                expect(job.payment).to.equal(payment);
                expect(job.experienceLevel).to.equal(experienceLevel);
                expect(job.isOpen).to.be.true;
                expect(job.freelancerAddress).to.equal("0x0000000000000000000000000000000000000000");
            }
        });
    });
});