import ERC20_ABI from '../abi/ERC20.json';
import {JsonRpcProvider, Contract, InfuraProvider, parseEther, parseUnits} from 'ethers'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import {formatEther, formatUnits} from '@ethersproject/units'
import { ChainId } from '../types';

export async function getAmountInTokenDecimals(
  amount: number,
  decimals?: number,
  tokenAddress?: string,
  ChainId?: ChainId
) {
  if (!decimals && !tokenAddress) {
    throw new Error('Either decimals or tokenAddress must be provided');
  }

  if (!decimals && tokenAddress) {
    const provider = new InfuraProvider(ChainId);
    const token = new Contract(tokenAddress, ERC20_ABI, provider);
    decimals = await token.decimals();
  }

  const amountInWei = parseUnits(amount.toString(), decimals ?? 0);
  return amountInWei.toString();
}

export function getAmountInEtherDecimals(amount: number) {
  return parseEther(amount.toString()).toString();
}

export async function getAmountWithoutDecimals(
  amount: BigNumberish,
  decimals?: number,
  tokenAddress?: string,
  chainId?: ChainId
) {
  if (!decimals && !tokenAddress) {
    throw new Error('Either decimals or tokenAddress must be provided');
  }

  if (!decimals && tokenAddress) {
    const provider = new InfuraProvider(chainId);
    const token = new Contract(tokenAddress, ERC20_ABI, provider);
    decimals = await token.decimals();
  }

  return parseFloat(formatUnits(amount, decimals ?? 0));
}

export function getEtherWithoutDecimals(amount?: BigNumberish) {
  const ether = formatEther(amount || 0);
  return parseFloat(ether);
}

export function bigNumberToNumber(amount: BigNumberish) {
  return parseFloat(BigNumber.from(amount).toString());
}