import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function refundInference() {
  try {
    console.log('💰 Requesting refund from inference accounts...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log('1️⃣  Creating broker...');
    const broker = await createZGComputeNetworkBroker(signer);
    console.log('   ✅ Broker created\n');

    // Check current ledger balance
    console.log('2️⃣  Checking current ledger balance...');
    const currentLedgerInfo = await broker.ledger.getLedger();
    const currentBalance = Array.isArray(currentLedgerInfo) ? currentLedgerInfo[1] : currentLedgerInfo;
    console.log(`   Current Ledger Balance: ${ethers.formatEther(currentBalance)} 0G\n`);

    // Retrieve funds from inference service type
    console.log('3️⃣  Retrieving funds from inference accounts...');
    const tx = await broker.ledger.retrieveFund("inference");
    console.log('   Transaction submitted, waiting for confirmation...');

    // Check new balance
    console.log('\n4️⃣  Checking new ledger balance...');
    const newLedgerInfo = await broker.ledger.getLedger();
    const newBalance = Array.isArray(newLedgerInfo) ? newLedgerInfo[1] : newLedgerInfo;
    console.log(`   New Ledger Balance: ${ethers.formatEther(newBalance)} 0G\n`);

    const refunded = newBalance - currentBalance;
    console.log(`✅ Refunded: ${ethers.formatEther(refunded)} 0G`);

  } catch (error: any) {
    console.error('\n❌ Refund failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

refundInference();
