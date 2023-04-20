import { ChainId } from "../types";
import { USDC_ADDRESS, USDC_POLYGON_ADDRESS } from "./constants";
import { getAmountInTokenDecimals } from "./decimalAndWeiCalc";
import calculateFee, { calculateFeeWithDecimals } from "./feeCalculator";

async function runTest() {
  // should return a value equivalent to 0.45% of 100 USDC
  const fee = await calculateFeeWithDecimals(USDC_ADDRESS, ChainId.mainnet, await getAmountInTokenDecimals(1000000, 6), 6);
  console.log(fee)

  const fee2 = await calculateFee(USDC_ADDRESS, ChainId.mainnet, 1000000);
  console.log(fee2)
}

runTest();