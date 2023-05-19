# Tidus Swap SDK

This is the Tidus Swap SDK. It is a collection of tools and libraries that make it easy to integrate TIdus Swap into any DApp, from client-side Javascript applications to server-side Node.js applications.

## Installation

```bash
npm install git://github.com/michaelessiet/Tidus-Swap-SDK
```

## Usage

### getQuote

This function can is an asynchronous function that returns a quote for a swap. It takes an object as a parameter. E.g:

```ts
const sellToken = new Token({
  contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  decimals: 6,
  chainId: ChainId.MAINNET // If chainId is not specified it will default to Ethereum mainnet
})

const buyToken = new Token({
  contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  decimals: 18,
  chainId: ChainId.MAINNET // If chainId is not specified it will default to Ethereum mainnet
})

const quote = await getQuote({
  chainId: ChainId.MAINNET,
  fromAddress: '0xB576f4Fac19eA8935A4BAA4F7AD5bc566A5845b1',
  sellToken: sellToken,
  buyToken: buyToken,
  sellAmount: await getAmountInTokenDecimals(100, 6),
  slippage: 0.01,
  swapType: SwapType.normal,
});
```

In the returned quote object, the `sellAmount` and `buyAmount` are in the token's decimals. E.g. if the token has 6 decimals, then the amount is in 6 decimal places. To get the amount in the token's base unit, use the `getAmountInTokenBaseUnits` function. The feeAmount is in the native currency's base units. E.g if the native currency is ETH, then the feeAmount is in wei and if the native currency is Matic then the feeAmount is in wei.

This is an example of what the getQuote function returns:

```ts
{
  sellTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  buyTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  allowanceTarget: '0x1111111254eeb25477b68fb85ed929f73a960582',
  to: '0x1111111254eeb25477b68fb85ed929f73a960582',
  data: '0x0502b1c5000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000bcf74f3e43575a0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000140000000000000003b6d0340397ff1542f962076d0bfe58ea045ffa2d347aca0520b7e0f',
  sellAmount: '100000000',
  sellAmountMinusFees: '100000000',
  sellAmountDisplay: '100000000',
  sellAmountInEth: '53446518546590734',
  buyAmount: '53194534794160467',
  buyAmountMinusFees: '52742381248410104',
  buyAmountDisplay: '52742381248410104',
  buyAmountInEth: '53194534794160467',
  value: '0',
  gasPrice: '44305136692',
  source: '1inch',
  protocols: [ { name: 'SUSHI', part: 100 } ],
  fee: '452153545750363',
  feePercentageBasisPoints: '8500000000000000',
  tradeType: 'exact_input',
  from: '0xB576f4Fac19eA8935A4BAA4F7AD5bc566A5845b1',
  defaultGasLimit: '350000',
  swapType: 'normal',
  txTarget: '0x00000000009726632680fb29d3f7a9734e3010e2',
  feeAmount: '239380000000000',
  formattedBuyAmount: 0.05319453479416047,
  formattedSellAmount: 100
}
```

### fillQuote

This function can is an asynchronous function that fills a quote for a swap. It takes an object as a parameter. E.g:

```ts
const quote = await getQuote({...})

const wallet = new Wallet('0x...')

const fillQuote = await fillQuote({
  quote: ...quote,
  wallet: wallet,
  chainId: ChainId.MAINNET,
  transactionOptions: {
    gasLimit: 1000000,
    gasPrice: 1000000000,
    value: 0
  }
})
```
