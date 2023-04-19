import { ChainId } from '../types';
import { CoingeckoTokenInfoResponse } from '../types/coingeckoTypes';
import { COINGECKO_TOKEN_INFO_URLS } from './constants';

export default async function calculateFee(
  tokenAddress: string,
  chain: ChainId
) {
  const tokenPriceInNativeToken = await getTokenPriceToNativeToken(
    tokenAddress,
    chain
  );
  const fee = (0.45 / 100) * tokenPriceInNativeToken;
  return fee;
}

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

export async function getTokenPriceInUSD(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  const res = await fetch(
    COINGECKO_TOKEN_INFO_URLS[chain] + '/' + tokenAddress
  );
  const data = (await res.json()) as CoingeckoTokenInfoResponse;
  return data.market_data.current_price.usd;
}

export async function getTokenPriceInETH(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  const res = await fetch(
    COINGECKO_TOKEN_INFO_URLS[chain] + '/' + tokenAddress
  );
  const data = (await res.json()) as CoingeckoTokenInfoResponse;
  return data.market_data.current_price.eth;
}

export async function getTokenPriceInMatic(
  tokenAddress: string,
  chain: ChainId
): Promise<number> {
  const res = await fetch(
    COINGECKO_TOKEN_INFO_URLS[chain] + '/' + tokenAddress
  );
  const data = (await res.json()) as CoingeckoTokenInfoResponse;
  const tokenPriceInUSD = data.market_data.current_price.usd;
  const maticPriceInUSD = await fetchMaticPriceInUSD();
  return tokenPriceInUSD / maticPriceInUSD;
}

export async function fetchMaticPriceInUSD(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd'
  );
  const data = await res.json();
  return data['matic-network'].usd;
}
