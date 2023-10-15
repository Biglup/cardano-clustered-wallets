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

import { Utxo } from './Utxo';
import { IBlockchainDataSource } from '../blockchain-explorer/IBlockchainDataSource';
import { RewardAccountInfo } from './RewardAccountInfo';
import { AddressInfo } from './AddressInfo';
import { Cardano, coalesceValueQuantities } from '@cardano-sdk/core';
import { getPaymentCredential, getStakingCredential } from '../utils';

/**
 * Wallet that describes a group of addresses that belong to the same entity and are linked
 * directly or indirectly based on shared payment or staking credentials.
 */
export class ClusteredWallet {
  private _utxos: Array<Utxo>;
  private _clusterAddresses: Array<AddressInfo>;
  private _clusterRewardAccounts: Array<RewardAccountInfo>;
  private _balance: Cardano.Value;
  private _rewards: bigint;

  /**
   * Get all reward accounts associated with this clustered wallet.
   */
  getRewardAccounts(): Array<RewardAccountInfo> {
    return this._clusterRewardAccounts;
  }

  /**
   * Get the total rewards of the clustered wallet.
   */
  getRewards() {
    return this._rewards;
  }

  /**
   * Get the total balance of the clustered wallet.
   */
  getBalance(): Cardano.Value {
    return this._balance;
  }

  /**
   * Get all UTXOs associated with this clustered wallet.
   */
  getUTXOs(): Utxo[] {
    return this._utxos;
  }

  /**
   * Get all addresses associated with this clustered wallet.
   */
  getAddresses(): Array<AddressInfo> {
    return this._clusterAddresses;
  }

  /**
   * Recursively finds addresses based on shared payment or staking credentials.
   * @param seedAddress The address to start the discovery process from.
   * @param blockchainExplorer The blockchain explorer to use to discover addresses.
   * @param progressMonitor An optional progress monitor to track the discovery process.
   */
  static async discover(seedAddress: string, blockchainExplorer: IBlockchainDataSource, progressMonitor?: {
    update: (message: string) => void
  }): Promise<ClusteredWallet> {
    const clusterAddresses = new Set<string>();
    const clusterRewardAccounts = new Set<string>();
    const clusterUtxos = new Array<Utxo>();
    const addressToExplore = new Set<string>();

    progressMonitor?.update(`Starting cluster discovery from seed ${seedAddress}.`);

    addressToExplore.add(seedAddress);

    let isDiscovering = true;
    while (isDiscovering) {
      if (addressToExplore.size === 0) break;

      const address = ClusteredWallet._popFromSet(addressToExplore);

      if (clusterAddresses.has(address)) continue;

      progressMonitor?.update(`Getting reward accounts for ${address}.`);

      const rewardAccounts = await blockchainExplorer.getRewardAccounts(address);

      for (const rewardAccount of rewardAccounts) {
        if (clusterRewardAccounts.has(rewardAccount)) continue;

        clusterRewardAccounts.add(rewardAccount);
        progressMonitor?.update(`Searching ${rewardAccount} for new addresses...`);

        const addresses = await blockchainExplorer.getAddresses(rewardAccount);

        const startingAddressCount = clusterAddresses.size;
        ClusteredWallet._insertRangeInSet(addresses, addressToExplore);
        ClusteredWallet._insertRangeInSet(addresses, clusterAddresses);
        const endingAddressCount = clusterAddresses.size;

        progressMonitor?.update(`Found ${endingAddressCount - startingAddressCount} new addresses.`);
      }

      isDiscovering = addressToExplore.size > 0;
    }

    const clusterAddressInfo = new Array<AddressInfo>();
    for (const clusterAddress of clusterAddresses) {
      const utxos = await blockchainExplorer.getUtxos(clusterAddress);
      clusterUtxos.push(...utxos);

      const balance = coalesceValueQuantities(utxos.map((utxo) => utxo.value));

      clusterAddressInfo.push({
        address: clusterAddress,
        balance: balance,
        utxos: utxos,
        paymentCredential: getPaymentCredential(clusterAddress),
        stakingCredential: getStakingCredential(clusterAddress, blockchainExplorer.getNetworkId())
      });
    }

    const clusterRewardAccountInfo = new Array<RewardAccountInfo>();
    for (const rewardAccount of clusterRewardAccounts) {
      const rewardAccountInfo = await blockchainExplorer.getRewardAccountInfo(rewardAccount);

      if (rewardAccountInfo !== null)
        clusterRewardAccountInfo.push(rewardAccountInfo);
    }

    const wallet = new ClusteredWallet();

    wallet._utxos = clusterUtxos.filter((value, index, self) =>
      index === self.findIndex((t) => (
        t.txHash === value.txHash && t.index === value.index
      )));

    wallet._balance = coalesceValueQuantities(wallet._utxos.map((utxo) => utxo.value));
    wallet._rewards = clusterRewardAccountInfo.reduce((acc, rewardAccountInfo) => acc + rewardAccountInfo.rewards, BigInt(0));
    wallet._clusterAddresses = clusterAddressInfo;
    wallet._clusterRewardAccounts = clusterRewardAccountInfo;

    progressMonitor?.update(`Cluster discovery complete.`);
    return wallet;
  }

  /**
   * Pop a value from a set.
   * @param set The set to pop a value from.
   * @private
   */
  private static _popFromSet<T>(set: Set<T>) {
    for (const value of set) {
      set.delete(value);
      return value;
    }
  }

  /**
   * Insert a range of values into a set.
   * @param array The range of values to insert.
   * @param set The set to insert the values into.
   * @private
   */
  private static _insertRangeInSet<T>(array: Array<T>, set: Set<T>) {
    for (const value of array) {
      set.add(value);
    }
  }
}
