import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

async function testInference() {
  try {
    console.log('🧪 Testing inference with actual service model name...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // Get first service
    const services = await broker.inference.listService();
    const service = services[0];

    console.log('📋 Using Service:');
    console.log('   Provider:', service.provider);
    console.log('   URL:', service.url);
    console.log('   Model:', service.model);
    console.log();

    // Prepare the request
    const messages = [{ role: 'user', content: 'What is 2+2? Answer in one sentence.' }];

    // Get headers with actual model name
    console.log('1️⃣  Getting request headers...');
    const headers = await broker.inference.getRequestHeaders(
      service.provider,
      JSON.stringify({
        model: service.model,  // Use actual model name from service
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 50
      })
    );
    console.log('   ✅ Headers obtained:', Object.keys(headers));
    console.log();

    // Make request with OpenAI SDK
    console.log('2️⃣  Making inference request...');
    console.log('   Endpoint:', service.url);
    console.log('   Model:', service.model);

    const openai = new OpenAI({
      baseURL: service.url,
      apiKey: '',
    });

    const completion = await openai.chat.completions.create(
      {
        model: service.model,  // Use actual model name from service
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 50
      },
      {
        headers: {
          ...headers,
        }
      }
    );

    console.log('\n✅ SUCCESS!');
    console.log('\n📝 Response:');
    console.log('   Model:', completion.model);
    console.log('   Content:', completion.choices[0]?.message?.content);
    console.log('   Tokens:', completion.usage?.total_tokens);

  } catch (error: any) {
    console.log('\n❌ FAILED');
    console.log('   Error:', error.message);
    if (error.status) {
      console.log('   Status:', error.status);
    }
    if (error.code) {
      console.log('   Code:', error.code);
    }
    process.exit(1);
  }
}

testInference();
