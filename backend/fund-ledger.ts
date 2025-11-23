import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function fundLedger() {
  try {
    console.log('🔍 Checking and funding ledger account...\\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    if (!privateKey) {
      console.error('❌ WALLET_PRIVATE_KEY not found in .env');
      process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);

    console.log('1️⃣  Wallet Status:');
    console.log(`   Address: ${address}`);
    console.log(`   Wallet Balance: ${ethers.formatEther(balance)} 0G\\n`);

    console.log('2️⃣  Creating broker...');
    const broker = await createZGComputeNetworkBroker(signer);
    console.log('   ✅ Broker created\\n');

    console.log('3️⃣  Checking current ledger balance...');
    try {
      const ledgerInfo = await broker.ledger.getLedger();
      const ledgerBalance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
      console.log(`   Current Ledger Balance: ${ethers.formatEther(ledgerBalance)} 0G\\n`);

      // Use depositFund instead of addLedger for existing accounts
      console.log('4️⃣  Using depositFund() to add 1.0 0G...');
      await broker.ledger.depositFund(1.0);
      console.log('   Transaction submitted, waiting for confirmation...');

      await new Promise(resolve => setTimeout(resolve, 5000));

      const newLedgerInfo = await broker.ledger.getLedger();
      const newBalance = Array.isArray(newLedgerInfo) ? newLedgerInfo[1] : newLedgerInfo;
      console.log(`   ✅ New Ledger Balance: ${ethers.formatEther(newBalance)} 0G\\n`);

    } catch (error: any) {
      if (error.message && error.message.includes('Account does not exist')) {
        console.log('   No ledger account exists, creating one...');
        console.log('4️⃣  Creating ledger with 1.5 0G...');
        await broker.ledger.addLedger(1.5);

        await new Promise(resolve => setTimeout(resolve, 5000));

        const ledgerInfo = await broker.ledger.getLedger();
        const newBalance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
        console.log(`   ✅ Account Created! Balance: ${ethers.formatEther(newBalance)} 0G\\n`);
      } else {
        throw error;
      }
    }

    console.log('✅ Success! Ledger is funded.');

  } catch (error: any) {
    console.error('\\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fundLedger();
