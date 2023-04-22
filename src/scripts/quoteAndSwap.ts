
import { getQuote, fillQuote } from '../quotes';
import { ChainId, Quote, SwapType } from '../types';
import { USDC_POLYGON_ADDRESS, MATIC_ADDRESS } from '../utils/constants';
import { ethers } from 'ethers';
import {
  getAmountInTokenDecimals,
} from '../utils/decimalAndWeiCalc';

async function main() {
  const provider = ethers.getDefaultProvider(ChainId.polygon);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string);
  const starttime = new Date().getTime();
  const quote = await getQuote({
    chainId: ChainId.polygon,
    fromAddress: '0x246913F9b282208E8377E0251900bd3942B35c1c',
    buyTokenAddress: USDC_POLYGON_ADDRESS,
    sellTokenAddress: MATIC_ADDRESS,
    slippage: 0.1,
    sellAmount: await getAmountInTokenDecimals(.1, 18),
    swapType: SwapType.normal,
  });
  const stoptime = new Date().getTime();

  console.log("Time: ", stoptime - starttime);
  console.log('quote', quote);
  console.log("Buy amount: ", (quote as Quote).formattedBuyAmount);
  console.log("Sell amount: ", (quote as Quote).formattedSellAmount);
  
  const swap = await fillQuote(
    quote as Quote,
    {
      value: 1
    },
    wallet,
    true,
    ChainId.polygon,

  );

}
