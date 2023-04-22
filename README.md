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
const quote = await getQuote({
  chainId: ChainId.MAINNET,
  fromAddress: '0xB576f4Fac19eA8935A4BAA4F7AD5bc566A5845b1',
  sellTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  buyTokenAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  sellAmount: await getAmountInTokenDecimals(100, 6),
  slippage: 0.01,
  swapType: SwapType.normal
})
```

In the returned quote object, the `sellAmount` and `buyAmount` are in the token's decimals. E.g. if the token has 6 decimals, then the amount is in 6 decimal places. To get the amount in the token's base unit, use the `getAmountInTokenBaseUnits` function. The feeAmount is in the native currency's base units. E.g if the native currency is ETH, then the feeAmount is in wei and if the native currency is Matic then the feeAmount is in wei.

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