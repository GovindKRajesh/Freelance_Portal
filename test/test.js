const hre = require("hardhat");
const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");

describe("UserManagement", function () {
    async function deployFixture() {

        // Deploying Users.sol
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

describe("JobManagement", function () {
    async function deployFixture() {
        // Deploying UserManagement.sol
        const userContract = await hre.ethers.deployContract("UserManagement", []);
        await userContract.waitForDeployment();
        const user = userContract.getAddress();

        // Deploying JobManagement.sol
        const jobContract = await hre.ethers.deployContract("JobManagement", [user]);
        await jobContract.waitForDeployment();

        return { userContract, jobContract };
    }

    describe("Create Job", function() {

        it("Should create a new job and emit the appropriate event", async function () {
            const { userContract, jobContract } = await loadFixture(deployFixture);
            const [signer] = await hre.ethers.getSigners();

            // Assuming a user is registered
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
        
            // Assuming the job is closed (you would typically have a method to close the job in your contract)
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