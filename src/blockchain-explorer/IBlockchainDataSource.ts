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

import { Utxo } from '../clustered-wallet/Utxo';
import { Transaction } from '../clustered-wallet/Transaction';
import { RewardAccountInfo } from '../clustered-wallet/RewardAccountInfo';

/**
 * Objects of this interface can resolve information about domain entities on the Cardano blockchain.
 */
export interface IBlockchainDataSource {
  /**
   * Returns the reward accounts for the given payment credential.
   * @param paymentCredential The payment credential to get the reward accounts for.
   */
  getRewardAccounts(paymentCredential: string): Promise<string[]>;

  /**
   * Returns the reward account info for the given stake credential.
   * @param stakeCredential The stake credential to get the reward account info for.
   */
  getRewardAccountInfo(stakeCredential: string): Promise<RewardAccountInfo | null>;

  /**
   * Returns the addresses for the given reward account.
   * @param rewardAccount The reward account to get the addresses for.
   */
  getAddresses(rewardAccount: string): Promise<string[]>;

  /**
   * Returns the UTXOs for the given address.
   * @param address The address to get the UTXOs for.
   */
  getUtxos(address: string): Promise<Utxo[]>;

  /**
   * Returns the transactions for the given address.
   * @param address The address to get the transactions for.
   */
  getTransactions(address: string): Promise<Transaction[]>;

  /**
   * Returns the network ID of the blockchain.
   * @returns The network ID of the blockchain.
   */
  getNetworkId(): number;
}
