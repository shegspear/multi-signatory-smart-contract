import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Multisig", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployToken() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const erc20Token = await hre.ethers.getContractFactory("Web3CXI");
    const token = await erc20Token.deploy();

    return { token };
  }

  async function deployMultiSig() {
    const [owner, acc1, acc2, acc3, acc4, acc5] = await hre.ethers.getSigners();

    const {token} = await loadFixture(deployToken);

    const multiSigFactory = await hre.ethers.getContractFactory("Multisig");
    const multiSig = await multiSigFactory.deploy(4, [acc1, acc2, acc3, acc4]);

    const amount = ethers.parseUnits("100", 18);

    await token.transfer(multiSig, amount); // comment this line out when testing for contract insuficient balance 

    return{multiSig, owner, acc1, acc2, acc3, acc4, acc5, token}
  }

  describe("Deployment", function() {
    it("Should check if quorum has been set", async function() {
      const {multiSig, owner:Owner, acc1, acc2, acc3, acc4, token} = await loadFixture(deployMultiSig);

      expect(await multiSig.quorum()).to.equal(4);
    })

    it("Should have a valid signer", async function() {
      const {multiSig, acc1} = await loadFixture(deployMultiSig);

      expect(await multiSig.isValidSigner(acc1)).to.be.true
    })
  })

  describe('Transfer Function', function() {
    it("Should return address zero found", async function() {
      const {multiSig, acc1, token} = await loadFixture(deployMultiSig);

      const zeroAddress: any = ethers.ZeroAddress;

      const amount = ethers.parseUnits("10", 18);

      await expect(multiSig.transfer(amount, zeroAddress, token)).to.be.revertedWith("address zero found");
    })

    it("Should return invalid signer", async function() {
      const {multiSig, acc1, acc5, token} = await loadFixture(deployMultiSig);

      const amount = ethers.parseUnits("10", 18);

      await expect(multiSig.connect(acc5).transfer(amount, acc1, token)).to.be.revertedWith("invalid signer");
    })

    it("Should return error for zero amount", async function() {
      const {multiSig, owner, acc1, token} = await loadFixture(deployMultiSig);

      const amount = ethers.parseUnits("0", 18);

      await expect(multiSig.connect(acc1).transfer(amount, acc1, token)).to.be.revertedWith("can't send zero amount");
    })

    it("should return error for passing zero address as token address", async function() {
      const {multiSig, acc1, token} = await loadFixture(deployMultiSig);

      const amount = ethers.parseUnits("10", 18);

      await expect(multiSig.transfer(amount, acc1, ethers.ZeroAddress)).to.be.revertedWith("address zero found");
    })

    // this test will fail, comment the transfer function in deployment line 34
    it("Should return error for insufficient balance", async function() {
      const {multiSig, acc1, token} = await loadFixture(deployMultiSig);

      const amount = ethers.parseUnits("10", 18);

      await expect(multiSig.transfer(amount, multiSig, token)).to.be.revertedWith("insufficient funds");
    })

    it("Should create transfer request", async function() {
      const {multiSig, owner, acc1, token} = await loadFixture(deployMultiSig);

      const amount = ethers.parseUnits("10", 18);

      await multiSig.connect(acc1).transfer(amount, acc1, token);

      expect(await multiSig.txCount()).to.equal(1);
    })
  })

  describe("Approve Transfer Request Function", function() {

    it("Should return error for invalid transaction ID", async function() {
      const {multiSig, owner, acc1, token} = await loadFixture(deployMultiSig);

      const amount = ethers.parseUnits("10", 18);

      await multiSig.connect(acc1).transfer(amount, acc1, token);

      await expect(multiSig.approveTx(2)).to.be.revertedWith("invalid tx id");
    })

    it("Should return error for insufficient balance", async function() {
      const erc20Token = await hre.ethers.getContractFactory("Web3CXI");
      const token = await erc20Token.deploy();

      const [owner, acc1, acc2, acc3, acc4, acc5] = await hre.ethers.getSigners();
  
      const multiSigFactory = await hre.ethers.getContractFactory("Multisig");
      const multiSig = await multiSigFactory.deploy(4, [acc1, acc2, acc3, acc4]);
  
      // const amount = ethers.parseUnits("100", 18);
  
      // await token.transfer(multiSig, amount); // comment this line out when testing for contract insuficient balance 

      const amount = ethers.parseUnits("10", 18);

      await multiSig.connect(acc1).transfer(amount, acc1, token);

      await expect(multiSig.approveTx(1)).to.be.revertedWith("insufficient funds");
    })


  })

  describe("Update Quorum Request", function() {
    it("Should create quorum update request created", async function() {
      const {multiSig, owner, acc1} = await loadFixture(deployMultiSig);

      await multiSig.updateQuorumRequest(6);
      expect(await multiSig.quorumCount()).to.equal(1);
    })
  })

  describe("Approve Quorum Update Request", function() {
    it("Should send approval for created quorum update request", async function() {
      const {multiSig, owner, acc1} = await loadFixture(deployMultiSig);

      await multiSig.updateQuorumRequest(6);
      
      await multiSig.connect(acc1).approveQuorumUpdate(1);

      expect(await multiSig.noOfApprovers()).to.equal(1);
    })
  })
 
});
