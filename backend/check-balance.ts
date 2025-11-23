import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkBalance() {
  const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const privateKey = process.env.WALLET_PRIVATE_KEY!;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  const broker = await createZGComputeNetworkBroker(signer);

  const ledgerInfo = await broker.ledger.getLedger();
  const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;

  console.log(`Current Ledger Balance: ${ethers.formatEther(balance)} 0G`);
}

checkBalance();
