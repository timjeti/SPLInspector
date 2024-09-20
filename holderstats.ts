import { Connection, PublicKey, ParsedConfirmedTransaction, ParsedAccountData } from "@solana/web3.js";
import { Utils } from './utils'
const solanaConnection = Utils.getConnection();

//TODO: the logic to get the average hold time is now working, need to first understand how it can be done
//the complete approach needs to be figured, instead of using transaction data if it can be done using transaction steps
async function getAverageHoldTime(tokenAddress: string, connection: Connection): Promise<number> {
  const tokenPublicKey = new PublicKey(tokenAddress);

  // Fetch all token accounts that hold this token
  const tokenAccounts = await connection.getTokenLargestAccounts(tokenPublicKey);
  const largestAccounts = tokenAccounts.value.map((account) => account.address);

  let totalHoldTime = 0;
  let totalHolders = 0;
  let idx = 0; 
  // Iterate over each account and calculate the hold time
  for (let i =0; i < largestAccounts.length; i ++) {
    if(i == 0){
        continue;
    }
    if(i > 3){
        break;
    }
    let accountAddress = largestAccounts[i]; 
    // console.log("Started for wallet: "+ accountAddress.toBase58());
    const accountPublicKey = new PublicKey(accountAddress);
    let owner : string = "";
    const accountInfo = await connection.getParsedAccountInfo(accountPublicKey);
    if (accountInfo && accountInfo.value && accountInfo.value.data) {
         const data : Buffer | ParsedAccountData= accountInfo.value.data;
         const parsedData = data as ParsedAccountData;
         if (parsedData && "parsed" in parsedData) {
            owner = parsedData.parsed.info.owner;
            console.log("Starting scan for Owner...........: "+owner);
          }
      }
    // Get the transaction history for the account
    const signatures = await connection.getSignaturesForAddress(accountPublicKey, { limit: 1000 });

    // Filter for received and transferred out transactions
    let firstReceivedTimestamp: number | null = null;
    let lastTransferTimestamp: number | null = null;

    for (const signatureInfo of signatures) {
      const transaction: ParsedConfirmedTransaction | null = await connection.getParsedTransaction(signatureInfo.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (transaction?.meta?.postTokenBalances && transaction.meta.preTokenBalances) {
        const preBalances = transaction.meta.preTokenBalances.filter(bal => bal.mint === tokenAddress);
        const postBalances = transaction.meta.postTokenBalances.filter(bal => bal.mint === tokenAddress);
        preBalances.filter((balance) => balance?.owner === owner)
        postBalances.filter((balance) => balance?.owner === owner)
        // console.log(preBalances);
        // console.log(postBalances)
        // Detect if tokens were received or transferred
        const received = postBalances.some((balance) => Number(balance.uiTokenAmount.amount) > 0 && preBalances.every((preBalance) => Number(preBalance.uiTokenAmount.amount) == 0 || Number(preBalance.uiTokenAmount.amount) == null));
        const transferredOut = preBalances.some((balance) => Number(balance.uiTokenAmount.amount) > 0 && postBalances.every((postBalance) => Number(postBalance.uiTokenAmount.amount) == 0 || Number(postBalance.uiTokenAmount.amount) == null));
        
        // preBalances.forEach((balance) => console.log(balance?.uiTokenAmount?.amount));
        // postBalances.forEach((balance) => console.log(balance?.uiTokenAmount?.amount));
        // console.log(received);
        // console.log(transferredOut);
        if (received && !firstReceivedTimestamp) {
          firstReceivedTimestamp = transaction.blockTime!;
          console.log("First Recieved: "+ firstReceivedTimestamp);
        }

        if (transferredOut) {
          lastTransferTimestamp = transaction.blockTime!;
          console.log("Last Transfer: "+ lastTransferTimestamp);
        }
      }
    }

    // Calculate the hold time if both timestamps exist
    if (firstReceivedTimestamp && lastTransferTimestamp) {
      const holdTime = lastTransferTimestamp - firstReceivedTimestamp;
      totalHoldTime += holdTime;
      totalHolders++;
    }
  }

  // Return the average hold time (in seconds)
  if (totalHolders === 0) {
    return 0;
  }
  console.log("Avg: "+ (totalHoldTime / totalHolders))
  return totalHoldTime / totalHolders;
}

getAverageHoldTime("CS8JFYh2L5FuiLtHTktmcnArrJTbWvCiBCujgGjepump", solanaConnection);