import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function acknowledgeProvider() {
  try {
    console.log('🔐 Acknowledging 0G Compute provider...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // Get provider address from command line or use first available
    const providerAddress = process.argv[2];

    if (providerAddress) {
      console.log(`1️⃣  Acknowledging specific provider: ${providerAddress}\n`);
      await acknowledgeOne(broker, providerAddress);
    } else {
      console.log(`1️⃣  No provider specified, acknowledging all available providers...\n`);
      const services = await broker.inference.listService();
      console.log(`   Found ${services.length} provider(s)\n`);

      for (const service of services) {
        await acknowledgeOne(broker, service.provider);
        console.log();
      }
    }

    console.log('✅ All providers acknowledged!');

  } catch (error: any) {
    console.error('\n❌ Failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

async function acknowledgeOne(broker: any, providerAddress: string) {
  console.log(`   Provider: ${providerAddress}`);

  // Check if already acknowledged
  try {
    const isAcknowledged = await broker.inference.userAcknowledged(providerAddress);
    if (isAcknowledged) {
      console.log(`   ✅ Already acknowledged`);
      return;
    }
  } catch (error: any) {
    if (!error.message.includes('AccountNotExists')) {
      throw error;
    }
  }

  // Transfer 1.0 0G to provider account
  console.log(`   💰 Transferring 1.0 0G to provider account...`);
  const transferAmount = ethers.parseEther('1.0');
  await broker.ledger.transferFund(
    providerAddress,
    'inference',
    transferAmount
  );

  // Wait for confirmation
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Acknowledge provider
  console.log(`   🔐 Acknowledging provider signer...`);
  await broker.inference.acknowledgeProviderSigner(providerAddress);

  console.log(`   ✅ Provider acknowledged successfully`);
}

acknowledgeProvider();
