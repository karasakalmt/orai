import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

async function testProviders() {
  try {
    console.log('🔍 Testing both provider addresses from documentation...\n');

    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.WALLET_PRIVATE_KEY!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const broker = await createZGComputeNetworkBroker(signer);

    // Provider addresses from documentation
    const providers = [
      {
        address: '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
        model: 'gpt-oss-120b',
        name: 'GPT-OSS-120B'
      },
      {
        address: '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3',
        model: 'deepseek-r1-70b',
        name: 'DeepSeek-R1-70B'
      }
    ];

    // List all available services
    console.log('1️⃣  Listing all available services on testnet...');
    const services = await broker.inference.listService();
    console.log(`   Found ${services.length} service(s)\n`);

    for (const testProvider of providers) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing Provider: ${testProvider.name}`);
      console.log(`Address: ${testProvider.address}`);
      console.log(`Model: ${testProvider.model}`);
      console.log('='.repeat(60));

      // Find this provider in the available services
      const service = services.find((s: any) =>
        s.provider.toLowerCase() === testProvider.address.toLowerCase()
      );

      if (!service) {
        console.log('❌ Provider not found in available services list');
        continue;
      }

      console.log('\n📋 Service Details:');
      console.log('   URL:', service.url);
      console.log('   Service Type:', service.serviceType);
      console.log('   Verifiable:', service.verifiable);
      console.log('   Input Price:', service.inputPrice?.toString());
      console.log('   Output Price:', service.outputPrice?.toString());

      // Check acknowledgment status
      console.log('\n2️⃣  Checking provider acknowledgment...');
      let isAcknowledged = false;

      try {
        isAcknowledged = await broker.inference.userAcknowledged(service.provider);
        console.log(`   Acknowledged: ${isAcknowledged}`);
      } catch (error: any) {
        if (error.message && error.message.includes('AccountNotExists')) {
          console.log('   Account does not exist yet');
          isAcknowledged = false;
        } else {
          throw error;
        }
      }

      if (!isAcknowledged) {
        console.log('   ⚙️  Transferring 1.0 0G to provider account...');
        const transferAmount = ethers.parseEther('1.0');
        await broker.ledger.transferFund(
          service.provider,
          'inference',
          transferAmount
        );
        console.log('   ✅ Funds transferred');

        console.log('   ⚙️  Acknowledging provider signer...');
        await broker.inference.acknowledgeProviderSigner(service.provider);
        console.log('   ✅ Provider acknowledged');

        // Wait for confirmation
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Get request headers
      console.log('\n3️⃣  Generating request headers...');
      const headers = await broker.inference.getRequestHeaders(
        service.provider,
        service.model,
        JSON.stringify({
          model: service.model,
          messages: [{ role: 'user', content: 'Hello, test message' }]
        })
      );
      console.log('   ✅ Headers generated');
      console.log('   Header keys:', Object.keys(headers));

      // Test endpoint with OpenAI SDK
      console.log('\n4️⃣  Testing inference request...');
      const endpoint = service.url.endsWith('/v1')
        ? service.url
        : `${service.url}/v1`;

      console.log(`   Endpoint: ${endpoint}`);

      try {
        const openai = new OpenAI({
          baseURL: endpoint,
          apiKey: '', // No API key needed - authentication via headers
        });

        const completion = await openai.chat.completions.create(
          {
            model: service.model,
            messages: [{ role: 'user', content: 'What is 2+2?' }],
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

        console.log('   ✅ SUCCESS! Provider responded');
        console.log('\n📝 Response:');
        console.log('   Model:', completion.model);
        console.log('   Content:', completion.choices[0]?.message?.content);
        console.log('   Tokens:', completion.usage?.total_tokens);

      } catch (error: any) {
        console.log('   ❌ FAILED');
        console.log('   Error:', error.message);
        if (error.status) {
          console.log('   Status:', error.status);
        }
        if (error.response) {
          console.log('   Response:', error.response);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Testing complete');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testProviders();
