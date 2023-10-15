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

import { ClusteredWallet } from './clustered-wallet/ClusteredWallet';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { BlockfrostBlockchainDataSource } from './blockchain-explorer/BlockfrostBlockchainDataSource';
import { RewardAccountInfo } from './clustered-wallet/RewardAccountInfo';
import { BigNumber } from 'bignumber.js';

/**
 * Track progress of the discovery process logging on the console.
 */
const consoleProgressMonitor = {
  /**
   * Update the progress of the discovery process.
   * @param message The message to log.
   */
  update: (message: string) => console.log(message)
};

/**
 * Render the delegation state of the wallet.
 *
 * @param accounts The reward accounts of the wallet.
 * @param totalBalance The total balance of the wallet.
 */
const renderDelegationState = (accounts: RewardAccountInfo[], totalBalance: bigint) => {
  for (const account of accounts) {
    console.log(`Staking credential: ${account.stakingCredential}`);

    const stakedPercentage = new BigNumber(account.stakedAmount.toString()).dividedBy(totalBalance.toString()).multipliedBy('100').toFixed(4, BigNumber.ROUND_DOWN);

    if (account.poolId === null) {
      console.log(` - has ${account.stakedAmount} lovelace (${stakedPercentage}%) unstaked`);
    } else {
      console.log(` - has ${account.stakedAmount} lovelace (${stakedPercentage}%) staked with pool ${account.poolId}`);
    }
  }
};

/**
 * Run the discovery process and prints the results to the console.
 */
async function run() {
  if (process.env.API_KEY === undefined) {
    console.log('Please set the environment variable API_KEY to your Blockfrost API key.');
    return;
  }

  if (process.argv.length < 3) {
    console.log('Usage: yarn run discover <bech32-address>');
    return;
  }

  const wallet = await ClusteredWallet.discover(
    process.argv[2],
    new BlockfrostBlockchainDataSource(new BlockFrostAPI({
      projectId: process.env.API_KEY
    }), true), consoleProgressMonitor);

  const balance = wallet.getBalance();
  const clusterAddresses = wallet.getAddresses();
  const clusterRewardAccounts = wallet.getRewardAccounts();
  const rewards = wallet.getRewardAccounts().map((rewardAccount) => rewardAccount.rewards).reduce((a, b) => a + b, BigInt(0));

  console.log('\nResults:\n');

  console.log(`Found ${clusterAddresses.length} addresses.`);
  console.log(`Found ${clusterRewardAccounts.length} reward accounts.`);
  console.log(`Found coins: ${balance.coins} lovelace.`);
  console.log(`Found withdrawable rewards: ${rewards} lovelace.`);
  console.log(`Wallet Total value: ${balance.coins + rewards} lovelace + ${JSON.stringify([...balance.assets.entries()], (_, v) => typeof v === 'bigint' ? v.toString() : v)}.`);

  console.log('\nDelegation state:\n');
  renderDelegationState(clusterRewardAccounts, balance.coins + rewards);
}

run().then(_ => console.log('done'));
