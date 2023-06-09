// import { getQuote, fillQuote, getQuoteExecutionDetails } from '../quotes';
// import { ChainId, Quote, SwapType } from '../types';
// import {
//   USDC_POLYGON_ADDRESS,
//   MATIC_ADDRESS,
//   TIDUS_ROUTER_CONTRACT_ADDRESS,
// } from '../utils/constants';
// import { Wallet } from '@ethersproject/wallet';
// import { JsonRpcProvider } from '@ethersproject/providers';
// import { Contract } from '@ethersproject/contracts';
// import { default as RainbowRouterABI } from '../abi/RainbowRouter.json';
// import { BigNumber } from '@ethersproject/bignumber';
// import { getAmountInTokenDecimals } from '../utils/decimalAndWeiCalc';

// async function main() {
//   const provider = new JsonRpcProvider(
//     `${process.env.ALCHEMY_API_URL}`,
//     'matic'
//   );
//   const wallet = new Wallet(
//     '0xc9a3c1476edad46cf418a6313e4442aa2212b4e195dd3b42d1562f7946dfd4e5',
//     provider
//   );
//   console.log('Wallet address: ', wallet.address);
//   const starttime = new Date().getTime();
//   const quote = await getQuote({
//     chainId: ChainId.polygon,
//     fromAddress: wallet.address,
//     sellTokenAddress: MATIC_ADDRESS,
//     buyTokenAddress: USDC_POLYGON_ADDRESS,
//     sellAmount: await getAmountInTokenDecimals(0.01, 18),
//     slippage: 0.1,
//     swapType: SwapType.normal,
//   });
//   const stoptime = new Date().getTime();

//   console.log('Time: ', stoptime - starttime);
//   console.log('Quote: ', quote as Quote);
//   console.log('Buy amount: ', (quote as Quote).formattedBuyAmount);
//   console.log('Sell amount: ', (quote as Quote).formattedSellAmount);

//   const { params, methodArgs } = getQuoteExecutionDetails(
//     quote as Quote,
//     { from: (quote as Quote).from },
//     provider
//   );

//   const contract = new Contract(
//     TIDUS_ROUTER_CONTRACT_ADDRESS[ChainId.polygon],
//     RainbowRouterABI,
//     wallet
//   );

//   let estimatedGas;
//   try {
//     estimatedGas = await contract.estimateGas.fillQuoteEthToToken(
//       ...methodArgs,
//       { from: wallet.address, value: params.value }
//     );
//     console.log('Estimated Gas to fill the quote: ', estimatedGas.toNumber());
//   } catch (error) {
//     const json = JSON.stringify(error);
//     console.log(error);
//     // const obj = JSON.parse(json);
//     // console.log("Error Body: ", obj.error.body);
//     // console.log("Error Data: ", obj.error.error);
//     estimatedGas = BigNumber.from(0);
//   }

//   const feeData = await provider.getFeeData();
//   const nonce = await wallet.getTransactionCount();

//   console.log(feeData.gasPrice?.toString())

//   console.log('VALUE:', params.value);
//   const swap = await fillQuote(
//     quote as Quote,
//     {
//       value: params.value,
//       gasLimit: estimatedGas.toString(),
//       // maxFeePerGas: feeData.maxFeePerGas?.toString(),
//       gasPrice: feeData.gasPrice?.toString(),
//       // maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
//       nonce: nonce.toString(),
//     },
//     wallet,
//     false,
//     ChainId.polygon
//   );

//   console.log(swap.data);
// }

// main();
