# Cardano Addresses Clustering

The Cardano blockchain doesn't inherently recognize "wallets" or "balances." Instead, the blockchain only knows about addresses and UTXOs and the rules for validating transactions that consume and produce them. The notion of a "wallet" with a "balance" is a user-friendly abstraction built on top of the raw UTXO data to make it more intuitive for end-users to interact with the system.
Current wallet implementations cater towards single address wallets or multi address wallets with a single stake key, this while convenient, doesn't completely cover all possible use cases, in this repository
we explore the possibility of creating a wallet abstraction that can cover more complex use cases.

This is a proof of concept of a method for clustering and discovering related Cardano addresses based on shared payment and staking credentials.

## Overview

A wallet cluster represents a collection of Cardano addresses that share common payment or staking credentials. By drawing relationships between these shared credentials, we can construct a graph.

In this graph:

 - **Nodes**: Each node represents an address on the Cardano blockchain.
 - **Edges**: An edge between two nodes (addresses) indicates a shared credential — either a payment credential or a staking credential.
 
The process of discovery outlined here, where one address leads to the discovery of another address due to a shared credential, is akin to traversing this graph.

Depending on the behavior of the ADA holder(s) (or the wallet he uses), this graph could have various shapes and complexities:

- It might be a sigle node in the case of single address wallets.
- It might be a simple linear chain if each new address only brings in one additional related address.
- It could be a tree structure with branching if one address leads to the discovery of multiple related addresses.
- If there are circular relationships (e.g., a staking credential from one address is used with the payment credential of another previously discovered address), it might have cycles, making it a cyclic graph.

In analyzing such a graph, we can recreate an abstract wallet state, for which we can query balance, delegation state, transaction history and so on. In this sense
addresses then become a low level detail (similar to UTXOs), and we can think of the wallet as the aggregate
of the state of all addresses in the cluster.

## POC Scope

- **Address Discovery**: Recursively discover related addresses starting from a single address (must be robust to circular dependencies).
- **Clustered Wallet Representation**: Group related addresses together to form a consolidated view of a clustered wallet.
- **Balance Calculation**: Calculate the total ADA balance of a clustered wallet.
- **UTXO Retrieval**: Retrieve all UTXOs associated with a clustered wallet.
- **Transaction History**: Retrieve all transactions associated with a clustered wallet.
- **Address Delegation State**: Determine the delegation state of a clustered wallet (i.e., whether it is delegated or not, and if so, to which pools and in what proportions).

## How It Works

1. **Starting Point (Seed Address)**: The discovery process begins from a known Cardano address, referred to as the `seedAddress`. This is simple one of the many addresses that belong to the cluster.
2. **Credential Identification**: For the given address, the algorithm identifies associated payment and staking credentials.
3. **Blockchain Scan**: The Cardano blockchain is scanned for other addresses that either share the payment credential or the staking credential with the `seedAddress`.
4. **Recursive Discovery**: For every newly discovered address, steps 2 and 3 are repeated, leading to more addresses being found. This recursive process continues until no more related addresses can be found.
5. **Cluster Creation**: All discovered addresses are grouped together to form a "ClusteredWallet". This cluster provides a collective view of all addresses (and their associated UTXOs) that belong to the same entity.

## Interfaces

### `IBlockchainDataSource`

- Represents an object of this interface can resolve information about domain entities on the Cardano blockchain.

An implementation of this interface is provided using blockfrost. Keep in mind that since this is a
POC the implementation is not optimized for performance and is not meant to be used in production.

## Classes

### `ClusteredWallet`
- Represents a clustered wallet.
- Provides methods to discover related addresses, calculate total balance, and retrieve UTXOs.

### `AddressInfo`
- Contains detailed information about an individual Cardano address, including its associated credentials, balance, and UTXOs.

### `RewardAccountInfo`
- Contains detailed information about a reward account, including its associated staking credential, the staked amount, the pool ID of the pool that the reward account is delegating to  and the amount of withdrawable ADA rewards in the reward account, .
### `UTXO`
- Represents an unspent transaction output on the Cardano blockchain.

### `Transaction`
- Represents a transaction on the Cardano blockchain.


## Example

```typescript
const wallet = await ClusteredWallet.discover(
'addr_test1qrhv559xhtv3ffapt9xevl70npr976ucmgz0dcxtl553e4y8tyssxud0rt2m3af9qy9n6f8hkdkdg2mw0w5xsp28vrtsgqqsp4',
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
```

## CLI

This repository compiles a CLI tool that can be use to perform the discovery.

```bash
$yarn install
$yarn build
```

Then you can run it as:

```bash
API_KEY=preprodeBlockfrostAPI yarn discover addr_test1qrhv559xhtv3ffapt9xevl70npr976ucmgz0dcxtl553e4y8tyssxud0rt2m3af9qy9n6f8hkdkdg2mw0w5xsp28vrtsgqqsp4
```

And you should get an output similar to:

```bash
Starting cluster discovery from seed addr_test1qrhv559xhtv3ffapt9xevl70npr976ucmgz0dcxtl553e4y8tyssxud0rt2m3af9qy9n6f8hkdkdg2mw0w5xsp28vrtsgqqsp4.
Getting reward accounts for addr_test1qrhv559xhtv3ffapt9xevl70npr976ucmgz0dcxtl553e4y8tyssxud0rt2m3af9qy9n6f8hkdkdg2mw0w5xsp28vrtsgqqsp4.
Searching stake_test1ur7f5hek2xm90dscu3h8sgrtq3mpdux9ft2lvaj6l4sh8tcw0cew0 for new addresses...
Found 1 new addresses.
Searching stake_test1urrjd4eu0vjm575uuz86ygmw8cgkkr6ha0g8wga8pe749ngpz7ehf for new addresses...
Found 1 new addresses.
Searching stake_test1upuk6ary2ulcvwkgy5w2geeuxatvg6zxx2esz9spmdq2aeqhuyesm for new addresses...
Found 1 new addresses.
Searching stake_test1uzr4jggrwxh344dc75jszzeaynmmxmx59dh8h2rgq4rkp4c4fksx3 for new addresses...
Found 4 new addresses.
Cluster discovery complete.

Results:

Found 7 addresses.
Found 4 reward accounts.
Found coins: 12591950580 lovelace.
Found withdrawable rewards: 10730506 lovelace.
Wallet Total value: 12602681086 lovelace + [["e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86fa88229fdb05e72a86a7587b208230bb68dba7a83c05cbd1880a1f56b9281494","999970"],["f6f49b186751e61f1fb8c64e7504e771f968cea9f4d11f5222b169e3744d494e","451926865"],["f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a000de1406f6c6467726567","1"],["7d878696b149b529807aa01b8e20785e0a0d470c32c13f53f08a55e344455633363933","1"]].

Delegation state:

Staking credential: stake_test1ur7f5hek2xm90dscu3h8sgrtq3mpdux9ft2lvaj6l4sh8tcw0cew0
 - has 10625714399 lovelace (84.3131%) staked with pool pool132jxjzyw4awr3s75ltcdx5tv5ecv6m042306l630wqjckhfm32r
Staking credential: stake_test1urrjd4eu0vjm575uuz86ygmw8cgkkr6ha0g8wga8pe749ngpz7ehf
 - has 1142117906 lovelace (9.0624%) staked with pool pool188etalcyudyh4xuaa4mjahs62jujem35h3l02ht83zjusqvwdh7
Staking credential: stake_test1upuk6ary2ulcvwkgy5w2geeuxatvg6zxx2esz9spmdq2aeqhuyesm
 - has 127850140 lovelace (1.0144%) staked with pool pool12jthfp4uqah0yndtdu6x2tqaxvgnlpc7h30gvwey3rsrc789tme
Staking credential: stake_test1uzr4jggrwxh344dc75jszzeaynmmxmx59dh8h2rgq4rkp4c4fksx3
 - has 706998641 lovelace (5.6099%) unstaked
done
```

## Optimizations and Notes

- Depending on your specific use case, parallelizing the algorithm can significantly speed up the process.

- If the algorithm needs to run in near real-time (e.g., for a blockchain explorer or analytics tool), maintaining a continuously updated database or state of clustered wallets to quickly retrieve and display data would be a better option.

- While the simple recursive approach is a straightforward method to implement this, there are a variety of graph traversal algorithms that may be more efficient.
