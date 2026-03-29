3. Calling Smart Contract Functions
Use sui client call to invoke entry functions:

sui client call \
  --function <function_name> \
  --module <module_name> \
  --package $PACKAGE_ID \
  --args <arg1> <arg2> \
  --type-args <TypeArg>
For example, to initialize a marketplace accepting SUI:

sui client call --function create --module marketplace --package $PACKAGE_ID --type-args 0x2::sui::SUI
[marketplace deployment]

4. Frontend Integration with dApp Kit
Install for React:

npm i @mysten/dapp-kit-react @mysten/sui
Configure the dApp Kit instance:

// dapp-kit.ts
import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';

export const dAppKit = createDAppKit({
  networks: ['testnet'],
  createClient: (network) => new SuiGrpcClient({
    network,
    baseUrl: 'https://fullnode.testnet.sui.io:443',
  }),
});
Wrap your app with the provider and add a connect button:

import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { dAppKit } from './dapp-kit';

export default function App() {
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      <ConnectButton />
    </DAppKitProvider>
  );
}
Execute a transaction:

import { useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';

const dAppKit = useDAppKit();
const tx = new Transaction();
tx.transferObjects([coinWithBalance({ balance: 1_000_000 })], 'RECIPIENT_ADDRESS');

const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
[React setup]

5. Sponsored Transactions
Sponsored transactions let a sponsor pay gas on behalf of users, reducing onboarding friction.

Build the transaction with onlyTransactionKind:

const tx = new Transaction();
// ... add commands ...

const kindBytes = await tx.build({ provider, onlyTransactionKind: true });

const sponsoredTx = Transaction.fromKind(kindBytes);
sponsoredTx.setSender(sender);
sponsoredTx.setGasOwner(sponsor);
sponsoredTx.setGasPayment(sponsorCoins);
Both the user and sponsor must sign the transaction. The signed TransactionData is submitted to a full node. [sponsored transactions; sponsor guide]

Key roles:

User: Initiates and signs the transaction.
Gas Station: Provides the gas payment objects.
Sponsor: Funds the gas station (often the same entity).
[sponsored txn roles]