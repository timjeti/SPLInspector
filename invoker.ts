import { Utils } from './utils'
import { getTokenAccounts } from './listtokens'
import { TokenService } from './listwallets';
// import { priceChecker } from './pricechecker';

let SOLANA_ADDR = "So11111111111111111111111111111111111111112";


const solanaConnection = Utils.getConnection();

const WALLET_ADDRESS = "ABNXCS8JFYh2L5FuiLtHTktmcnArrJTbWvCiBCujgG";

const tokenMintAddress = "52fsjGHBDbGNYKbsenRTnaDNf8Ug6Ga2BiCi4B5wpump";
const fileName = "dyod.txt"
const MAX_WALLET_COUNT : number = 5;

const bulktAddress = ["F6k8tQ6x4XkUVo8Qh642CsNsQW182skcroH48hfMpump",
                      "AFivsHqtajxcbQmyuZ7TQymx1ypSs6S74dLEY4BGRxXf",
                      "5Ke381D44MEQg3BQarWhAwhj1xbdNvXe2KHkTiZzw7r5",
                      "EnF58efttWMJdvcueNVTsthsek8WycZbGwnvjqErpump",
                      "Bqcmjz2Mrr7pEVjZccZpt2tLHcUoXeYMdu9AcUHtpump",
                      "D2LfaZsu4f8vdW1ZbKNPNq6MM3v5Rw9PU39cXoVspump",
                      "3PC3YS5QatuoFKdY2wqWLSiRj4bdZEr5TtjxWtqZpump"];

async function main(){

    try {
        // let solanaprice = await priceChecker(SOLANA_ADDR);
        // console.log("solana price: "+ solanaprice);

        // const acntdate = await TokenService.getAccountCreationDate(WALLET_ADDRESS, solanaConnection);
        // console.log(acntdate);
        // const tokens = await getTokenAccounts(WALLET_ADDRESS, solanaConnection);
        // console.log(tokens);
        // fetchPrices(tokenMintAddress);
        // const holderCount = await TokenService.getTotalHolderCount(tokenMintAddress, solanaConnection);
        // console.log(`Holder Count for the token ${holderCount}`);
        // const topHolders = await TokenService.getTopHoldersByPercentage(tokenMintAddress, MAX_WALLET_COUNT, solanaConnection);
        // // console.log("Top 10 Holders by Percentage:", topHolders);
        // topHolders.forEach((holder, idx) => {
        //     console.log(`Holder Number ${idx}`);
        //     console.log(holder);
        // })

        

        //GET PERCENTAGE HOLD BY JEETS
        // const jeetStats = await TokenService.getJeeterPercentages(tokenMintAddress, solanaConnection);

        //WORKS: GET PERCENTAGE HOLD BY FRESHLY CREATED WALLETS
        // const newHolderStats = await TokenService.getNewlyCreatedWalletsPercentage(tokenMintAddress, solanaConnection);

        // TokenService.getAllHolders(tokenMintAddress, fileName, solanaConnection);
        // TokenService.getAllHoldersBulk(bulktAddress, solanaConnection);
        TokenService.getHolderHolderTransactionInfo("ABCD", solanaConnection);
        // console.log(allHolderStats)

        //Get holder stats
        // const holderStats = await TokenService.getHolderStats(tokenMintAddress, solanaConnection);
        // console.log(`Holder Stats for the token: `);
        // console.log(JSON.stringify(holderStats, null, 2));
        // console.log("DIVIDER........................................")
        // let i : number = 0;
        // let buffer = 0
        // for(i = 0; i < 3 + buffer; i++){
        //     const holder = topHolders[i];
        //     if(!holder){
        //         buffer+=1;
        //         continue;
        //     }
        //     console.log(`Fetching Data for Holder ${i+1}`)
        //     console.log(JSON.stringify(holder, null, 2))
        //     // console.log(holder);
        //     const holderAddr = holder['holderAddress'];
        //     const tokens = await getTokenAccounts(holderAddr, 134, solanaConnection);
        //     console.log(tokens);
        // };
        } catch (error) {
            console.error("Error fetching top holders by percentage:", error);
        }
    }
  main();



//PROJECT STATUS
//api to get token creation date
//--> this par is done bet api is slow for older tokens
//api to get holders in a token
//-->completed
//api to get holder count of a token
//-->completed
//api to get top 3 investments/tokens of a holder
//--> most of the work is done but to fetch 3 investments and its exact dollar amount is not working, might have to use 3rd party to fetch token price
//api to check if a wallet is newly created and tokens present is only 2, 
//--> this is done using getJeeterPercentages, little bit slow at times
//we want to get the percentage of such wallets, which were newly created, similar to creation time of tokens
//--> thsi is done as part of getNewlyCreatedWalletsPercentage but it is also little slow at times
//api to check if the what percenatge of tokens were airdropped
//TODO
//api to check if whales, fish and shark percentage in a token
//--> done in getHolderStats api
