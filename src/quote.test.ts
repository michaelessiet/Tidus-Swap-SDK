import { ethers } from 'ethers';
import { fillQuote, getQuote } from './quotes';
import { ChainId, Quote, SwapType } from './types';
import { ETH_ADDRESS, MATIC_ADDRESS, USDC_ADDRESS } from './utils/constants';
import { getAmountInTokenDecimals } from './utils/decimalAndWeiCalc';
import { Token } from './utils/token';

// async function main() {
//   const starttime = new Date().getTime();
//   const buyToken = new Token({
//     contractAddress: ETH_ADDRESS,
//     decimals: 18,
//   });
//   const sellToken = new Token({
//     contractAddress: USDC_ADDRESS,
//     decimals: 6,
//   });
//   const quote = await getQuote({
//     chainId: ChainId.mainnet,
//     fromAddress: '0xB576f4Fac19eA8935A4BAA4F7AD5bc566A5845b1',
//     buyToken,
//     sellToken,
//     sellAmount: await getAmountInTokenDecimals(100, sellToken.decimals, USDC_ADDRESS),
//     // sellAmount: '100000000',
//     swapType: SwapType.normal,
//   });
//   const stoptime = new Date().getTime();

//   console.log('Time: ', stoptime - starttime);
//   console.log('quote', quote);
//   console.log('Buy amount: ', (quote as Quote).formattedBuyAmount);
//   console.log('Sell amount: ', (quote as Quote).formattedSellAmount);
// }

// main();

async function mainPolygon() {
  const startTime = new Date().getTime()

  const wallet = ethers.Wallet.createRandom().connect(new ethers.providers.InfuraProvider())

  const buyToken = new Token({
    contractAddress: MATIC_ADDRESS,
    decimals: 18,
    chainId: 137
  })
  const sellToken = new Token({
    contractAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    chainId: 137
  })
  const quote = await getQuote({
    chainId: ChainId.polygon,
    buyToken: buyToken,
    sellToken,
    fromAddress: wallet.address,
    swapType: SwapType.normal,
    buyAmount: await getAmountInTokenDecimals(
      100,
      buyToken.decimals,
      buyToken.contractAddress,
      buyToken.chainId
    ),
  });


  const fill = await fillQuote(quote as Quote, {}, wallet, false, sellToken.chainId!)
  const stopTime = new Date().getTime()

  console.log('quote', quote);
  console.log('fill', fill)
  console.log(stopTime - startTime)
}

mainPolygon();
