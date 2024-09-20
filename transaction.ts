
import { Connection, PublicKey, ConfirmedSignatureInfo, LAMPORTS_PER_SOL, ParsedTransactionWithMeta, TokenBalance} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { priceChecker } from './pricechecker';
import { Utils } from './utils'


//APIS HERE work sometimes for newer token like fetching token prices but does not work all the time for older tokens
//TODO Need to find a faster way to fetch the transaction and calculate token price
async function getLatestTransaction(publicKey: PublicKey, counter : number = 0, connection : Connection): Promise<ParsedTransactionWithMeta | null | undefined > {
    
    try {
      // Get account info
      const accountInfo = await connection.getAccountInfo(publicKey);
      if (!accountInfo) {
        throw new Error("Account not found");
      }
      // let allTransactions : any[]= [];
      // let fetchedTransactions;
      // let lastSignature = null;
      // Get the oldest transaction history
      let latestTransactiion: ConfirmedSignatureInfo | undefined = undefined;

      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });

      // Filter successful transactions (confirmed or finalized)
      const successfulSignatures = signatures.filter(
        (signatureInfo) =>
          signatureInfo.confirmationStatus === 'confirmed' || signatureInfo.confirmationStatus === 'finalized'
      );

      // Update the oldest transaction found
      latestTransactiion = successfulSignatures[counter];

      let transactionDetail : ParsedTransactionWithMeta | null ;
      if(latestTransactiion){
         transactionDetail = await connection.getParsedTransaction(latestTransactiion.signature, {
          maxSupportedTransactionVersion: 0,
        });
        return transactionDetail;
      }
      return null; // If no transactions found, creation time cannot be determined
  
    } catch (error) {
      console.error("Error fetching account creation date:", error);
    }
  }

 
  export async function getTokenPrice(address: PublicKey, solanaprice: number, connection : Connection){
    // const publicKey = new PublicKey(address);
    let counter = 0;
    while(counter >= 0){
      // console.log("Counter: "+ counter);
      let transactionDetail  = await getLatestTransaction(address, counter, connection);
      // console.log(transactionDetail);
      if(transactionDetail){
        const postTokenBalances = transactionDetail.meta?.postTokenBalances || [];
        const preTokenBalances = transactionDetail.meta?.preTokenBalances || [];
        const postSolBalances = transactionDetail.meta?.postBalances || [];
        const preSolBalances = transactionDetail.meta?.preBalances || [];
        let preBalance = preTokenBalances.filter(bal => bal.mint === address.toBase58());
        let postBalance  = postTokenBalances.filter(bal => bal.mint === address.toBase58());
        // console.log("MeTA..................................");
        // console.log(preBalance)
        // console.log(postBalance)
        // let sortedPostBalance = postBalance.sort((a ,b) => { return a.accountIndex - b.accountIndex;});
        for(let i =0; i < preBalance.length; i++){
          // console.log("Counter: "+i);
          //sometimes token post and pre balance can be 0, so skip thos transaction
            try{
              // console.log("STAGE1............................ ");
              if(postBalance[i] === undefined || preBalance[i] === undefined){
                // console.log("Undefined............................ ");
                continue;
              }
              // console.log("STAGE2............................ ");
              if(postBalance[i]?.uiTokenAmount?.uiAmount && preBalance[i]?.uiTokenAmount?.uiAmount === 0){
                // console.log("SUB 0............................ ");
                continue;
              }else{
                // console.log("STAGE3............................ ");
                if(postBalance[i].uiTokenAmount.uiAmount && preBalance[i].uiTokenAmount.uiAmount){
                  let balance = Math.abs((postBalance[i]?.uiTokenAmount?.uiAmount ?? 0) - (preBalance[i]?.uiTokenAmount?.uiAmount ?? 0));
                  if(balance < 50000){
                    // console.log("Balance Less............................ ");
                    continue;
                  }
                  // console.log("STAGE4............................ ");

                    const solChange = Math.abs((postSolBalances[i] - preSolBalances[i]) / LAMPORTS_PER_SOL);
                    if(solChange < 0.10){
                      // console.log("SOL Change Less............................ ");
                      continue;
                    }
                    // console.log("STAGE5............................ ");
                    // console.log("METADATA")
                    // console.log(postBalance[i]);
                    // console.log(preBalance[i]);
                    // console.log(solChange)
                    // console.log(preSolBalances[i]);
                    // console.log(postSolBalances[i]);
                    // console.log(`Token Balance change: ${balance}`);
                    // console.log(`SOL change: ${solChange}`);
                    const token_price = (solChange/balance) * solanaprice;
                    // console.log('Coin Price ' +token_price);
                    // console.log(token_price.toFixed(7));
                    return Number(token_price.toFixed(7));
                  
                }
                }
              }
            catch(error){
                console.log(error)
            }
          }
        counter += 1;
      }else{
        counter += 1;
        continue;
      }
    }
    
  }


// const solanaConnection = Utils.getConnection();
// const address = "YyALuiqW3X4xYQFDv5ehFVqugfV7AFVVnJzwukbpump"
// const publicKey = new PublicKey(address);
// getTokenPrice(publicKey, 133, solanaConnection);