import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBrokerInit() {
  try {
    console.log('🔍 Testing 0G Compute broker initialization...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    if (!privateKey) {
      console.error('❌ WALLET_PRIVATE_KEY not found in .env');
      process.exit(1);
    }

    console.log('1️⃣  Creating provider and signer...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);

    console.log('✅ Wallet initialized');
    console.log(`   Address: ${address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} 0G\n`);

    console.log('2️⃣  Creating 0G Compute broker...');
    const broker = await createZGComputeNetworkBroker(signer);
    console.log('✅ Broker created');
    console.log('   Broker properties:', Object.keys(broker), '\n');

    console.log('3️⃣  Checking ledger account...');
    try {
      const ledgerInfo = await broker.ledger.getLedger();
      console.log('✅ Ledger account exists');
      console.log('   Ledger info:', ledgerInfo);
      // getLedger returns a struct/array, balance is likely at index 1 or 2
      const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
      console.log(`   Balance: ${ethers.formatEther(balance)} 0G\n`);
    } catch (error: any) {
      console.log('⚠️  Ledger account error:', error.message);

      if (error.message.includes('Account does not exist')) {
        console.log('\n4️⃣  Creating ledger account with 0.1 0G...');
        // addLedger expects a number, not bigint
        const tx = await broker.ledger.addLedger(0.1);
        console.log('✅ Transaction submitted');

        // Wait a bit for transaction confirmation
        console.log('   Waiting for confirmation...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const ledgerInfo = await broker.ledger.getLedger();
        const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
        console.log('✅ Account created');
        console.log(`   New balance: ${ethers.formatEther(balance)} 0G\n`);
      } else {
        throw error;
      }
    }

    console.log('5️⃣  Listing available inference services...');
    const services = await broker.inference.listService();
    console.log(`✅ Found ${services.length} service(s)`);

    if (services.length > 0) {
      console.log('\n   Available services:');
      services.slice(0, 3).forEach((service: any, i: number) => {
        console.log(`   ${i + 1}. Provider: ${service.provider || 'N/A'}`);
        console.log(`      URL: ${service.url || 'N/A'}`);
        console.log(`      Service Type: ${service.serviceType || 'N/A'}`);
        console.log(`      Model: ${service.model || 'N/A'}`);
        console.log(`      Verifiable: ${service.verifiable || false}`);
      });
    }

    console.log('\n✅ All tests passed! Broker is ready to use.');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testBrokerInit();
