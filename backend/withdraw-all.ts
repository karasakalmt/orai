import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function withdrawAll() {
  try {
    console.log('💰 Withdrawing all funds from 0G ledger...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log('1️⃣  Wallet Address:', wallet.address);
    const walletBalance = await provider.getBalance(wallet.address);
    console.log(`   Wallet Balance: ${ethers.formatEther(walletBalance)} 0G\n`);

    console.log('2️⃣  Creating broker...');
    const broker = await createZGComputeNetworkBroker(signer);
    console.log('   ✅ Broker created\n');

    // Check current ledger balance
    console.log('3️⃣  Checking current ledger balance...');
    const currentLedgerInfo = await broker.ledger.getLedger();
    const currentBalance = Array.isArray(currentLedgerInfo) ? currentLedgerInfo[1] : currentLedgerInfo;
    console.log(`   Ledger Balance: ${ethers.formatEther(currentBalance)} 0G\n`);

    if (currentBalance === 0n) {
      console.log('✅ Ledger is already empty, nothing to withdraw\n');
      return;
    }

    // Retrieve funds from inference service type first
    console.log('4️⃣  Retrieving funds from inference accounts...');
    try {
      await broker.ledger.retrieveFund("inference");
      console.log('   ✅ Retrieved inference funds\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.log(`   ⚠️  ${error.message}\n`);
    }

    // Check balance after retrieve
    const afterRetrieve = await broker.ledger.getLedger();
    const afterRetrieveBalance = Array.isArray(afterRetrieve) ? afterRetrieve[1] : afterRetrieve;
    console.log(`5️⃣  Balance after retrieve: ${ethers.formatEther(afterRetrieveBalance)} 0G\n`);

    // Note: There's no direct withdraw function in the SDK
    // The funds stay in the general ledger and can be used for future requests
    // To truly withdraw, you would need to interact with the contract directly

    console.log('ℹ️  Note: The SDK does not provide a withdrawFund() method.');
    console.log('   Funds remain in the ledger: ${ethers.formatEther(afterRetrieveBalance)} 0G');
    console.log('   These can be used for future inference requests.\n');

    // Final balance check
    console.log('6️⃣  Final balances:');
    const finalLedger = await broker.ledger.getLedger();
    const finalLedgerBalance = Array.isArray(finalLedger) ? finalLedger[1] : finalLedger;
    const finalWalletBalance = await provider.getBalance(wallet.address);

    console.log(`   Ledger: ${ethers.formatEther(finalLedgerBalance)} 0G`);
    console.log(`   Wallet: ${ethers.formatEther(finalWalletBalance)} 0G\n`);

    console.log('✅ Retrieved inference funds. Ledger balance can be used for future requests.');

  } catch (error: any) {
    console.error('\n❌ Withdrawal failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

withdrawAll();
