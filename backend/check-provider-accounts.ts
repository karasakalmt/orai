import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkProviderAccounts() {
  try {
    console.log('🔍 Checking provider account balances...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // Get all services
    const services = await broker.inference.listService();

    console.log(`Found ${services.length} provider(s)\n`);

    for (const service of services) {
      console.log(`Provider: ${service.provider}`);
      console.log(`Model: ${service.model}`);

      try {
        // Get account balance for this provider
        const account = await broker.ledger.getAccount(service.provider, "inference");
        console.log(`Account Balance: ${ethers.formatEther(account)} 0G`);
      } catch (error: any) {
        console.log(`Account Balance: 0 0G (not created or error: ${error.message})`);
      }
      console.log();
    }

    // Check general ledger
    console.log('═'.repeat(50));
    const ledgerInfo = await broker.ledger.getLedger();
    const ledgerBalance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
    console.log(`General Ledger Balance: ${ethers.formatEther(ledgerBalance)} 0G`);

  } catch (error: any) {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkProviderAccounts();
