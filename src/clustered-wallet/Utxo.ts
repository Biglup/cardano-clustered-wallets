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

import { Cardano } from '@cardano-sdk/core';

/**
 * Represents an unspent transaction output.
 */
export interface Utxo {
  /**
   * The transaction hash of the transaction that created this output.
   */
  txHash: string;

  /**
   * The index of this output in the transaction that created it.
   */
  index: number;

  /**
   * The value of this output.
   */
  value: Cardano.Value;

  /**
   * The address of this output.
   */
  address: string;
}
