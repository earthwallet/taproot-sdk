import { InputSize, OutputSize } from "../bitcoin/constants";
import { Inscription, UTXO, estimateTxFee } from "..";

import BigNumber from "bignumber.js";

const getRevealVirtualSizeByDataSize = (dataSize: number): number => {
    const inputSize = InputSize + dataSize;
    return inputSize + OutputSize;
};

/**
* estimateInscribeFee estimate BTC amount need to inscribe for creating project. 
* NOTE: Currently, the function only supports sending from Taproot address. 
* @param htmlFileSizeByte size of html file from user (in byte)
* @param feeRatePerByte fee rate per byte (in satoshi)
* @returns the total BTC fee
*/
const estimateInscribeFee = ({
    htmlFileSizeByte,
    feeRatePerByte,
}: {
    htmlFileSizeByte: number,
    feeRatePerByte: number,
}): {
    totalFee: BigNumber,
} => {

    const estCommitTxFee = estimateTxFee(1, 2, feeRatePerByte);
    const revealVByte = getRevealVirtualSizeByDataSize((htmlFileSizeByte + 24000) / 4);  // 24k for contract size
    const estRevealTxFee = revealVByte * feeRatePerByte;
    const totalFee = estCommitTxFee + estRevealTxFee;
    return { totalFee: new BigNumber(totalFee) };
};

export {
    estimateInscribeFee
};