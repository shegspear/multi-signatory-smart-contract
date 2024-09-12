import { ethers } from "hardhat";

async function main() {
  const web3CXITokenAddress = "0x94281Be35cE44d154eb8Dd2606295a6d756AB395";
  const web3CXI = await ethers.getContractAt("IERC20", web3CXITokenAddress);

  const saveERC20ContractAddress = "0x6B4F1D179a6151199a737460C3f09F5855E8f776";
  const saveERC20 = await ethers.getContractAt(
    "ISaveERC20",
    saveERC20ContractAddress
  );

  // Approve savings contract to spend token
  const approvalAmount = ethers.parseUnits("1000", 18);

  const approveTx = await web3CXI.approve(saveERC20, approvalAmount);
  approveTx.wait();

  const contractBalanceBeforeDeposit = await saveERC20.getContractBalance();
  console.log("Contract balance before :::", contractBalanceBeforeDeposit);

  const depositAmount = ethers.parseUnits("150", 18);
  const depositTx = await saveERC20.deposit(depositAmount);

  console.log(depositTx);

  depositTx.wait();

  const contractBalanceAfterDeposit = await saveERC20.getContractBalance();

  console.log("Contract balance after :::", contractBalanceAfterDeposit);

  // Withdrawal Interaction
  console.log("__Withdrawing funds___");

  const withdrawAmount = ethers.parseUnits("100", 18);
  const withdrawTx = await saveERC20.withdraw(withdrawAmount);

  console.log(withdrawTx);

  withdrawTx.wait();
  console.log(
    "Contract balance after withdrawing:::",
    contractBalanceAfterDeposit
  );

  //Transfer funds
  const receiver = "0x000";
  const amountToSend = ethers.parseUnits("2", 18);

  const transferTx = await saveERC20.transferFunds(receiver, amountToSend);
  await transferTx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});