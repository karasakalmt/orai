import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function testOfficialFlow() {
  try {
    console.log('🧪 Testing 0G Compute following official documentation...\n');

    // Step 1: Initialize the Broker
    console.log('1️⃣  Initialize the Broker');
    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('   ✅ Broker created\n');

    // Step 2: Check Account Balance
    console.log('2️⃣  Check Account Balance');
    const ledgerInfo = await broker.ledger.getLedger();
    const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
    console.log(`   Balance: ${ethers.formatEther(balance)} 0G\n`);

    // Step 3: Discover Available Services
    console.log('3️⃣  Discover Available Services');
    const services = await broker.inference.listService();
    console.log(`   Found ${services.length} service(s)`);

    if (services.length === 0) {
      console.log('   ❌ No services available');
      process.exit(1);
    }

    const service = services[0];
    console.log(`   Using: ${service.model}`);
    console.log(`   Provider: ${service.provider}\n`);

    // Step 3.5: Get Service Metadata (per documentation)
    console.log('3.5️⃣  Get Service Metadata');
    const { endpoint, model } = await broker.inference.getServiceMetadata(service.provider);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Model: ${model}\n`);

    // Step 4: Acknowledge Provider
    console.log('4️⃣  Acknowledge Provider');
    try {
      const isAcknowledged = await broker.inference.userAcknowledged(service.provider);
      console.log(`   Already acknowledged: ${isAcknowledged}\n`);
    } catch (error: any) {
      if (error.message.includes('AccountNotExists')) {
        console.log('   Account does not exist - already covered in previous tests\n');
      } else {
        throw error;
      }
    }

    // Step 5: Prepare Messages
    console.log('5️⃣  Prepare Messages');
    const messages = [{ role: "user", content: "What is 2+2? Answer in one short sentence." }];
    console.log(`   Messages: ${JSON.stringify(messages)}\n`);

    // Step 6: Generate Authentication Headers
    console.log('6️⃣  Generate Authentication Headers');
    console.log(`   Input to getRequestHeaders: ${JSON.stringify(messages)}`);
    const headers = await broker.inference.getRequestHeaders(
      service.provider,
      JSON.stringify(messages)  // Per documentation: pass only messages
    );
    console.log(`   Headers obtained: ${Object.keys(headers).join(', ')}\n`);

    // Step 7: Send Request via Fetch
    console.log('7️⃣  Send Request via Fetch');
    const fullUrl = `${endpoint}/chat/completions`;
    console.log(`   URL: ${fullUrl}`);
    console.log(`   Model: ${model}`);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({
        messages: messages,
        model: model,
      })
    });

    console.log(`   Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error body: ${errorText}\n`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('   ✅ SUCCESS!\n');

    // Step 8: Extract Results
    console.log('8️⃣  Extract Results');
    const answer = data.choices[0].message.content;
    const chatID = data.id;
    console.log(`   Chat ID: ${chatID}`);
    console.log(`   Answer: ${answer}`);
    console.log(`   Usage: ${JSON.stringify(data.usage)}\n`);

    // Step 9: Process Response (for verifiable services)
    if (service.verifiable) {
      console.log('9️⃣  Process Response (Verify)');
      const isValid = await broker.inference.processResponse(
        service.provider,
        answer,
        chatID
      );
      console.log(`   Verified: ${isValid}\n`);
    }

    console.log('✅ All steps completed successfully!');

  } catch (error: any) {
    console.log('\n❌ Test failed');
    console.log(`   Error: ${error.message}`);
    if (error.cause) {
      console.log(`   Cause: ${error.cause}`);
    }
    if (error.stack) {
      console.log(`\nStack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

testOfficialFlow();
