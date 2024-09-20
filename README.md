# SPLInspector

SPLInspector is an Express.js application designed to track and analyze various details about Solana SPL tokens. This tool enables insights into token holder distribution, token purchases by specific wallets, discovery of newly created tokens, and identification of token "jeeters" (wallets frequently selling a token).

SPLInspector integrates with the Solana blockchain and leverages libraries like the Metaplex Foundation and the Pyth Network for comprehensive SPL token data collection.

## Features
- **Track Token Holders**: Retrieve the number of wallets that have purchased or hold a specific token.
- **Wallet Token Analysis**: Fetch details about the tokens purchased by a specific wallet.
- **New Token Discovery**: List all newly created SPL tokens on the network.
- **Jeeter Detection**: Identify wallets that frequently sell a particular token.

## Prerequisites
To set up and run SPLInspector, ensure you have the following installed:

Node.js (v14.x or above)
Typescript (for development)
Solana CLI (Optional, for enhanced Solana blockchain interaction)


## Installation
Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/splinspector.git
cd splinspector
```

Step 2: Install Dependencies
Install all necessary packages as specified in the package.json file:
```bash
npm install
```

Step 3: TypeScript Setup
This project is developed in TypeScript. Ensure that ts-node is installed globally for running TypeScript files directly:
```bash
npm install -g ts-node
```

Step 4: Environment Variables (Optional)
You may need to configure environment variables for network endpoints, API keys, or any other necessary credentials. Create a .env file in the root directory to manage environment variables.

Example .env file:
```bash
SOLANA_NETWORK=https://api.mainnet-beta.solana.com
MORALIS_API_KEY=your_moralis_api_key
```


## Usage
To run the application in development mode, use ts-node to execute the entry TypeScript file.

```bash
ts-node src/app.ts
```

## Dependencies
The following key dependencies are used within the project:

@metaplex-foundation/js: Library for interacting with Metaplex NFTs and SPL tokens.
@solana/spl-token: Library for interacting with the SPL token program.
@solana/web3.js: Solana Web3 library to build on-chain programs and applications.
@moralisweb3/common-evm-utils: Utility library for working with EVM chains (optional, not Solana specific).
@pythnetwork/client: Pyth Network client for real-time price feeds.
Refer to the full list of dependencies in package.json.
