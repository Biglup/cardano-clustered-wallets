/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IBlockchainDataSource } from './IBlockchainDataSource';
import { Utxo } from '../clustered-wallet/Utxo';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { Cardano } from '@cardano-sdk/core';
import { Transaction } from '../clustered-wallet/Transaction';
import { getPaymentCredential, getStakingCredential } from '../utils';
import { RewardAccountInfo } from '../clustered-wallet/RewardAccountInfo';

/**
 * A blockchain data source that uses Blockfrost as a data provider.
 */
export class BlockfrostBlockchainDataSource implements IBlockchainDataSource {
  private _api: BlockFrostAPI;
  private readonly _networkId: number;

  /**
   * Creates a new BlockfrostBlockchainDataSource.
   * @param api The Blockfrost API to use.
   * @param isTestnet Whether the blockchain is a testnet.
   */
  constructor(api: BlockFrostAPI, isTestnet: boolean) {
    this._api = api;
    this._networkId = isTestnet ? 0 : 1;
  }

  /**
   * Returns the network ID this data source is configured for.
   */
  getNetworkId(): number {
    return this._networkId;
  }

  /**
   * Returns the reward accounts for the given payment credential.
   * @param address The address to get the reward accounts for.
   */
  async getRewardAccounts(address: string): Promise<Array<string>> {
    const utxos = await this.getUtxos(address);
    const rewardAccounts = utxos.map((utxo) =>
      getStakingCredential(utxo.address, this._networkId)
    ).filter((stakingCredential) => stakingCredential !== null);

    return [...new Set(rewardAccounts)];
  }

  /**
   * Returns the reward account info for the given stake credential.
   * @param rewardAccount The reward account to get the reward account info for.
   */
  async getRewardAccountInfo(rewardAccount: string): Promise<RewardAccountInfo | null> {
    let account;
    try {
      account = await this._api.accounts(rewardAccount);
    } catch (e) {
      return null;
    }

    return {
      stakingCredential: rewardAccount,
      rewards: BigInt(account.withdrawable_amount),
      stakedAmount: BigInt(account.controlled_amount),
      poolId: account.pool_id

    };
  }

  /**
   * Returns the addresses for the given reward account.
   * @param stakeCredential The stake credential to get the addresses for.
   */
  async getAddresses(stakeCredential: string): Promise<Array<string>> {
    let addresses;
    try {
      addresses = await this._api.accountsAddresses(stakeCredential);
    } catch (e) {
      return [];
    }

    return addresses.map((address) => address.address);
  }

  /**
   * Returns the UTXOs for the given address.
   * @param address The address to get the UTXOs for.
   */
  async getUtxos(address: string): Promise<Array<Utxo>> {
    const vkh = getPaymentCredential(address);

    const result = await this._api.addressesUtxos(vkh);
    return result.map((utxo) => {
      return {
        address: utxo.address,
        txHash: utxo.tx_hash,
        index: utxo.output_index,
        value: {
          coins: BigInt(utxo.amount.find((entry) => entry.unit === 'lovelace').quantity),
          assets: new Map<Cardano.AssetId, Cardano.Lovelace>(
            utxo.amount
              .filter((entry) => entry.unit !== 'lovelace')
              .map((entry) => [Cardano.AssetId(entry.unit), BigInt(entry.quantity)])
          )
        }
      };
    });
  }

  /**
   * Returns the transactions for the given address.
   * @param address The address to get the transactions for.
   */
  async getTransactions(address: string): Promise<Array<Transaction>> {
    return (await this._api.addressesTransactions(address)).map((tx) => {
      return {
        txHash: tx.tx_hash,
        index: tx.tx_index
      };
    });
  }
}
