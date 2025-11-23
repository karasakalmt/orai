import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './addresses';
import OraiTokenABI from './abis/OraiToken.json';
import { logger } from '../utils/logger';

/**
 * Service for interacting with the OraiToken contract
 */
export class OraiTokenService {
  private contract: ethers.Contract;
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Wallet;

  constructor(privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

    // Read-only contract instance
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.OraiToken,
      OraiTokenABI,
      this.provider
    );

    // If private key is provided, create a signer for write operations
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESSES.OraiToken,
        OraiTokenABI,
        this.signer
      );
    }
  }

  /**
   * Get token name
   */
  async getName(): Promise<string> {
    return await this.contract.name();
  }

  /**
   * Get token symbol
   */
  async getSymbol(): Promise<string> {
    return await this.contract.symbol();
  }

  /**
   * Get token decimals
   */
  async getDecimals(): Promise<number> {
    return await this.contract.decimals();
  }

  /**
   * Get total supply
   */
  async getTotalSupply(): Promise<bigint> {
    return await this.contract.totalSupply();
  }

  /**
   * Get balance of an address
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.contract.balanceOf(address);
    } catch (error) {
      logger.error({ error, address }, 'Failed to get token balance');
      throw error;
    }
  }

  /**
   * Stake tokens
   */
  async stake(amount: bigint): Promise<{ txHash: string }> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.stake(amount);
      const receipt = await tx.wait();

      logger.info({ amount: amount.toString(), txHash: receipt.hash }, 'Tokens staked');

      return { txHash: receipt.hash };
    } catch (error) {
      logger.error({ error, amount: amount.toString() }, 'Failed to stake tokens');
      throw error;
    }
  }

  /**
   * Unstake tokens
   */
  async unstake(amount: bigint): Promise<{ txHash: string }> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.unstake(amount);
      const receipt = await tx.wait();

      logger.info({ amount: amount.toString(), txHash: receipt.hash }, 'Tokens unstaked');

      return { txHash: receipt.hash };
    } catch (error) {
      logger.error({ error, amount: amount.toString() }, 'Failed to unstake tokens');
      throw error;
    }
  }

  /**
   * Get stake information for a user
   */
  async getStakeInfo(user: string): Promise<{
    amount: bigint;
    timestamp: bigint;
    rewardDebt: bigint;
    isStaked: boolean;
  }> {
    try {
      const result = await this.contract.getStakeInfo(user);

      return {
        amount: result.amount,
        timestamp: result.timestamp,
        rewardDebt: result.rewardDebt,
        isStaked: result.isStaked,
      };
    } catch (error) {
      logger.error({ error, user }, 'Failed to get stake info');
      throw error;
    }
  }

  /**
   * Format token amount from wei to human-readable format
   */
  formatAmount(amount: bigint, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * Parse human-readable amount to wei
   */
  parseAmount(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }
}
