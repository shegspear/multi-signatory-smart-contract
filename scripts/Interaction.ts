import { ethers } from "hardhat";

async function main() {

    const contractAddress = "0x2d7847427Ad1885f4cd9e005Ea89356430Aa8454";
    const multisigFactory = await ethers.getContractAt(
        "MultisigFactory",
        contractAddress
    );

    // const multisigResponse = await multisigFactory.createMultisigWallet(4,[
    //     "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
    //     "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
    //     "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    //     "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB"
    // ])
    // multisigResponse.wait();

    // console.log('factory response ', multisigResponse.);

    const clones = await multisigFactory.getMultiSigClones();
    // console.log('multisig clone  ', multisigClonesResponse);

    const multisigClone = await ethers.getContractAt("Multisig", clones[0]);
    
    console.log('clone quorum ', await multisigClone.quorum());
    console.log('clone quorum ', await multisigClone.noOfValidSigners());

    const approvalAmount = ethers.parseUnits("1000", 18);

    // await multisigClone.transfer()
}

main().catch((error) => {
    console.log('Interaction script error ', error);
    process.exitCode = 1;
})