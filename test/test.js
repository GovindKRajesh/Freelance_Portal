const hre = require("hardhat");
const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");

describe("RewardProxy", function () {
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