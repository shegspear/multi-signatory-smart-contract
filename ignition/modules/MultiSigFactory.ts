import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigModule = buildModule('MultiSigModule', (m) => {

    const multiSigFactory = m.contract("MultisigFactory", []);

    return {multiSigFactory};
});

export default MultiSigModule;

//0x2d7847427Ad1885f4cd9e005Ea89356430Aa8454