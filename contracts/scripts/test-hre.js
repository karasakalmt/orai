import hre from "hardhat";

console.log("HRE keys:", Object.keys(hre));
console.log("HRE.ethers:", hre.ethers);
console.log("HRE.network:", hre.network);

// Try to get ethers directly
import("@nomicfoundation/hardhat-ethers").then(module => {
  console.log("hardhat-ethers module:", module);
});