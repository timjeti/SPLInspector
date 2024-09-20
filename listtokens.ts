import { Connection, PublicKey, GetProgramAccountsFilter } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Metaplex } from '@metaplex-foundation/js';
import { getTokenPrice } from './transaction';
import { priceChecker } from './pricechecker';

let SOLANA_ADDR = "So11111111111111111111111111111111111111112";


/**
 * Interface representing token metadata.
 */
interface TokenMetaData {
  address : string,
  name : string,
  symbol: string,
  balance: number

}


/**
 * Fetches token accounts for a given wallet and filters out accounts with zero balance.
 * @param wallet - The wallet address to fetch token accounts for.
 * @param solanaConnection - The Solana connection instance.
 * @returns A promise that resolves to an array of token metadata.
 */
export async function getTokenAccounts(wallet: string, solanaprice : number, solanaConnection: Connection) {
  const filters:GetProgramAccountsFilter[] = [
      {
        dataSize: 165,    //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32,     //location of our query in the account (bytes)
          bytes: wallet,  //our search criteria, a base58 encoded string
        },            
      }];
  const accounts = await solanaConnection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, //new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {filters: filters}
  );
  
  console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);

  const tokenBucket : TokenMetaData[] = [];
  for (let i = 0; i < accounts.length; i++) {
      //Parse the account data
      //TODO: In future update this to get a top 5 tokens with highest value
        const account = accounts[i];
        const parsedAccountInfo:any = account.account.data;
        // console.log(parsedAccountInfo);
        const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        if(tokenBalance < 200){
          continue;
        }
        //Log results
        let mintAddressKey = new PublicKey(mintAddress);
        // console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
        // console.log(`--Token Mint: ${mintAddress}`);
        
        const tokenDetails = await getTokMetaData(solanaConnection, mintAddressKey);
        
        // console.log(`--Token Balance: ${tokenBalance}`);
        //getting token price does not work as there would be millions of transaction for some tokens
        //need to use an a paid rpc service for faster transactions
        // const tokenprice = await getTokenPrice(mintAddressKey, solanaprice, solanaConnection) ?? 0;
        // console.log("Token Price: "+ tokenprice);
        // console.log("Token balance: "+tokenBalance);
        const result : TokenMetaData = {
          address : mintAddress,
          name : tokenDetails[0],
          symbol : tokenDetails[1],
          balance : tokenBalance,
        }
        tokenBucket.push(result);
      
  };
  return tokenBucket
  .sort((a, b) => b.balance - a.balance)
  .slice(0, 3);;
}


export async function isHolderJeeter(wallet: string, holderPC : number, solanaConnection: Connection) {
  const filters:GetProgramAccountsFilter[] = [
      {
        dataSize: 165,    //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32,     //location of our query in the account (bytes)
          bytes: wallet,  //our search criteria, a base58 encoded string
        },            
      }];
  const accounts = await solanaConnection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, //new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {filters: filters}
  );
  
  // console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
  let degenCount = 0;

  if(accounts.length > 500 && holderPC < 1){
    return true;
  }

  // console.log("Analysing Holder Tokens, found tokens :" + accounts.length);
  let jeetrun = 0;
  for(let i = 0; i < accounts.length; i++) {
      //Parse the account data
      //TODO: In future update this to get a top 5 tokens with highest value
        const account = accounts[i];
        const parsedAccountInfo:any = account.account.data;
        // console.log(parsedAccountInfo);
        const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        if(!tokenBalance || tokenBalance < 5000){
          continue;
        }
        //Log results
        // console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
        // console.log(`--Token Mint: ${mintAddress}`);
        degenCount += 1;
        if(degenCount > 2){
          return false;
        }
        // jeetrun += 1;
  };
  return true;
}


/**
 * Retrieves metadata for a token using its mint address.
 * @param solanaConnection - The Solana connection instance.
 * @param mintAddressKey - The mint address of the token.
 * @returns A promise that resolves to an object containing the token's name and symbol.
 */
async function getTokMetaData(solanaConnection : Connection, mintAddressKey : PublicKey){

  const metaplex = Metaplex.make(solanaConnection);

  
  // let tokenLogo;
  const coreres : string[] | undefined = [];

  const metadaAccount = metaplex.nfts().pdas().metadata({mint : mintAddressKey});

  const metadataAccountInfo = await solanaConnection.getAccountInfo(metadaAccount);

  if(metadataAccountInfo){
    const token = await metaplex.nfts().findByMint({ mintAddress : mintAddressKey});
    const tokenName: string | undefined = token.name;
    const tokenSymbol: string | undefined  = token.symbol;
    // console.log(`--TokenName : ${tokenName}`);
    // console.log(`--TokenSymbol : ${tokenSymbol}`);
    
    coreres[0] = tokenName ?? "DEFAULT";
    coreres[1] = tokenSymbol ?? "DEFAULT";
    return coreres;
  }
  return coreres;
  
}