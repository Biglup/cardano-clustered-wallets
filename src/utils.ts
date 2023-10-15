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
import * as BaseEncoding from '@scure/base';

const MAX_BECH32_LENGTH_LIMIT = 1023;
const VERIFICATION_KEY_HASH_PREFIX = 'addr_vkh';

/**
 * Gets the payment credential from an address in bech32 format.
 * @param address The address in bech32 format.
 */
export const getPaymentCredential = (address: string): string => {
  const addr = Cardano.Address.fromBech32(address);
  let paymentCredential = addr.asEnterprise()?.getPaymentCredential();
  paymentCredential = addr.asBase() ? addr.asBase().getPaymentCredential() : paymentCredential;

  const words = BaseEncoding.bech32.toWords(Buffer.from(paymentCredential.hash, 'hex'));
  return BaseEncoding.bech32.encode(VERIFICATION_KEY_HASH_PREFIX, words, MAX_BECH32_LENGTH_LIMIT);
};

/**
 * Gets the staking credential from an address in bech32 format.
 * @param address The address in bech32 format.
 * @param networkId The network id.
 */
export const getStakingCredential = (address: string, networkId: number): string | null => {
  const addr = Cardano.Address.fromBech32(address);
  const credential = addr.asBase()?.getStakeCredential();

  if (!credential) return null;

  return Cardano.RewardAddress.fromCredentials(networkId, credential).toAddress().toBech32();
};
