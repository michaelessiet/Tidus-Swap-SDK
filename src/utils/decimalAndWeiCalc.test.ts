import { USDC_ADDRESS } from "./constants";
import { getAmountValueInTokenDecimals } from "./decimalAndWeiCalc";

async function main() {
  const amount = await getAmountValueInTokenDecimals(100, undefined, USDC_ADDRESS);
  console.log(amount);
}

main();
