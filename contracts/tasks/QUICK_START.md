# Quick Start Guide - Orai Smart Contracts

## Day 1: Project Setup
```bash
# Initialize Hardhat project
cd /Users/metekarasakal/Projects/orai/contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init

# Install dependencies
npm install @openzeppelin/contracts @openzeppelin/contracts-upgradeable
npm install --save-dev @openzeppelin/hardhat-upgrades
```

## Day 2: Configure Environment
Create `.env` file:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://rpc-testnet.0g.ai
ETHERSCAN_API_KEY=your_api_key_here
```

Update `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    "0g-testnet": {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 16600
    }
  }
};
```

## Day 3-5: Implement OraiToken
Create `contracts/OraiToken.sol` with:
- ERC20 base functionality
- Staking mechanism (min 10 ORAI)
- 7-day unstaking period
- Reward calculations

## Day 6-8: Implement VotingContract
Create `contracts/VotingContract.sol` with:
- Voting rounds mapping
- 24-hour voting periods
- 33% quorum requirement
- 66% approval threshold

## Day 9-12: Implement OracleContract
Create `contracts/OracleContract.sol` with:
- Upgradeable proxy pattern
- Question submission
- Answer storage with 0G hashes
- Integration with VotingContract

## Day 13-14: Testing
```bash
# Run tests
npx hardhat test

# Check coverage
npx hardhat coverage

# Gas reporter
REPORT_GAS=true npx hardhat test
```

## Day 15: Deployment
```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network 0g-testnet

# Verify contracts
npx hardhat verify --network 0g-testnet CONTRACT_ADDRESS
```

## Commands Reference
```bash
npx hardhat compile                    # Compile contracts
npx hardhat test                       # Run tests
npx hardhat test test/OraiToken.js    # Run specific test
npx hardhat node                       # Start local node
npx hardhat console                   # Interactive console
npx hardhat clean                      # Clean artifacts
npx hardhat help                       # Show help
```

## Current Status Checklist
- [ ] Hardhat project initialized
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] OraiToken implemented
- [ ] VotingContract implemented
- [ ] OracleContract implemented
- [ ] GovernanceContract implemented
- [ ] Tests written and passing
- [ ] Deployed to testnet
- [ ] Contracts verified