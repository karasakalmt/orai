import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔑 Creating new deployment wallet...\n");

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log("New Wallet Created!");
console.log("=" .repeat(60));
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("Mnemonic:", wallet.mnemonic.phrase);
console.log("=" .repeat(60));

console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
console.log("1. NEVER share your private key or mnemonic");
console.log("2. NEVER commit these to version control");
console.log("3. Store them securely (password manager, hardware wallet, etc.)");

console.log("\n📝 To use this wallet for deployment:");
console.log("1. Add the private key to your .env file:");
console.log(`   PRIVATE_KEY=${wallet.privateKey.slice(2)}`); // Remove 0x prefix
console.log("\n2. Fund this address with 0G testnet tokens:");
console.log("   - Get testnet tokens from: https://faucet.0g.ai");
console.log("   - Send tokens to:", wallet.address);

console.log("\n3. Check your balance:");
console.log("   Visit: https://scan-testnet.0g.ai/address/" + wallet.address);

// Optionally save to a secure file (NOT recommended for production)
const saveWallet = process.argv[2] === "--save";
if (saveWallet) {
  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    createdAt: new Date().toISOString(),
    network: "0g-testnet",
    warning: "KEEP THIS FILE SECURE! DO NOT COMMIT TO GIT!"
  };

  const walletsPath = path.join(__dirname, "../.wallets");
  if (!fs.existsSync(walletsPath)) {
    fs.mkdirSync(walletsPath, { recursive: true });
  }

  const filename = `wallet-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(walletsPath, filename),
    JSON.stringify(walletInfo, null, 2)
  );

  // Add to .gitignore
  const gitignorePath = path.join(__dirname, "../../.gitignore");
  let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  if (!gitignore.includes(".wallets/")) {
    gitignore += "\n# Wallet files\n.wallets/\n";
    fs.writeFileSync(gitignorePath, gitignore);
  }

  console.log("\n✅ Wallet saved to:", path.join(walletsPath, filename));
  console.log("   (.wallets/ added to .gitignore)");
}