
import { getQuote, fillQuote, getQuoteExecutionDetails } from '../quotes';
import { ChainId, Quote, SwapType } from '../types';
import { USDC_POLYGON_ADDRESS, MATIC_ADDRESS, TIDUS_ROUTER_CONTRACT_ADDRESS } from '../utils/constants';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { default as RainbowRouterABI } from '../abi/RainbowRouter.json';
import { default as ERC20ABI } from '../abi/ERC20.json';
import {
  getAmountInTokenDecimals,
} from '../utils/decimalAndWeiCalc';
import { BigNumberish } from '@ethersproject/bignumber';

async function main() {
  const provider = new JsonRpcProvider(`${process.env.ALCHEMY_API_URL}`, 'matic');
  const wallet = new Wallet(`${process.env.PRIVATE_KEY}`, provider);
  const starttime = new Date().getTime();
  const quote = await getQuote({
    chainId: ChainId.polygon,
    fromAddress: wallet.address,
    sellTokenAddress: MATIC_ADDRESS,
    buyTokenAddress: USDC_POLYGON_ADDRESS,
    sellAmount: await getAmountInTokenDecimals(.01, 18),
    slippage: 0.1,
    swapType: SwapType.normal,
  });
  const stoptime = new Date().getTime();

  console.log("Time: ", stoptime - starttime);
  console.log("Quote: ", quote as Quote);
  console.log("Buy amount: ", (quote as Quote).formattedBuyAmount);
  console.log("Sell amount: ", (quote as Quote).formattedSellAmount);

  const feeData = await provider.getFeeData();

  const { params, methodArgs } = getQuoteExecutionDetails(
    (quote as Quote),
    { 
      from: (quote as Quote).from, 
      gasPrice: feeData.gasPrice?.toString(),
    },
    provider
  );

  const contract = new Contract(
    TIDUS_ROUTER_CONTRACT_ADDRESS[ChainId.polygon],
    RainbowRouterABI,
    wallet
  );

  try {
    const estimatedGas = await contract.estimateGas.fillQuoteEthToToken(...methodArgs)
    console.log("ESTIMATED GAS TO SWAP: ", estimatedGas.toString());
  } catch (error) {
    const json = JSON.stringify(error);
    const obj = JSON.parse(json);
    const errData: string = obj.error.error;
    console.log(errData)
  }

  const swap = await fillQuote(
    quote as Quote,
    params,
    wallet,
    false,
    ChainId.polygon,
  );

  console.log(swap.hash);
}

main();