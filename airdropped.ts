import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { Utils } from './utils'
import { getTokenAccounts } from './listtokens'
import { TokenService } from './listwallets';

//NOTE//
//TODO: apis in this class are not working as we need to fetch thousands of transactions, it is extremely slow
//might need to completely revamop the entire logic
//


// Helper function to add a delay
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Helper function to retry with exponential backoff
  async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 4000): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();  // Try to run the function
      } catch (error) {
        if (error instanceof Error && error.message.includes('429')) {
          attempt++;
          console.log(`Too many requests, retrying attempt ${attempt} after ${delayMs}ms...`);
          await delay(delayMs * attempt);  // Exponential backoff
        } else {
          throw error;  // Throw other types of errors
        }
      }
    }
    throw new Error('Exceeded maximum retry attempts');
  }
  
  // Function to process batches of transactions
  async function processTransactionBatch(
    signatures: string[],
    solanaConnection: Connection,
    tokenMintAddress: string,
    airdroppedTokens: number
  ): Promise<number> {
    for (const signature of signatures) {
      const transaction = await withRetry(() =>
        solanaConnection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 })
      );
      
      if (!transaction) continue;
  
      const postTokenBalances = transaction.meta?.postTokenBalances || [];
      for (const balanceInfo of postTokenBalances) {
        if (balanceInfo.mint === tokenMintAddress) {
          const tokenBalanceChange = balanceInfo.uiTokenAmount.uiAmount || 0;
  
          const solTransfers = transaction.meta?.postBalances || [];
          if (solTransfers[0] < 0.01 * 1e9) {
            airdroppedTokens += tokenBalanceChange;
          }
        }
      }
    }
  
    return airdroppedTokens;
  }
  
  async function calculateAirdropPercentage(tokenMintAddress: string, solanaConnection: Connection): Promise<void> {
    const tokenMintPubKey = new PublicKey(tokenMintAddress);
  
    // Step 1: Fetch total supply of the token
    const tokenSupplyInfo = await solanaConnection.getParsedAccountInfo(tokenMintPubKey);
    if (!tokenSupplyInfo.value || !tokenSupplyInfo.value.data) {
      console.log('Unable to retrieve token supply.');
      return;
    }
  
    const data = tokenSupplyInfo.value.data as { parsed: { info: { supply: number } } };
    const totalSupply = data.parsed?.info?.supply || 0;
    console.log(`Total Supply of Token: ${totalSupply}`);
  
    let airdroppedTokens = 0;
    let beforeCursor: string | undefined = undefined;
  
    const batchSize = 100;  // Process 100 transactions per batch
    const delayBetweenBatches = 5000;  // Wait 5 seconds between batches
  
    while (true) {
      const transactionSignatures = await withRetry(() =>
        solanaConnection.getSignaturesForAddress(tokenMintPubKey, {
          limit: 1000,
          before: beforeCursor,
        })
      );
  
      if (transactionSignatures.length === 0) break;
  
      // Split transaction signatures into batches
      const batches: ConfirmedSignatureInfo[][] = [];
      for (let i = 0; i < 3; i += batchSize) {
        batches.push(transactionSignatures.slice(i, i + batchSize));
      }
  
      for (const batch of batches) {
        // Process each batch and update the total airdropped tokens
        const batchSignatures = batch.map((signatureInfo) => signatureInfo.signature);
        airdroppedTokens = await processTransactionBatch(batchSignatures, solanaConnection, tokenMintAddress, airdroppedTokens);
  
        // Delay between batches
        console.log(`Processed ${batch.length} transactions, waiting for ${delayBetweenBatches}ms...`);
        await delay(delayBetweenBatches);
      }
  
      beforeCursor = transactionSignatures[transactionSignatures.length - 1].signature;
    }
  
    // Step 5: Calculate the percentage of airdropped tokens
    const percentageAirdropped = (airdroppedTokens / totalSupply) * 100;
    console.log(`Airdropped Tokens: ${airdroppedTokens}`);
    console.log(`Percentage of Airdropped Tokens: ${percentageAirdropped.toFixed(2)}%`);
  }


const connection = Utils.getConnection();
// Usage example with Solana mainnet endpoint
// const connection = new Connection("https://api.mainnet-beta.solana.com");
const tokenMintAddress = "CS8JFYh2L5FuiLtHTktmcnArrJTbWvCiBCujgGjepump"; // Replace with your token mint address
calculateAirdropPercentage(tokenMintAddress, connection);
