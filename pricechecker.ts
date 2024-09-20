import Moralis from "moralis";
import { SolNetwork } from "@moralisweb3/common-sol-utils";

//ADD MORALIS API KEY HERE
const MORALIS_API_KEY = "";

//NOTE
//This api does not work if used more than once in the same function flow
export const priceChecker = async (address : string) : Promise<number>=> {
  await Moralis.start({
    apiKey: MORALIS_API_KEY,
    // ...and any other configuration
  });

//   const address = "CutVKJemZYGLfqiKTY1EwFmd7kA4ndWgLcYABS65pump";

  const network = SolNetwork.MAINNET;

  const response = await Moralis.SolApi.token.getTokenPrice({
    address,
    network,
  });

    //   console.log(response.toJSON()['usdPrice']);
    const price : number= response.toJSON()['usdPrice'] ?? -1;
    console.log(price);
    return price;
};

// priceChecker("CutVKJemZYGLfqiKTY1EwFmd7kA4ndWgLcYABS65pump");