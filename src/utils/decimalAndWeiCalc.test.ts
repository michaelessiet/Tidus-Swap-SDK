import { USDC_ADDRESS } from "./constants";
import { getAmountInTokenDecimals } from "./decimalAndWeiCalc";

async function main() {
  const amount = await getAmountInTokenDecimals(100, undefined, USDC_ADDRESS);
  console.log(amount);
}

main();
