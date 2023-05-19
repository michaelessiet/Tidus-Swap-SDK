import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import axios from 'axios';
import { ChainId } from '../types';
import { CoingeckoTokenInfoResponse } from '../types/coingeckoTypes';
import { COINGECKO_TOKEN_INFO_URLS } from './constants';
import {ethers} from 'ethers';

/**
 * Calculates the fee for a given token and amount
 * @param tokenAddress
 * @param chain
 * @param amount
 * @returns
 */
export default async function calculateFee(
  tokenAddress: string,
  chain: ChainId,
  amount: number
) {
  const tokenPriceInNativeToken = await getTokenPriceToNativeToken(
    tokenAddress,
    chain
  );
  const tokenValueInNativeToken = tokenPriceInNativeToken * amount;
  const fee = (0.45 / 100) * tokenValueInNativeToken;
  return fee;
}

/**
 * Calculates the fee for a given token and amount using decimal values
 * @param tokenAddress
 * @param chain
 * @param amount
 */
export async function calculateFeeWithDecimals(
  tokenAddress: string,
  chain: ChainId,
  amount: BigNumberish,
  decimalsOfToken: number,
  amountInEth?: BigNumberish
) {
  try {
    const removeDecimals = BigNumber.from(amount)
      .div(BigNumber.from(10).pow(decimalsOfToken))
      .toNumber();
    let tokenValueInNativeToken;

    if (!amountInEth) {
      tokenValueInNativeToken = await getTokenPriceToNativeToken(
        tokenAddress,
        chain
      );
      tokenValueInNativeToken = tokenValueInNativeToken * removeDecimals;
    } else {
      tokenValueInNativeToken = parseFloat(ethers.utils.formatEther(amountInEth.toString()));
    }

    const fee = (0.45 / 100) * tokenValueInNativeToken;
    const feeInWei = ethers.utils.formatUnits(ethers.utils.parseEther(fee.toFixed(8)), 'wei');
    return feeInWei;
  } catch (error) {
    throw new Error('calculateFeeWithDecimals Error: ' + error);
  }
}

/**
 * gets the price of a token in the native token of the chain
 * @param tokenAddress
 * @param chain
 * @returns
 */
export async function getTokenPriceToNativeToken(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  switch (chain) {
    case ChainId.mainnet:
      return await getTokenPriceInETH(tokenAddress, chain);
    case ChainId.polygon:
      return await getTokenPriceInMatic(tokenAddress, chain);
    default:
      throw new Error('Unsupported chain');
  }
}

/**
 * gets the price of a token in USD
 * @param tokenAddress
 * @param chain
 * @returns
 */
export async function getTokenPriceInUSD(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  try {
    const res = await axios.get(
      COINGECKO_TOKEN_INFO_URLS[chain] + '/' + tokenAddress
    );
    const data = res.data as CoingeckoTokenInfoResponse;
    return data.market_data.current_price.usd;
  } catch (error) {
    throw new Error('Error fetching token price for fee calculation');
  }
}

/**
 * gets the price of a token in ETH
 * @param tokenAddress
 * @param chain
 * @returns
 */
export async function getTokenPriceInETH(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  try {
    const res = await axios.get(
      COINGECKO_TOKEN_INFO_URLS[chain] + '/' + tokenAddress
    );
    const data = res.data as CoingeckoTokenInfoResponse;
    return data.market_data.current_price.eth;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching token price in ETH for fee calculation');
  }
}

/**
 * gets the price of a token in Matic
 * @param tokenAddress
 * @param chain
 * @returns
 */
export async function getTokenPriceInMatic(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  try {
    const res = await axios.get(
      COINGECKO_TOKEN_INFO_URLS[chain] + '/' + tokenAddress
    );
    const data = res.data as CoingeckoTokenInfoResponse;
    const tokenPriceInUSD = data.market_data.current_price.usd;
    const maticPriceInUSD = await fetchMaticPriceInUSD();
    return tokenPriceInUSD / maticPriceInUSD;
  } catch (error) {
    throw new Error('Error fetching token price in Matic for fee calculation');
  }
}

/**
 * gets the price of Matic in USD
 * @returns
 */
export async function fetchMaticPriceInUSD(): Promise<number> {
  try {
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd'
    );
    const data = res.data;
    return data['matic-network'].usd;
  } catch (error) {
    throw new Error('Error fetching Matic price in USD for fee calculation');
  }
}
