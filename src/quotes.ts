import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import {
  StaticJsonRpcProvider,
} from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import RainbowRouterABI from './abi/RainbowRouter.json';
import {
  ChainId,
  CrosschainQuote,
  CrosschainQuoteExecutionDetails,
  EthereumAddress,
  Quote,
  QuoteError,
  QuoteExecutionDetails,
  QuoteParams,
  SocketChainsData,
  Source,
  SwapType,
  TransactionOptions,
} from './types';
import {
  API_BASE_URL,
  ETH_ADDRESS,
  MATIC_ADDRESS,
  MAX_INT,
  PERMIT_EXPIRATION_TS,
  TIDUS_ROUTER_CONTRACT_ADDRESS,
  WRAPPED_ASSET,
} from './utils/constants';
import { calculateFeeWithDecimals } from './utils/feeCalculator';
import {
  Token,
  getAmountWithoutDecimals,
  getEtherWithoutDecimals,
  signPermit,
} from '.';
import axios from 'axios';

/**
 * Function to get a swap formatted quote url to use with backend
 *
 * @param {ChainId} params.chainId
 * @param {EthereumAddress} params.sellTokenAddress
 * @param {EthereumAddress} params.buyTokenAddress
 * @param {BigNumberish} params.buyAmount
 * @param {BigNumberish} params.sellAmount
 * @param {EthereumAddress} params.fromAddress
 * @param {string} params.source
 * @param {number} params.feePercentageBasisPoints
 * @param {number} params.slippage
 * @returns {string}
 */
const buildTidusQuoteUrl = ({
  chainId,
  sellTokenAddress,
  buyTokenAddress,
  buyAmount,
  sellAmount,
  fromAddress,
  source,
}: {
  chainId: number;
  toChainId?: number;
  sellTokenAddress: EthereumAddress;
  buyTokenAddress: EthereumAddress;
  buyAmount?: BigNumberish;
  sellAmount?: BigNumberish;
  fromAddress: EthereumAddress;
  source?: Source;
}) => {
  const searchParams = new URLSearchParams({
    buyTokenAddress: buyTokenAddress,
    chainId: String(chainId),
    fromAddress,
    sellTokenAddress: sellTokenAddress,
    // slippage: String(slippage),
    // swapType: SwapType.normal,
    ...(source ? { source } : {}),
    ...(sellAmount
      ? { sellAmount: String(sellAmount) }
      : { buyAmount: String(buyAmount) }),
    // When buying ETH, we need to tell the aggregator
    // to return the funds to the contract if we need to take a fee
    // ...(buyTokenAddress === ETH_ADDRESS
    //   || buyTokenAddress === MATIC_ADDRESS
    //   ? { destReceiver: TIDUS_ROUTER_CONTRACT_ADDRESS[chainId as ChainId] }
    //   : {}),
    // ...(feePercentageBasisPoints !== undefined
    //   ? { feePercentageBasisPoints: String(feePercentageBasisPoints) }
    //   : {}),
  });
  return `${API_BASE_URL}/api/swap/quote?` + searchParams.toString();
};

/**
 * Function to get a crosschain swap formatted quote url to use with backend
 *
 * @param {ChainId} params.chainId
 * @param {ChainId} params.toChainId
 * @param {Token} params.sellToken
 * @param {Token} params.buyToken
 * @param {BigNumberish} params.sellAmount
 * @param {EthereumAddress} params.fromAddress
 * @param {number} params.slippage
 * @param {boolean} params.refuel
 * @returns {string}
 */
const buildTidusCrosschainQuoteUrl = ({
  chainId,
  toChainId,
  sellToken,
  buyToken,
  sellAmount,
  fromAddress,
  refuel,
}: {
  chainId: number;
  toChainId?: number;
  sellToken: Token;
  buyToken: Token;
  sellAmount?: BigNumberish;
  fromAddress: EthereumAddress;
  refuel?: boolean;
}) => {
  const searchParams = new URLSearchParams({
    buyToken: buyToken.contractAddress,
    chainId: String(chainId),
    fromAddress,
    refuel: String(refuel),
    sellAmount: String(sellAmount),
    sellToken: sellToken.contractAddress,
    swapType: SwapType.crossChain,
    toChainId: String(toChainId),
  });
  return `${API_BASE_URL}/v1/quote?` + searchParams.toString();
};

/**
 * Function to get a minimum amount of source chain gas token to perform a refuel swap
 *
 * @param {ChainId} params.chainId
 * @param {ChainId} params.toChainId
 * @returns {string}
 */
export const getMinRefuelAmount = async (params: {
  chainId: ChainId;
  toChainId: ChainId;
}) => {
  const { chainId, toChainId } = params;
  const url = `${API_BASE_URL}/v1/chains`;
  const response = await fetch(url);
  const chainsData = (await response.json()) as SocketChainsData;

  const sourceChain = chainsData.result.find((c) => c.chainId === chainId);

  if (!sourceChain) return null;

  const destinationChain = sourceChain.limits.find(
    (c) => c.chainId === toChainId
  );

  if (!destinationChain) return null;

  // We multiply the min amount by 2 as that is what is required according to sockets docs
  // Ref: https://docs.socket.tech/socket-api/v2/guides/refuel-integration#refuel-as-a-middleware
  return BigNumber.from(destinationChain.minAmount).mul(2).toString();
};

/**
 * Function to get a quote from rainbow's swap aggregator backend - note that there are helper functions to get the decimal amounts for each token - see `getAmountInTokenDecimals` and `getAmountInEtherDecimals`
 *
 * @param {QuoteParams} params
 * @param {Source} params.source
 * @param {ChainId} params.chainId
 * @param {EthereumAddress} params.fromAddress
 * @param {Token} params.sellToken
 * @param {Token} params.buyToken
 * @param {BigNumberish} params.sellAmount - amount of sellToken to sell (if buyAmount is not provided) - if both are provided, sellAmount will be used - This is the amount that will be swapped, this amount should be provided in its native decimals (e.g. 1 USDC should be 1000000)
 * @param {BigNumberish} params.buyAmount - amount of buyToken to buy (if sellAmount is not provided) - if both are provided, sellAmount will be used
 * @param {number} params.slippage
 * @param {number} params.feePercentageBasisPoints
 * @returns {Promise<Quote | null>}
 */
export const getQuote = async (
  params: QuoteParams
): Promise<Quote | QuoteError | null> => {
  const {
    source,
    chainId = ChainId.mainnet,
    fromAddress,
    sellAmount,
    buyAmount,
  } = params;
  // When wrapping or unwrapping ETH, the quote is always 1:1
  // so we don't need to call our backend.
  const sellTokenAddressLowercase =
    params.sellToken.contractAddress.toLowerCase();
  const buyTokenAddressLowercase =
    params.buyToken.contractAddress.toLowerCase();
  const ethAddressLowerCase = ETH_ADDRESS.toLowerCase();
  const wrappedAssetLowercase = WRAPPED_ASSET[chainId]?.toLowerCase();
  const isWrap =
    sellTokenAddressLowercase === ethAddressLowerCase &&
    buyTokenAddressLowercase === wrappedAssetLowercase;
  const isUnwrap =
    sellTokenAddressLowercase === wrappedAssetLowercase &&
    buyTokenAddressLowercase === ethAddressLowerCase;

  if (isWrap || isUnwrap) {
    return {
      buyAmount: sellAmount || buyAmount,
      buyTokenAddress: params.buyToken.contractAddress,
      defaultGasLimit: isWrap ? '30000' : '40000',
      fee: BigNumber.from(sellAmount || buyAmount)
        .mul(0.45 / 100)
        .toString(),
      feeAmount: BigNumber.from(sellAmount || buyAmount)
        .mul(0.45 / 100)
        .toString(),
      feePercentageBasisPoints: 0,
      from: fromAddress,
      inputTokenDecimals: 18,
      outputTokenDecimals: 18,
      sellAmount: sellAmount || buyAmount,
      sellAmountMinusFees: sellAmount || buyAmount,
      sellTokenAddress: params.sellToken.contractAddress,
      formattedBuyAmount: getEtherWithoutDecimals(sellAmount || buyAmount),
      formattedSellAmount: getEtherWithoutDecimals(sellAmount || buyAmount),
      buyAmountInEth: sellAmount || buyAmount,
      sellAmountInEth: sellAmount || buyAmount,
    } as Quote;
  }

  if (isNaN(Number(sellAmount)) && isNaN(Number(buyAmount))) {
    return null;
  }

  const url = buildTidusQuoteUrl({
    buyAmount,
    buyTokenAddress: params.buyToken.contractAddress,
    chainId,
    fromAddress,
    sellAmount,
    sellTokenAddress: params.sellToken.contractAddress,
    source,
  });

  const promises = Promise.all([
    (async () => {
      const response = await axios.get(url);
      const quote = response.data;
      return quote;
    })(),
  ]) as Promise<any[]>;

  const [quote] = await promises;
  const sellTokenDecimals = params.sellToken.decimals;

  if (quote.error) {
    return quote as QuoteError;
  }

  let result: Quote;

  if (
    params.sellToken.contractAddress === ETH_ADDRESS ||
    params.sellToken.contractAddress == MATIC_ADDRESS
  ) {
    result = {
      ...quote,
      feeAmount: await calculateFeeWithDecimals(
        params.sellToken.contractAddress,
        chainId,
        (quote as Quote).sellAmount,
        sellTokenDecimals,
        (quote as Quote).buyAmountInEth
      ),
      formattedBuyAmount: await getAmountWithoutDecimals(
        quote.buyAmount,
        undefined,
        params.buyToken.contractAddress,
        chainId
      ),
      formattedSellAmount: getEtherWithoutDecimals(quote.sellAmount),
    };
  }

  if (params.buyToken.contractAddress === ETH_ADDRESS) {
    result = {
      ...quote,
      feeAmount: await calculateFeeWithDecimals(
        params.sellToken.contractAddress,
        chainId,
        (quote as Quote).sellAmount,
        sellTokenDecimals,
        (quote as Quote).buyAmountInEth
      ),
      formattedBuyAmount: getEtherWithoutDecimals(quote.buyAmount),
      formattedSellAmount: await getAmountWithoutDecimals(
        quote.sellAmount,
        params.sellToken.decimals,
        params.sellToken.contractAddress,
        chainId
      ),
    };
  }

  if (
    params.sellToken.contractAddress !== ETH_ADDRESS &&
    params.buyToken.contractAddress !== ETH_ADDRESS
  ) {
    result = {
      ...quote,
      feeAmount: await calculateFeeWithDecimals(
        params.sellToken.contractAddress,
        chainId,
        (quote as Quote).sellAmount,
        sellTokenDecimals,
        (quote as Quote).buyAmountInEth
      ),
      formattedBuyAmount: await getAmountWithoutDecimals(
        quote.buyAmount,
        params.buyToken.decimals,
        params.buyToken.contractAddress,
        chainId
      ),
      formattedSellAmount: await getAmountWithoutDecimals(
        quote.sellAmount,
        params.sellToken.decimals,
        params.sellToken.contractAddress,
        chainId
      ),
    };
  }

  return result! as Quote;
};

/**
 * Function to get a crosschain swap quote from rainbow's swap aggregator backend
 *
 * @param {QuoteParams} params
 * @param {ChainId} params.chainId
 * @param {ChainId} params.toChainId
 * @param {EthereumAddress} params.fromAddress
 * @param {Token} params.sellToken
 * @param {Token} params.buyToken
 * @param {BigNumberish} params.sellAmount
 * @param {number} params.slippage
 * @param {boolean} params.refuel
 * @returns {Promise<CrosschainQuote | null>}
 */
export const getCrosschainQuote = async (
  params: QuoteParams
): Promise<CrosschainQuote | QuoteError | null> => {
  const {
    chainId = ChainId.mainnet,
    toChainId,
    fromAddress,
    sellAmount,
    refuel = false,
  } = params;

  if (!sellAmount || !toChainId) {
    return null;
  }

  const url = buildTidusCrosschainQuoteUrl({
    buyToken: params.buyToken,
    chainId,
    fromAddress,
    refuel,
    sellAmount,
    sellToken: params.sellToken,
    toChainId,
  });

  const response = await fetch(url);
  const quote = await response.json();
  if (quote.error) {
    return quote as QuoteError;
  }
  return quote as CrosschainQuote;
};

const calculateDeadline = async (wallet: Wallet) => {
  const { timestamp } = await wallet.provider.getBlock('latest');
  return timestamp + PERMIT_EXPIRATION_TS;
};

/**
 * Function that fills a quote onchain via rainbow's swap aggregator smart contract
 *
 * @param {Quote} quote
 * @param {TransactionOptions} transactionOptions
 * @param {Signer} wallet
 * @param {boolean} permit
 * @param {number} ChainId
 * @returns {Promise<Transaction>}
 */
export const fillQuote = async (
  quote: Quote,
  transactionOptions: TransactionOptions,
  wallet: Signer,
  permit: boolean,
  chainId: ChainId
): Promise<Transaction> => {
  const instance = new Contract(
    TIDUS_ROUTER_CONTRACT_ADDRESS[chainId].toString(),
    RainbowRouterABI,
    wallet
  );
  let swapTx;

  const {
    sellTokenAddress,
    buyTokenAddress,
    to,
    data,
    value,
    sellAmount,
    feeAmount,
  } = quote;

  const ethAddressLowerCase = ETH_ADDRESS.toLowerCase();

  if (
    sellTokenAddress?.toLowerCase() === ethAddressLowerCase ||
    (sellTokenAddress?.toLowerCase() === MATIC_ADDRESS.toLowerCase() &&
      chainId === ChainId.polygon)
  ) {
    console.log('Filling Quote ETH to Token');
    swapTx = await instance.fillQuoteEthToToken(
      buyTokenAddress,
      to,
      data,
      feeAmount,
      {
        ...transactionOptions,
        value: BigNumber.from(sellAmount).add(feeAmount ?? 0),
      }
    );
  } else if (
    buyTokenAddress?.toLowerCase() === ethAddressLowerCase ||
    (buyTokenAddress?.toLowerCase() === MATIC_ADDRESS.toLowerCase() &&
      chainId === ChainId.polygon)
  ) {
    console.log('Filling Quote Token to ETH');
    if (permit) {
      const deadline = await calculateDeadline(wallet as Wallet);
      const permitSignature = await signPermit(
        wallet as Wallet,
        sellTokenAddress,
        quote.from,
        instance.address,
        MAX_INT,
        deadline,
        chainId
      );
      swapTx = await instance.fillQuoteTokenToEthWithPermit(
        sellTokenAddress,
        to,
        data,
        sellAmount,
        feeAmount,
        permitSignature,
        {
          ...transactionOptions,
          value: BigNumber.from(sellAmount).add(feeAmount ?? 0),
        }
      );
    } else {
      swapTx = await instance.fillQuoteTokenToEth(
        sellTokenAddress,
        to,
        data,
        sellAmount,
        feeAmount,
        {
          ...transactionOptions,
          value: BigNumber.from(feeAmount).add(value ?? 0),
        }
      );
    }
  } else {
    console.log('Filling Quote Token to Token');
    if (permit) {
      const deadline = await calculateDeadline(wallet as Wallet);
      const permitSignature = await signPermit(
        wallet as Wallet,
        sellTokenAddress,
        quote.from,
        instance.address,
        MAX_INT,
        deadline,
        chainId
      );
      swapTx = await instance.fillQuoteTokenToTokenWithPermit(
        sellTokenAddress,
        buyTokenAddress,
        to,
        data,
        sellAmount,
        feeAmount,
        permitSignature,
        {
          ...transactionOptions,
          value: BigNumber.from(feeAmount).add(value ?? 0),
        }
      );
    } else {
      swapTx = await instance.fillQuoteTokenToToken(
        sellTokenAddress,
        buyTokenAddress,
        to,
        data,
        feeAmount,
        sellAmount,
        {
          ...transactionOptions,
          value: BigNumber.from(feeAmount).add(value ?? 0),
        }
      );
    }
  }
  return swapTx;
};

/**
 * Function that fills a crosschain swap quote onchain via rainbow's swap aggregator smart contract
 *
 * @param {CrosschainQuote} quote
 * @param {TransactionOptions} transactionOptions
 * @param {Signer} wallet
 * @returns {Promise<Transaction>}
 */
export const fillCrosschainQuote = async (
  quote: CrosschainQuote,
  transactionOptions: TransactionOptions,
  wallet: Signer
): Promise<Transaction> => {
  const { to, data, from, value } = quote;
  const swapTx = await wallet.sendTransaction({
    data,
    from,
    to,
    ...{
      ...transactionOptions,
      value,
    },
  });

  return swapTx;
};

export const getQuoteExecutionDetails = (
  quote: Quote,
  transactionOptions: TransactionOptions,
  provider: StaticJsonRpcProvider
): QuoteExecutionDetails => {
  const instance = new Contract(
    TIDUS_ROUTER_CONTRACT_ADDRESS[provider.network.chainId as ChainId],
    RainbowRouterABI,
    provider
  );

  const {
    sellTokenAddress,
    buyTokenAddress,
    to,
    data,
    fee,
    value,
    sellAmount,
    feePercentageBasisPoints,
  } = quote;

  const ethAddressLowerCase = ETH_ADDRESS.toLowerCase();

  if (sellTokenAddress?.toLowerCase() === ethAddressLowerCase) {
    return {
      method: instance.estimateGas['fillQuoteEthToToken'],
      methodArgs: [buyTokenAddress, to, data, fee],
      methodName: 'fillQuoteEthToToken',
      params: {
        ...transactionOptions,
        value,
      },
      router: instance,
    };
  } else if (buyTokenAddress?.toLowerCase() === ethAddressLowerCase) {
    return {
      method: instance.estimateGas['fillQuoteTokenToEth'],
      methodArgs: [
        sellTokenAddress,
        to,
        data,
        sellAmount,
        feePercentageBasisPoints,
      ],
      methodName: 'fillQuoteTokenToEth',
      params: {
        ...transactionOptions,
        value,
      },
      router: instance,
    };
  } else {
    return {
      method: instance.estimateGas['fillQuoteTokenToToken'],
      methodArgs: [
        sellTokenAddress,
        buyTokenAddress,
        to,
        data,
        sellAmount,
        fee,
      ],
      methodName: 'fillQuoteTokenToToken',
      params: {
        ...transactionOptions,
        value,
      },
      router: instance,
    };
  }
};

export const getCrosschainQuoteExecutionDetails = (
  quote: CrosschainQuote,
  transactionOptions: TransactionOptions,
  provider: StaticJsonRpcProvider
): CrosschainQuoteExecutionDetails => {
  const { to, from, data, value } = quote;
  return {
    method: provider.estimateGas({
      data,
      from,
      to,
      value,
    }),
    params: {
      ...transactionOptions,
      value,
    },
  };
};
