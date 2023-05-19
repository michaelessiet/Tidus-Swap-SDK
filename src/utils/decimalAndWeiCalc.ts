import ERC20_ABI from '../abi/ERC20.json';
import {
  Contract,
  ethers
} from 'ethers';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatEther, formatUnits } from '@ethersproject/units';
import { ChainId } from '../types';

export async function getAmountInTokenDecimals(
  amount: number,
  decimals?: number,
  tokenAddress?: string,
  ChainId?: ChainId
) {
  try {
    if (!decimals && !tokenAddress) {
      throw new Error('Either decimals or tokenAddress must be provided');
    }

    if (!decimals && tokenAddress) {
      const provider = new ethers.providers.InfuraProvider(ChainId);
      const token = new Contract(tokenAddress, ERC20_ABI, provider);
      decimals = await token.decimals();
    }

    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals ?? 0);
    return amountInWei.toString();
  } catch (error) {
    throw new Error('getAmountInTokenDecimals Error: ' + error);
  }
}

export function getAmountInEtherDecimals(amount: number) {
  return ethers.utils.parseEther(amount.toString()).toString();
}

export async function getAmountWithoutDecimals(
  amount: BigNumberish,
  decimals?: number,
  tokenAddress?: string,
  chainId?: ChainId
) {
  try {
    if (!decimals && !tokenAddress) {
      throw new Error('Either decimals or tokenAddress must be provided');
    }

    if (!decimals && tokenAddress) {
      const provider = new ethers.providers.InfuraProvider(chainId);
      const token = new Contract(tokenAddress, ERC20_ABI, provider);
      decimals = await token.decimals();
    }

    return parseFloat(formatUnits(amount, decimals ?? 0));
  } catch (error) {
    throw new Error('getAmountWithoutDecimals Error: ' + error);
  }
}

export function getEtherWithoutDecimals(amount?: BigNumberish) {
  try {
    const ether = formatEther(amount || 0);
    return parseFloat(ether);
  } catch (error) {
    throw new Error('formatEther error: ' + error);
  }
}

export function bigNumberToNumber(amount: BigNumberish) {
  return parseFloat(BigNumber.from(amount).toString());
}
