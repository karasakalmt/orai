import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function listProviders() {
  const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const privateKey = process.env.WALLET_PRIVATE_KEY!;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  const broker = await createZGComputeNetworkBroker(signer);

  console.log('Fetching available inference services...\n');
  const services = await broker.inference.listService();

  console.log(`Found ${services.length} service(s)\n`);

  services.forEach((service: any, i: number) => {
    console.log(`\n========== Service ${i + 1} ==========`);
    console.log('Provider:', service.provider);
    console.log('URL:', service.url);
    console.log('Model:', service.model);
    console.log('Service Type:', service.serviceType);
    console.log('Verifiable:', service.verifiable);
    console.log('Input Price:', service.inputPrice?.toString());
    console.log('Output Price:', service.outputPrice?.toString());
    console.log('All fields:', Object.keys(service));
  });
}

listProviders();
