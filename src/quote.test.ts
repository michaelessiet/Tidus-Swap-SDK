import { getQuote } from './quotes';
import { ChainId, Quote, SwapType } from './types';
import { ETH_ADDRESS, USDC_ADDRESS } from './utils/constants';
import {
  getAmountInTokenDecimals,
  getAmountWithoutDecimals,
  getEtherWithoutDecimals,
} from './utils/decimalAndWeiCalc';

async function main() {
  const starttime = new Date().getTime();
  const quote = await getQuote({
    chainId: ChainId.mainnet,
    fromAddress: '0xB576f4Fac19eA8935A4BAA4F7AD5bc566A5845b1',
    buyTokenAddress: ETH_ADDRESS,
    sellTokenAddress: USDC_ADDRESS,
    slippage: 0.01,
    sellAmount: await getAmountInTokenDecimals(100, undefined, USDC_ADDRESS),
    swapType: SwapType.normal,
  });
  const stoptime = new Date().getTime();

  console.log("Time: ", stoptime - starttime);
  console.log('quote', quote);
  console.log("Buy amount: ", (quote as Quote).formattedBuyAmount)
  console.log("Sell amount: ", (quote as Quote).formattedSellAmount)
}

main();
