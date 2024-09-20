import { Connection, PublicKey, GetProgramAccountsFilter, ConfirmedSignatureInfo, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { priceChecker } from './pricechecker';
import { Utils } from './utils';
import { isHolderJeeter } from './listtokens';
import * as fs from 'fs';
import * as path from 'path';

    // Define the Solana Token Program ID (this is constant)
    // const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

    interface TokenHolder {
        holderAddress: string;
        tokenBalance: number;
        percentageHeld: number;
    }

    interface TokenHolderStats {
      fish: number;
      shark: number;
      whale: number;
  }
    
  /**
   * Utility class for interacting with the Solana blockchain.
   */
  export class TokenService {
    /**
     * Get the top 10 holders of a specific token by percentage of total supply held.
     * @param tokenMintAddress - The mint address (contract address) of the token.
     * @param solanaConnection - Solana connection instance.
     * @returns A list of top 10 holders with their balances and percentages held.
     */
    static async getTopHoldersByPercentage(tokenMintAddress: string, limit :number = 10, solanaConnection: Connection): Promise<TokenHolder[]> {
      
      let tokenPrice : any =  await priceChecker(tokenMintAddress);
      // Calculate total supply by summing all token balances
      const accounts = await this.getHolders(tokenMintAddress, solanaConnection);
      let totalSupplyPromise = await solanaConnection.getTokenSupply(new PublicKey(tokenMintAddress));
      let totalSupply = Number(totalSupplyPromise.value.uiAmount);
      const holders = accounts.map(account => {
        const parsedAccountInfo: any = account.account.data;
        // console.log(parsedAccountInfo)
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"] || 0;
        if(tokenBalance === 0){
          return null;
        }
        const percent = Number(((tokenBalance / totalSupply) * 100).toFixed(2));
        // totalSupply += tokenBalance;
        const tokenAmount = tokenBalance * tokenPrice;
        return {
          holderAddress: parsedAccountInfo["parsed"]["info"]["owner"],
          tokenBalance,
          amount : tokenAmount.toFixed(2) + '$',
          percentageHeld: percent, // Placeholder for now, will be calculated later
        };
      }).filter(holder => holder !== null);
  
      // Calculate the percentage of total supply held by each holder
      // holders.forEach(holder => {
      //   holder.percentageHeld = Number(((holder.tokenBalance / totalSupply) * 100).toFixed(2));
      // });
  
      // Sort the holders by percentage held in descending order
      holders.sort((a, b) => b.percentageHeld - a.percentageHeld);
  
      // Return the top 10 holders by percentage held
      return holders.slice(1, limit+1);
    }


    static async getTotalHolderCount(tokenMintAddress: string, solanaConnection: Connection) {
      const accounts = await this.getHolders(tokenMintAddress, solanaConnection);
      let holdercount = 0;
      const holders = accounts.map(account => {
        const parsedAccountInfo: any = account.account.data;
        // console.log(parsedAccountInfo)
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"] || 0;
        if(tokenBalance != 0){
          holdercount+=1;
        }
      });
      return holdercount;
    }

    static async getHolderStats(tokenMintAddress: string, solanaConnection: Connection) : Promise<TokenHolderStats> {
      const accounts = await this.getHolders(tokenMintAddress, solanaConnection);
      let holdercount = 0;
      let fishCntr = 0;
      let sharkCtr = 0;
      let whaleCtr = 0;
      let tokenPrice : any =  await priceChecker(tokenMintAddress);
      const holders = accounts.map(account => {
        const parsedAccountInfo: any = account.account.data;
        // console.log(parsedAccountInfo)
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"] || 0;
        if(tokenBalance != 0){
          holdercount+=1;
          const tokenAmount = tokenBalance * tokenPrice;
          if(tokenAmount < 100){
            fishCntr += 1;
          }else if(tokenAmount >= 100 && tokenAmount < 1000){
            sharkCtr += 1;
          }else{
            whaleCtr += 1;
          }
        }
        // const percent = Number(((tokenBalance / totalSupply) * 100).toFixed(2));
        // totalSupply += tokenBalance;
      });
      console.log("Total holders:" + holdercount);
      const fishPer = Number(((fishCntr/holdercount) * 100).toFixed(2));
      const shrkPer = Number(((sharkCtr/holdercount) * 100).toFixed(2));
      const whlPer = Number(((whaleCtr/holdercount) * 100).toFixed(2));


      return {
          fish : fishPer,
          shark : shrkPer,
          whale : whlPer
      }
    }

    static async getHolders(tokenMintAddress: string, solanaConnection: Connection) {

        const filters: GetProgramAccountsFilter[] = [
            {
              dataSize: 165, // Token account size in bytes
            },
            {
              memcmp: {
                offset: 0, // Start of the account data
                bytes: tokenMintAddress, // The token mint address (contract address)
              },
            },
          ];
      
          // Fetch all token accounts for the given token mint address
          const accounts = await solanaConnection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, { filters });
          

          return accounts;
    }

    //To get the account creation data and time for token/wallet
    static async  getAccountCreationDate(address: string, connection : Connection): Promise<Date | null> {
        const publicKey = new PublicKey(address);
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
          let oldestTransaction: ConfirmedSignatureInfo | undefined = undefined;
          let before: string | undefined = undefined;

          while (true) {
            const signatures = await connection.getSignaturesForAddress(publicKey, { before, limit: 1000 });
            
            // Stop if there are no more transactions
            if (signatures.length === 0) {
              break;
            }

            // Update the oldest transaction found
            oldestTransaction = signatures[signatures.length - 1];

            // Move to the next batch by setting `before` to the last signature
            before = oldestTransaction.signature;
          }

          if(oldestTransaction){
            const transactionDetail = await connection.getParsedTransaction(oldestTransaction.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (transactionDetail) {
              // console.log(transactionDetail)
            // Return the creation time of the first transaction
              return Utils.formatTimestampToUTC(transactionDetail.blockTime);
            }
          }
          return null; // If no transactions found, creation time cannot be determined
      
        } catch (error) {
          console.error("Error fetching account creation date:", error);
          return null;
        }
    }
    
    //TODO: this api is slow, need to optimize it, specially when number of transactions are high
    static async isNewlyCreatedWallet(walletAddress : string, tokenCreationDate : Date, solanaConnection : Connection){
        const walletCreationDate = await this.getAccountCreationDate(walletAddress, solanaConnection);
        // console.log("Wallet Creation Date .........."+ walletCreationDate);
        // const walletcreationtime : Date | = walletCreationDate.getTime();
        if(walletCreationDate){
          const diffInMilliseconds = Math.abs(tokenCreationDate.getTime() - walletCreationDate.getTime());
          //this would be the bonding curve wallet address
          if(diffInMilliseconds === 0){
            return false;
          }
          const diffInSeconds = diffInMilliseconds / 1000;
          // console.log("Difference in Seconds .........."+ diffInSeconds);
          if(diffInSeconds < 10800){
            return true;
          }
        }
        return false;
    }

    //Get the percentage of wallets that were created just few hours before or after the coin creation
    //Note: this will not work with older coins as it will not be able to find token creation date
    //because of millions of transaction happening in blockchain
    static async getNewlyCreatedWalletsPercentage(tokenMintAddress: string, solanaConnection : Connection){
      
      const holders = await this.getHolders(tokenMintAddress, solanaConnection);
      console.log("Token Holders Count..."+ holders.length);
      let totalSupplyPromise = await solanaConnection.getTokenSupply(new PublicKey(tokenMintAddress));
      let totalSupply = Number(totalSupplyPromise.value.uiAmount);
      console.log("Token Supply..."+ totalSupply);
      let tokenCreationDate = await this.getAccountCreationDate(tokenMintAddress, solanaConnection);
      console.log("Token Creation Date..."+ tokenCreationDate);
      let newHolderCount = 0;
      let newHolderSupply = 0;
      for(let i = 0; i < holders.length; i++){
        const holder = holders[i];
        const parsedAccountInfo: any = holder.account.data;
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"] || 0;
        if(tokenBalance < 1000){
          continue;
        }
        // const percent = Number(((tokenBalance / totalSupply) * 100).toFixed(2));
        const holderAddress = parsedAccountInfo["parsed"]["info"]["owner"]
        // console.log("................................................................................................");
        // console.log("................................................................................................");
        // console.log("Checking info of holder....."+ holderAddress);
        let isNew : boolean = false;
        if(tokenCreationDate){
          //TODO: this api is slow, need to optimize it
          const isNew : boolean =  await this.isNewlyCreatedWallet(holderAddress, tokenCreationDate, solanaConnection);
          if(isNew){
            newHolderCount +=1;
            newHolderSupply += tokenBalance;
            const ruggerPC = Number(((tokenBalance/ totalSupply) * 100).toFixed(2))
            console.log("..................................................................................................");
            console.log("..................................................................................................");
            console.log("RUGGER COUNT:" + newHolderCount+ " ADDRESS: "+ holderAddress + ": BALANCE: "+ tokenBalance + ": PERCENTAGE "+ ruggerPC); 
          }
        }
        
        
      }
      const holderPercentage = (newHolderCount/holders.length) * 100;
      const newholderBalance = (newHolderSupply/totalSupply)* 100;
      console.log("..................................................................................................");
      console.log("NEWHOLDER PERCENTAGE: "+ holderPercentage+ "..NEWHOLDER SHARE: "+ newholderBalance);
    }


    static async getJeeterPercentages(tokenMintAddress: string, solanaConnection : Connection){
      const holders = await this.getHolders(tokenMintAddress, solanaConnection);
      console.log("Token Holders Count..."+ holders.length);
      let totalSupplyPromise = await solanaConnection.getTokenSupply(new PublicKey(tokenMintAddress));
      let totalSupply = Number(totalSupplyPromise.value.uiAmount);
      // let tokenCreationDate = await this.getAccountCreationDate(tokenMintAddress, solanaConnection);
      console.log("Token Supply..."+ totalSupply);
      // let tokenCreationDate = await this.getAccountCreationDate(tokenMintAddress, solanaConnection);
      // console.log("Token Creation Date..."+ tokenCreationDate);
      let jeeterCount = 0;
      let jeeterSupply = 0;
      let suspectedRadiumAcnt = 0;
      for(let i = 0; i < holders.length; i++){
        const holder = holders[i];
        const parsedAccountInfo: any = holder.account.data;
        // console.log(parsedAccountInfo)
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"] || 0;
        if(tokenBalance < 100){
          continue;
        }
        // const percent = Number(((tokenBalance / totalSupply) * 100).toFixed(2));
        // totalSupply += tokenBalance;
        // const tokenAmount = tokenBalance;
        const holderAddress = parsedAccountInfo["parsed"]["info"]["owner"];

        // console.log("Analysing Holder: "+holderAddress);

        const holderPC = Number(((tokenBalance/totalSupply)* 100).toFixed(2));
        let isJeeter =  false;
        //TODO: this below api is slow at times, need to optimize it
        isJeeter = await isHolderJeeter(holderAddress, holderPC,solanaConnection);
        if(isJeeter){
          // if(tokenCreationDate){
          //   console.log("Checking if holder is new");
          //   const isNewWallet = await this.isNewlyCreatedWallet(holderAddress,tokenCreationDate, solanaConnection );
          //   if(!isNewWallet){
          //     continue;
          //   }
          // }
          
          console.log("..................................................................................................");
          console.log("..................................................................................................");
          
          jeeterCount += 1;
          jeeterSupply += tokenBalance;
          if(suspectedRadiumAcnt < tokenBalance){
            suspectedRadiumAcnt = tokenBalance;
          }
          
          console.log("FOUND JEETER WALLET: "+ holderAddress+ "..JEETER SUPPLY PC: "+ holderPC);
        }
        // Utils.delay(1000);
      }

      jeeterCount = jeeterCount - 1;
      jeeterSupply = jeeterSupply - suspectedRadiumAcnt;
      const jeeterPercentage = Number(((jeeterCount/holders.length) * 100).toFixed(2));
      const jeeterBalance = Number(((jeeterSupply/totalSupply)* 100).toFixed(2));
      console.log("TOTAL JEETER PERCENTAGE: "+ jeeterPercentage+ "..TOTAL JEETER SUPPLY: "+ jeeterBalance);

    }

    static async getAllHolders(tokenMintAddress: string, fileName: string, solanaConnection: Connection) {
      
      // let tokenPrice : any =  await priceChecker(tokenMintAddress);
      // Calculate total supply by summing all token balances
      const folderName = 'wallets';
      const filePath = path.join(folderName, fileName+ ".txt");

      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName); // Create the 'hello' folder
        console.log(`Folder "${folderName}" created`);
      }

      const accounts = await this.getHolders(tokenMintAddress, solanaConnection);
      console.log("Holder Count: " + accounts.length);
      fs.writeFileSync(filePath, '', 'utf8');
      // let totalSupplyPromise = await solanaConnection.getTokenSupply(new PublicKey(tokenMintAddress));
      // let totalSupply = Number(totalSupplyPromise.value.uiAmount);
      const holders = accounts.map(account => {
        const parsedAccountInfo: any = account.account.data;
        // console.log(parsedAccountInfo)
        // const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"] || 0;
        // if(tokenBalance === 0){
        //   return null;
        // }
        // const percent = Number(((tokenBalance / totalSupply) * 100).toFixed(2));
        // totalSupply += tokenBalance;
        // const tokenAmount = tokenBalance * tokenPrice;
        const holder = parsedAccountInfo["parsed"]["info"]["owner"];
        fs.appendFileSync(filePath, holder + '\n', 'utf8');
        // return {
        //   holderAddress: parsedAccountInfo["parsed"]["info"]["owner"],
        //   tokenBalance,
        //   amount : tokenAmount.toFixed(2) + '$',
        //   percentageHeld: percent, // Placeholder for now, will be calculated later
        // };
      });
  
      // Calculate the percentage of total supply held by each holder
      // holders.forEach(holder => {
      //   holder.percentageHeld = Number(((holder.tokenBalance / totalSupply) * 100).toFixed(2));
      // });
  
      // Sort the holders by percentage held in descending order
      // holders.sort((a, b) => b.percentageHeld - a.percentageHeld);
  
      // Return the top 10 holders by percentage held
      // return holders;
    }

    static async getAllHoldersBulk(tokenMintAddresses : string[], solanaConnection: Connection){

      tokenMintAddresses.map((address) => {

        this.getAllHolders(address, address, solanaConnection);

      });

    }

    static async getHolderHolderTransactionInfo(address : string, connection : Connection){
      const publicKey = new PublicKey(address);
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
        let oldestTransaction: ConfirmedSignatureInfo;
        let before: string | undefined = undefined;
        let isFirstTransaction = false;
        while (!isFirstTransaction) {
          const signatures = await connection.getSignaturesForAddress(publicKey, { before, limit: 1000 });
          
          // Stop if there are no more transactions
          if (signatures.length === 0) {
            break;
          }
          let counter = 0;
          let buycounter = 0;
          let sellcounter = 0;
          let totalbuys : number[] = [];
          let totalsells : number[]= [];
          let solbuys : number[] = [];
          let solsells : number[] = [];
          for (const signatureInfo of signatures) {
            counter +=1;
            // console.log(counter);
            const transaction = await connection.getParsedTransaction(signatureInfo.signature, {
              maxSupportedTransactionVersion: 0,
            });
            if(transaction?.meta?.postTokenBalances && transaction.meta.preTokenBalances){
              let preBalances = transaction.meta.preTokenBalances || []
              let postBalances = transaction.meta.postTokenBalances || []
              preBalances = transaction.meta.preTokenBalances.filter(bal => bal.owner === address && bal.mint === "E92wueKMJ8EP4MBL9snkC4SVLXHDWoBwvyRcfT1Y31AE");
              postBalances = transaction.meta.postTokenBalances.filter(bal => bal.owner === address && bal.mint === "E92wueKMJ8EP4MBL9snkC4SVLXHDWoBwvyRcfT1Y31AE");
              if(preBalances.length == 0 && postBalances.length == 0){
                continue;
              }
              // console.log("Balances.,,,,")
              // console.log(preBalances)
              // console.log(postBalances)
              let preSolBalance = transaction.meta?.preBalances || [];
              let postSolBalance = transaction.meta?.postBalances || [];
              preSolBalance = preSolBalance.map((lamports) => lamports / LAMPORTS_PER_SOL);
              postSolBalance = postSolBalance.map((lamports) => lamports / LAMPORTS_PER_SOL);
              // console.log("SOL Balances.,,,,")
              // console.log(preSolBalance)
              // console.log(postSolBalance)

              let preTokenAmnt = 0;
              let postTokenAmnt = 0;
              let tokenAmount = 0;
              //BUY SCENARION
              if(preBalances.length === 0) {
                //buying for first time
                if(postBalances[0].uiTokenAmount.uiAmount ?? 0> 0){
                  totalbuys[buycounter] = postBalances[0].uiTokenAmount.uiAmount ?? 0;
                  solbuys[buycounter] = preSolBalance[0] - postSolBalance[0];
                  buycounter += 1;
                  isFirstTransaction = true;
                  break;
                }
              }else{
                //buying for additional times
                if(preBalances[0].uiTokenAmount.uiAmount!= null){

                  //if its a buy case
                  if(postBalances[0].uiTokenAmount.uiAmount ?? 0>  (preBalances[0].uiTokenAmount.uiAmount ?? 0)){
                    totalbuys[buycounter] = (postBalances[0].uiTokenAmount.uiAmount ?? 0) - preBalances[0].uiTokenAmount.uiAmount ?? 0;
                    solbuys[buycounter] = preSolBalance[0] - postSolBalance[0];
                    buycounter += 1;
                  }else{
                    //if its a sell case
                    totalsells[sellcounter] = (preBalances[0].uiTokenAmount.uiAmount ?? 0) - (postBalances[0].uiTokenAmount.uiAmount ?? 0);
                    const solbal : number =  postSolBalance[0] - preSolBalance[0];
                    // console.log(`${preSolBalance[0]} : ${postSolBalance[0]} = ${solbal}`);                                                                                    
                    solsells[sellcounter] = solbal;
                    sellcounter += 1;
                  }

                }

              }

            }
          }
          console.log("buy:")
          totalbuys.forEach((buy) => console.log(buy));
          console.log("sol buy:")
          solbuys.forEach((buy) => console.log(buy));
          console.log("sell:")
          totalsells.forEach((sell) => console.log(sell));
          console.log("sol sell:")
          solsells.forEach((sell) => console.log(sell));

          // Update the oldest transaction found
          oldestTransaction = signatures[signatures.length - 1];

          // Move to the next batch by setting `before` to the last signature
          before = oldestTransaction.signature;
        }
    
      } catch (error) {
        console.error("Error fetching account creation date:", error);
        return null;
      }
  }
    



  }

