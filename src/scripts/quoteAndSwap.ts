
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

  const { params, methodArgs } = getQuoteExecutionDetails(
    (quote as Quote),
    { from: (quote as Quote).from },      
    provider
  );

  const contract = new Contract(
    TIDUS_ROUTER_CONTRACT_ADDRESS[ChainId.polygon],
    RainbowRouterABI,
    wallet
  );

  // Set an allowance for the "to" address to sell the sellToken
  const matic = new Contract(
    MATIC_ADDRESS[ChainId.polygon],
    ERC20ABI,
    wallet
  );

  function isApproved(amount: BigNumberish): boolean {
    const allowance = matic.allowance(wallet.address, TIDUS_ROUTER_CONTRACT_ADDRESS[ChainId.polygon]);
    if (allowance >= amount) {
      return true;
    } else {
      return false;
    }
  }

  if (!isApproved((quote as Quote).sellAmount)) {
    const setAllowance = await matic.approve(
      (quote as Quote).to,
      (quote as Quote).sellAmount
    );
      setAllowance.wait();
  }


  try {
    const estimatedGas = await contract.estimateGas.fillQuoteEthToToken(...methodArgs)
  } catch (error) {
    const json = JSON.stringify(error);
    const obj = JSON.parse(json);
    const errData: string = obj.error.error;
    console.log(errData)

  }

  // console.log(estimatedGas)
  
  // const swap = await fillQuote(
  //   quote as Quote,
  //   params,
  //   wallet,
  //   false,
  //   ChainId.polygon,
  // );

  // console.log(swap.data);
}

main();