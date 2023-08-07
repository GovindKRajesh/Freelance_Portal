const hre = require("hardhat");

async function main() {
  // Compile the contract
  await hre.run("compile");

  // Deploy the contract
  const userManagement = await hre.ethers.deployContract("UserManagement");
  await userManagement.waitForDeployment();

  console.log("UserManagement deployed to:", userManagement.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});