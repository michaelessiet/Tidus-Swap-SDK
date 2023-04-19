import calculateFee from "./feeCalculator";

async function runTest() {
  const fee = await calculateFee("0x6b175474e89094c44da98b954eedeac495271d0f", 1);
  console.log(fee)
}

runTest();
