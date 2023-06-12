import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface } from 'bip32';
import { Network, SafeCardinalUTXO } from '.';
export declare const splitByNChars: (str: string, n: number) => string[];
export declare const generateRevealAddress: (xOnlyPubKey: Buffer, mimeType: string, hexData: string, network: bitcoin.Network) => {
    p2tr: bitcoin.Payment;
    tapLeafScript: {
        leafVersion: number;
        script: Buffer;
        controlBlock: Buffer;
    };
};
export declare const getInscribeCommitTx: (inputs: Array<SafeCardinalUTXO>, committerAddress: string, revealerAddress: string, revealCost: number, change: number, xOnlyPubKey: Buffer, serviceFee: number, serviceFeeReceiver: string, network: bitcoin.Network) => bitcoin.Psbt;
export declare const signPSBTFromWallet: (signer: bitcoin.Signer, psbt: bitcoin.Psbt) => bitcoin.Transaction;
export declare const getInscribeRevealTx: (commitHash: Buffer, commitIndex: number, revealCost: number, postageSize: number, receiverAddress: string, inscriberOutputScript: Buffer, xOnlyPubKey: Buffer, tapLeafScript: {
    leafVersion: number;
    script: Buffer;
    controlBlock: Buffer;
}, websiteFeeReceiver: string | null, websiteFeeInSats: number | null, network: bitcoin.Network) => bitcoin.Psbt;
export declare const generateTaprootSigner: (node: BIP32Interface) => bitcoin.Signer;
export declare const generateAddress: (masterNode: BIP32Interface, path?: Number, isTestNet?: any) => BIP32Interface;
export declare const getWalletNode: (senderMnemonic: string, isTestNet?: any) => any;
export declare const chooseUTXOs: (utxos: Array<SafeCardinalUTXO>, amount: number) => {
    chosenUTXOs: Array<SafeCardinalUTXO>;
    change: number;
};
export declare const getInscribeTxsInfo: (utxos: Array<SafeCardinalUTXO>, data: string, sender: string, feeRate: number, serviceFee: number, serviceFeeReceiver: string, btcPrice: number, websiteFeeInSats: number, network: bitcoin.Network) => {
    chosenUTXOs: Array<SafeCardinalUTXO>;
    change: number;
    commitSize: number;
    commitCost: number;
    revealSize: number;
    revealCost: number;
    serviceFee: number;
    postageSize: number;
};
export declare const btc_inscribe: (senderMnemonic: string, mimeType: string, data: string, websiteFeeReceiver: string | null, websiteFeeInSats: number | null, inscriptionReceiver: string | null, chosenUTXOs: Array<SafeCardinalUTXO>, committerAddress: string, revealCost: number, change: number, serviceFee: {
    feeAmount: number;
    feeReceiver: string;
}, network: bitcoin.Network, postageSize: number, isTestNet?: boolean) => Promise<{
    commit: string;
    commitHex: string;
    revealHex: string;
    reveal: string;
}>;
