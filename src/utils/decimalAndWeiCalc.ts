import ERC20_ABI from '../abi/ERC20.json';
import { InfuraProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import {formatEther, formatUnits} from '@ethersproject/units'

export function parseUnits(amount: number, decimals: number) {
  return (
    (amount * 10 ** decimals).toFixed(0) ||
    BigNumber.from(parseInt(amount.toString())).mul(10 ** decimals)
  );
}

export function parseEther(amount: number) {
  return parseUnits(amount, 18);
}

export async function getAmountInTokenDecimals(
  amount: number,
  decimals?: number,
  tokenAddress?: string
) {
  if (!decimals && !tokenAddress) {
    throw new Error('Either decimals or tokenAddress must be provided');
  }

  if (!decimals && tokenAddress) {
    const provider = new InfuraProvider();
    const token = new Contract(tokenAddress, ERC20_ABI, provider);
    decimals = await token.decimals();
  }

  const amountInWei = parseUnits(amount, decimals ?? 0);
  return amountInWei.toString();
}

export function getAmountInEtherDecimals(amount: number) {
  return parseEther(amount).toString();
}

export async function getAmountWithoutDecimals(
  amount: BigNumberish,
  decimals?: number,
  tokenAddress?: string
) {
  if (!decimals && !tokenAddress) {
    throw new Error('Either decimals or tokenAddress must be provided');
  }

  if (!decimals && tokenAddress) {
    const provider = new InfuraProvider();
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