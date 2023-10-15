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
import { Cardano } from '@cardano-sdk/core';

/**
 * Represents the information of an address.
 */
export interface AddressInfo {
  /**
   * The address in bech32.
   */
  address: string;

  /**
   * The payment credential of the address in bech32.
   */
  paymentCredential: string;

  /**
   * The staking credential of the address in bech32.
   */
  stakingCredential: string;

  /**
   * The balance of the address.
   */
  balance: Cardano.Value;

  /**
   * The UTXOs of the address.
   */
  utxos: Utxo[];
}
