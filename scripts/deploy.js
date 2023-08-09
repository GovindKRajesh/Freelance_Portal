const hre = require("hardhat");

async function main() {
  // Compile the contract
  await hre.run("compile");

  // Deploy UserManagement contract
  const userManagement = await hre.ethers.deployContract("UserManagement", []);
  await userManagement.waitForDeployment();

  console.log("UserManagement deployed to:", userManagement.target);

  // Deploy JobManagement contract
  const jobManagement = await hre.ethers.deployContract("JobManagement", [userManagement.target]);
  await jobManagement.waitForDeployment();

  console.log("JobManagement deployed to:", jobManagement.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});