const hre = require("hardhat");

async function main() {
  // Compile the contract
  await hre.run("compile");

  // Deploy User contract
  const user = await hre.ethers.deployContract("UserManagement", []);
  await user.waitForDeployment();

  console.log("UserManagement deployed to:", user.target);

  // Deploy Job contract
  const job = await hre.ethers.deployContract("JobManagement", [user.target]);
  await job.waitForDeployment();

  console.log("Job deployed to:", job.target);

  const USDC_ADDRESS = "0x7cd1840a123f2190424058Ba766F816Ad079e9A6"; // Dummy USDC token address

  // Deploy PaymentManagement contract
  const payment = await hre.ethers.deployContract("PaymentManagement", [USDC_ADDRESS, job.target]);
  await payment.waitForDeployment();

  console.log("Payment deployed to:", payment.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});