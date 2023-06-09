/// <reference types="node" />
import BigNumber from 'bignumber.js';
import * as bitcoin from 'bitcoinjs-lib';
import { Transaction, Psbt, Signer, networks } from 'bitcoinjs-lib';
import * as ecpair from 'ecpair';
import { ECPairAPI } from 'ecpair';
import { BIP32Interface } from 'bip32';

declare const BlockStreamURL = "https://blockstream.info/api";
declare const MinSats = 1000;
declare const DummyUTXOValue = 1000;
declare const InputSize = 68;
declare const OutputSize = 43;
declare const BNZero: BigNumber;
declare const WalletType: {
    Xverse: number;
    Hiro: number;
};

interface UTXO {
    tx_hash: string;
    tx_output_n: number;
    value: BigNumber;
}
interface Inscription {
    offset: BigNumber;
    id: string;
}
interface ICreateTxResp {
    tx: Transaction;
    txID: string;
    txHex: string;
    fee: BigNumber;
    selectedUTXOs: UTXO[];
    changeAmount: BigNumber;
}
interface ICreateRawTxResp {
    base64Psbt: string;
    fee: BigNumber;
    selectedUTXOs: UTXO[];
    changeAmount: BigNumber;
    indicesToSign: number[];
}
interface ICreateTxBuyResp {
    tx: Transaction;
    txID: string;
    txHex: string;
    fee: BigNumber;
    selectedUTXOs: UTXO[];
    splitTxID: string;
    splitUTXOs: UTXO[];
    splitTxRaw: string;
}
interface ICreateTxSellResp {
    base64Psbt: string;
    selectedUTXOs: UTXO[];
    splitTxID: string;
    splitUTXOs: UTXO[];
    splitTxRaw: string;
}
interface ICreateTxSplitInscriptionResp {
    txID: string;
    txHex: string;
    fee: BigNumber;
    selectedUTXOs: UTXO[];
    newValueInscription: BigNumber;
}
interface BuyReqInfo {
    sellerSignedPsbtB64: string;
    receiverInscriptionAddress: string;
    price: BigNumber;
}
interface BuyReqFullInfo extends BuyReqInfo {
    sellerSignedPsbt: Psbt;
    valueInscription: BigNumber;
    paymentUTXO: any;
}
interface PaymentInfo {
    address: string;
    amount: BigNumber;
}
interface Wallet {
    privKey: string;
}
interface ISignPSBTResp {
    signedBase64PSBT: string;
    msgTxHex: string;
    msgTxID: string;
    msgTx: Transaction;
}
interface NeedPaymentUTXO {
    buyInfoIndex: number;
    amount: BigNumber;
}
interface SafeCardinalUTXO {
    status: string;
    txId: string;
    index: number;
    value: number;
    script: string;
    address: string;
    blockHeight: number;
    type: string;
}
interface SafeInscription {
    id: string;
    genesisFee: number;
    genesisHeight: number;
    number: number;
    satpoint: string;
    timestamp: number;
}
interface SafeOrdinalUTXO {
    status: string;
    txId: string;
    index: number;
    value: number;
    script: string;
    address: string;
    blockHeight: number;
    type: string;
    inscriptions: Array<SafeInscription>;
}
interface TxStatus {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
}
interface AddressTxsUtxo {
    txid: string;
    vout: number;
    status: TxStatus;
    value: number;
}

/**
* selectUTXOs selects the most reasonable UTXOs to create the transaction.
* if sending inscription, the first selected UTXO is always the UTXO contain inscription.
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the list of selected UTXOs
* @returns the actual flag using inscription coin to pay fee
* @returns the value of inscription outputs, and the change amount (if any)
* @returns the network fee
*/
declare const selectUTXOs: (utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}, sendInscriptionID: string, sendAmount: BigNumber, feeRatePerByte: number, isUseInscriptionPayFee: boolean) => {
    selectedUTXOs: UTXO[];
    isUseInscriptionPayFee: boolean;
    valueOutInscription: BigNumber;
    changeAmount: BigNumber;
    fee: BigNumber;
};
/**
* selectUTXOs selects the most reasonable UTXOs to create the transaction.
* if sending inscription, the first selected UTXO is always the UTXO contain inscription.
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @returns the ordinal UTXO
* @returns the actual flag using inscription coin to pay fee
* @returns the value of inscription outputs, and the change amount (if any)
* @returns the network fee
*/
declare const selectInscriptionUTXO: (utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}, inscriptionID: string) => {
    inscriptionUTXO: UTXO;
    inscriptionInfo: Inscription;
};
/**
* selectCardinalUTXOs selects the most reasonable UTXOs to create the transaction.
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendAmount satoshi amount need to send
* @returns the list of selected UTXOs
* @returns the actual flag using inscription coin to pay fee
* @returns the value of inscription outputs, and the change amount (if any)
* @returns the network fee
*/
declare const selectCardinalUTXOs: (utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}, sendAmount: BigNumber) => {
    selectedUTXOs: UTXO[];
    remainUTXOs: UTXO[];
    totalInputAmount: BigNumber;
};
declare const selectUTXOsToCreateBuyTx: (params: {
    sellerSignedPsbt: Psbt;
    price: BigNumber;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    feeRate: number;
}) => {
    selectedUTXOs: UTXO[];
};
/**
* selectTheSmallestUTXO selects the most reasonable UTXOs to create the transaction.
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendAmount satoshi amount need to send
* @param isSelectDummyUTXO need to select dummy UTXO or not
* @returns the list of selected UTXOs
* @returns the actual flag using inscription coin to pay fee
* @returns the value of inscription outputs, and the change amount (if any)
* @returns the network fee
*/
declare const selectTheSmallestUTXO: (utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}) => UTXO;
/**
* filterAndSortCardinalUTXOs filter cardinal utxos and inscription utxos.
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @returns the list of cardinal UTXOs which is sorted descending by value
* @returns the list of inscription UTXOs
* @returns total amount of cardinal UTXOs
*/
declare const filterAndSortCardinalUTXOs: (utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}) => {
    cardinalUTXOs: UTXO[];
    inscriptionUTXOs: UTXO[];
    totalCardinalAmount: BigNumber;
};
/**
* findExactValueUTXO returns the cardinal utxos with exact value.
* @param cardinalUTXOs list of utxos (only non-inscription  utxos)
* @param value value of utxo
* @returns the cardinal UTXO
*/
declare const findExactValueUTXO: (cardinalUTXOs: UTXO[], value: BigNumber) => {
    utxo: UTXO;
};

/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const signPSBT: ({ senderPrivateKey, psbtB64, indicesToSign, sigHashType }: {
    senderPrivateKey: Buffer;
    psbtB64: string;
    indicesToSign: number[];
    sigHashType?: number;
}) => ISignPSBTResp;
/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const signPSBT2: ({ senderPrivateKey, psbtB64, indicesToSign, sigHashType }: {
    senderPrivateKey: Buffer;
    psbtB64: string;
    indicesToSign: number[];
    sigHashType?: number;
}) => string;
/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createRawTxDummyUTXOForSale: ({ pubKey, utxos, inscriptions, sellInscriptionID, feeRatePerByte, }: {
    pubKey: Buffer;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    sellInscriptionID: string;
    feeRatePerByte: number;
}) => {
    dummyUTXO: any;
    splitPsbtB64: string;
    indicesToSign: number[];
    selectedUTXOs: UTXO[];
    newValueInscription: BigNumber;
};
/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createTx: (senderPrivateKey: Buffer, utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}, sendInscriptionID: string, receiverInsAddress: string, sendAmount: BigNumber, feeRatePerByte: number, isUseInscriptionPayFeeParam?: boolean) => ICreateTxResp;
/**
* createRawTx creates the raw Bitcoin transaction (including sending inscriptions), but don't sign tx.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param pubKey buffer public key of the sender (It is the internal pubkey for Taproot address)
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createRawTx: ({ pubKey, utxos, inscriptions, sendInscriptionID, receiverInsAddress, sendAmount, feeRatePerByte, isUseInscriptionPayFeeParam, }: {
    pubKey: Buffer;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    sendInscriptionID: string;
    receiverInsAddress: string;
    sendAmount: BigNumber;
    feeRatePerByte: number;
    isUseInscriptionPayFeeParam: boolean;
}) => ICreateRawTxResp;
/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createTxSendBTC: ({ senderPrivateKey, utxos, inscriptions, paymentInfos, feeRatePerByte, }: {
    senderPrivateKey: Buffer;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    paymentInfos: PaymentInfo[];
    feeRatePerByte: number;
}) => ICreateTxResp;
/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createRawTxSendBTC: ({ pubKey, utxos, inscriptions, paymentInfos, feeRatePerByte, }: {
    pubKey: Buffer;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    paymentInfos: PaymentInfo[];
    feeRatePerByte: number;
}) => ICreateRawTxResp;
/**
* createTxWithSpecificUTXOs creates the Bitcoin transaction with specific UTXOs (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* This function is used for testing.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount amount need to send (in sat)
* @param valueOutInscription inscription output's value (in sat)
* @param changeAmount cardinal change amount (in sat)
* @param fee transaction fee (in sat)
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createTxWithSpecificUTXOs: (senderPrivateKey: Buffer, utxos: UTXO[], sendInscriptionID: string, receiverInsAddress: string, sendAmount: BigNumber, valueOutInscription: BigNumber, changeAmount: BigNumber, fee: BigNumber) => {
    txID: string;
    txHex: string;
    fee: BigNumber;
};
/**
* createTx creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createTxSplitFundFromOrdinalUTXO: (senderPrivateKey: Buffer, inscriptionUTXO: UTXO, inscriptionInfo: Inscription, sendAmount: BigNumber, feeRatePerByte: number) => ICreateTxSplitInscriptionResp;
/**
* createRawTxSplitFundFromOrdinalUTXO creates the Bitcoin transaction (including sending inscriptions).
* NOTE: Currently, the function only supports sending from Taproot address.
* @param senderPrivateKey buffer private key of the sender
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the sender
* @param sendInscriptionID id of inscription to send
* @param receiverInsAddress the address of the inscription receiver
* @param sendAmount satoshi amount need to send
* @param feeRatePerByte fee rate per byte (in satoshi)
* @param isUseInscriptionPayFee flag defines using inscription coin to pay fee
* @returns the transaction id
* @returns the hex signed transaction
* @returns the network fee
*/
declare const createRawTxSplitFundFromOrdinalUTXO: ({ pubKey, inscriptionUTXO, inscriptionInfo, sendAmount, feeRatePerByte, }: {
    pubKey: Buffer;
    inscriptionUTXO: UTXO;
    inscriptionInfo: Inscription;
    sendAmount: BigNumber;
    feeRatePerByte: number;
}) => {
    resRawTx: ICreateRawTxResp;
    newValueInscription: BigNumber;
};
declare const createDummyUTXOFromCardinal: (senderPrivateKey: Buffer, utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}, feeRatePerByte: number) => {
    dummyUTXO: UTXO;
    splitTxID: string;
    selectedUTXOs: UTXO[];
    newUTXO: any;
    fee: BigNumber;
    txHex: string;
};
declare const createRawTxDummyUTXOFromCardinal: (pubKey: Buffer, utxos: UTXO[], inscriptions: {
    [key: string]: Inscription[];
}, feeRatePerByte: number) => {
    dummyUTXO: any;
    splitPsbtB64: string;
    indicesToSign: number[];
    changeAmount: BigNumber;
    selectedUTXOs: UTXO[];
    fee: BigNumber;
};
declare const prepareUTXOsToBuyMultiInscriptions: ({ privateKey, address, utxos, inscriptions, feeRatePerByte, buyReqFullInfos, }: {
    privateKey: Buffer;
    address: string;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    feeRatePerByte: number;
    buyReqFullInfos: BuyReqFullInfo[];
}) => {
    buyReqFullInfos: BuyReqFullInfo[];
    dummyUTXO: any;
    splitTxID: string;
    selectedUTXOs: UTXO[];
    newUTXO: any;
    fee: BigNumber;
    splitTxHex: string;
};
declare const createRawTxToPrepareUTXOsToBuyMultiInscs: ({ pubKey, address, utxos, inscriptions, feeRatePerByte, buyReqFullInfos, }: {
    pubKey: Buffer;
    address: string;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    feeRatePerByte: number;
    buyReqFullInfos: BuyReqFullInfo[];
}) => {
    buyReqFullInfos: BuyReqFullInfo[];
    dummyUTXO: any;
    selectedUTXOs: UTXO[];
    fee: BigNumber;
    changeAmount: BigNumber;
    needPaymentUTXOs: NeedPaymentUTXO[];
    needCreateDummyUTXO: boolean;
    splitPsbtB64: string;
    indicesToSign: number[];
};
declare const broadcastTx: (txHex: string) => Promise<string>;

/**
* estimateTxFee estimates the transaction fee
* @param numIns number of inputs in the transaction
* @param numOuts number of outputs in the transaction
* @param feeRatePerByte fee rate per byte (in satoshi)
* @returns returns the estimated transaction fee in satoshi
*/
declare const estimateTxFee: (numIns: number, numOuts: number, feeRatePerByte: number) => number;
/**
* estimateNumInOutputs estimates number of inputs and outputs by parameters:
* @param inscriptionID id of inscription to send (if any)
* @param sendAmount satoshi amount need to send
* @param isUseInscriptionPayFee use inscription output coin to pay fee or not
* @returns returns the estimated number of inputs and outputs in the transaction
*/
declare const estimateNumInOutputs: (inscriptionID: string, sendAmount: BigNumber, isUseInscriptionPayFee: boolean) => {
    numIns: number;
    numOuts: number;
};
/**
* estimateNumInOutputs estimates number of inputs and outputs by parameters:
* @param inscriptionID id of inscription to send (if any)
* @param sendAmount satoshi amount need to send
* @param isUseInscriptionPayFee use inscription output coin to pay fee or not
* @returns returns the estimated number of inputs and outputs in the transaction
*/
declare const estimateNumInOutputsForBuyInscription: (estNumInputsFromBuyer: number, estNumOutputsFromBuyer: number, sellerSignedPsbt: Psbt) => {
    numIns: number;
    numOuts: number;
};
declare const fromSat: (sat: number) => number;

declare const ECPair: ECPairAPI;
declare const NETWORK: bitcoin.networks.Network;
declare const TESTNET_DERIV_PATH = "m/86'/1'/0'/0/0";
declare const MAINNET_DERIV_PATH = "m/86'/0'/0'/0/0";
declare const mnemonicToTaprootPrivateKey: (mnemonic: string, testnet?: any) => Promise<Buffer>;
/**
* convertPrivateKey converts buffer private key to WIF private key string
* @param bytes buffer private key
* @returns the WIF private key string
*/
declare const convertPrivateKey: (bytes: Buffer) => string;
/**
* convertPrivateKeyFromStr converts private key WIF string to Buffer
* @param str private key string
* @returns buffer private key
*/
declare const convertPrivateKeyFromStr: (str: string) => Buffer;
declare function toXOnly(pubkey: Buffer): Buffer;
declare function tweakSigner(signer: Signer, opts?: any): Signer;
declare function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer;
declare const generateTaprootAddress: (privateKey: Buffer) => string;
declare const generateTaprootAddressFromPubKey: (pubKey: Buffer) => {
    address: string;
    p2pktr: bitcoin.payments.Payment;
};
declare const generateTaprootKeyPair: (privateKey: Buffer) => {
    keyPair: ecpair.ECPairInterface;
    senderAddress: string;
    tweakedSigner: bitcoin.Signer;
    p2pktr: bitcoin.payments.Payment;
};
declare const generateP2PKHKeyPair: (privateKey: Buffer) => {
    keyPair: ecpair.ECPairInterface;
    address: string;
    p2pkh: bitcoin.payments.Payment;
    privateKey: Buffer;
};
declare const generateP2PKHKeyFromRoot: (root: BIP32Interface) => {
    keyPair: ecpair.ECPairInterface;
    address: string;
    p2pkh: bitcoin.payments.Payment;
    privateKey: Buffer;
};
/**
* getBTCBalance returns the Bitcoin balance from cardinal utxos.
*/
declare const getBTCBalance: (params: {
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
}) => BigNumber;
/**
* importBTCPrivateKey returns the bitcoin private key and the corresponding taproot address.
*/
declare const importBTCPrivateKey: (wifPrivKey: string) => {
    taprootPrivKeyBuffer: Buffer;
    taprootAddress: string;
};
declare const getBitcoinKeySignContent: (message: string) => Buffer;
/**
* encryptWallet encrypts Wallet object by AES algorithm.
* @param wallet includes the plaintext private key need to encrypt
* @param password the password to encrypt
* @returns the signature with prefix "0x"
*/
declare const encryptWallet: (wallet: Wallet, password: string) => string;
/**
* decryptWallet decrypts ciphertext to Wallet object by AES algorithm.
* @param ciphertext ciphertext
* @param password the password to decrypt
* @returns the Wallet object
*/
declare const decryptWallet: (ciphertext: string, password: string) => Wallet;

/**
* createPSBTToSell creates the partially signed bitcoin transaction to sale the inscription.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param sellerPrivateKey buffer private key of the seller
* @param sellerAddress payment address of the seller to recieve BTC from buyer
* @param ordinalInput ordinal input coin to sell
* @param price price of the inscription that the seller wants to sell (in satoshi)
* @returns the encoded base64 partially signed transaction
*/
declare const createPSBTToSell: (params: {
    sellerPrivateKey: Buffer;
    receiverBTCAddress: string;
    inscriptionUTXO: UTXO;
    amountPayToSeller: BigNumber;
    feePayToCreator: BigNumber;
    creatorAddress: string;
    dummyUTXO: UTXO;
}) => string;
/**
* createPSBTToSell creates the partially signed bitcoin transaction to sale the inscription.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param sellerPrivateKey buffer private key of the seller
* @param sellerAddress payment address of the seller to recieve BTC from buyer
* @param ordinalInput ordinal input coin to sell
* @param price price of the inscription that the seller wants to sell (in satoshi)
* @returns the encoded base64 partially signed transaction
*/
declare const createRawPSBTToSell: (params: {
    internalPubKey: Buffer;
    receiverBTCAddress: string;
    inscriptionUTXO: UTXO;
    amountPayToSeller: BigNumber;
    feePayToCreator: BigNumber;
    creatorAddress: string;
    dummyUTXO: UTXO;
}) => ICreateRawTxResp;
/**
* createPSBTToBuy creates the partially signed bitcoin transaction to buy the inscription.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param sellerSignedPsbt PSBT from seller
* @param buyerPrivateKey buffer private key of the buyer
* @param buyerAddress payment address of the buy to receive inscription
* @param valueInscription value in inscription
* @param price price of the inscription that the seller wants to sell (in satoshi)
* @param paymentUtxos cardinal input coins to payment
* @param dummyUtxo cardinal dummy input coin
* @returns the encoded base64 partially signed transaction
*/
declare const createPSBTToBuy: (params: {
    sellerSignedPsbt: Psbt;
    buyerPrivateKey: Buffer;
    receiverInscriptionAddress: string;
    valueInscription: BigNumber;
    price: BigNumber;
    paymentUtxos: UTXO[];
    dummyUtxo: UTXO;
    feeRate: number;
}) => ICreateTxResp;
/**
* reqListForSaleInscription creates the PSBT of the seller to list for sale inscription.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param sellerPrivateKey buffer private key of the seller
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the seller
* @param sellInscriptionID id of inscription to sell
* @param receiverBTCAddress the seller's address to receive BTC
* @param amountPayToSeller BTC amount to pay to seller
* @param feePayToCreator BTC fee to pay to creator
* @param creatorAddress address of creator
* amountPayToSeller + feePayToCreator = price that is showed on UI
* @returns the base64 encode Psbt
*/
declare const reqListForSaleInscription: (params: {
    sellerPrivateKey: Buffer;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    sellInscriptionID: string;
    receiverBTCAddress: string;
    amountPayToSeller: BigNumber;
    feePayToCreator: BigNumber;
    creatorAddress: string;
    feeRatePerByte: number;
}) => Promise<ICreateTxSellResp>;
/**
* reqBuyInscription creates the PSBT of the seller to list for sale inscription.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param sellerSignedPsbtB64 buffer private key of the buyer
* @param buyerPrivateKey buffer private key of the buyer
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the seller
* @param sellInscriptionID id of inscription to sell
* @param receiverBTCAddress the seller's address to receive BTC
* @param price  = amount pay to seller + fee pay to creator
* @returns the base64 encode Psbt
*/
declare const reqBuyInscription: (params: {
    sellerSignedPsbtB64: string;
    buyerPrivateKey: Buffer;
    receiverInscriptionAddress: string;
    price: BigNumber;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    feeRatePerByte: number;
}) => Promise<ICreateTxBuyResp>;
/**
* reqBuyInscription creates the PSBT of the seller to list for sale inscription.
* NOTE: Currently, the function only supports sending from Taproot address.
* @param sellerSignedPsbtB64 buffer private key of the buyer
* @param buyerPrivateKey buffer private key of the buyer
* @param utxos list of utxos (include non-inscription and inscription utxos)
* @param inscriptions list of inscription infos of the seller
* @param sellInscriptionID id of inscription to sell
* @param receiverBTCAddress the seller's address to receive BTC
* @param price  = amount pay to seller + fee pay to creator
* @returns the base64 encode Psbt
*/
declare const reqBuyMultiInscriptions: (params: {
    buyReqInfos: BuyReqInfo[];
    buyerPrivateKey: Buffer;
    utxos: UTXO[];
    inscriptions: {
        [key: string]: Inscription[];
    };
    feeRatePerByte: number;
}) => ICreateTxBuyResp;

declare let Network: networks.Network;
declare const NetworkType: {
    Mainnet: number;
    Testnet: number;
    Regtest: number;
};
declare const setBTCNetwork: (netType: number) => void;

declare const splitByNChars: (str: string, n: number) => string[];
declare const generateRevealAddress: (xOnlyPubKey: Buffer, mimeType: string, hexData: string, network: bitcoin.Network) => {
    p2tr: bitcoin.Payment;
    tapLeafScript: {
        leafVersion: number;
        script: Buffer;
        controlBlock: Buffer;
    };
};
declare const getInscribeCommitTx: (inputs: Array<SafeCardinalUTXO>, committerAddress: string, revealerAddress: string, revealCost: number, change: number, xOnlyPubKey: Buffer, serviceFee: number, serviceFeeReceiver: string, network: bitcoin.Network) => bitcoin.Psbt;
declare const signPSBTFromWallet: (signer: bitcoin.Signer, psbt: bitcoin.Psbt) => bitcoin.Transaction;
declare const getInscribeRevealTx: (commitHash: Buffer, commitIndex: number, revealCost: number, postageSize: number, receiverAddress: string, inscriberOutputScript: Buffer, xOnlyPubKey: Buffer, tapLeafScript: {
    leafVersion: number;
    script: Buffer;
    controlBlock: Buffer;
}, websiteFeeReceiver: string | null, websiteFeeInSats: number | null, network: bitcoin.Network) => bitcoin.Psbt;
declare const generateTaprootSigner: (node: BIP32Interface) => bitcoin.Signer;
declare const generateAddress: (masterNode: BIP32Interface, path?: Number, isTestNet?: any) => BIP32Interface;
declare const getWalletNode: (senderMnemonic: string, isTestNet?: any) => any;
declare const chooseUTXOs: (utxos: Array<SafeCardinalUTXO>, amount: number) => {
    chosenUTXOs: Array<SafeCardinalUTXO>;
    change: number;
};
declare const getInscribeTxsInfo: (utxos: Array<SafeCardinalUTXO>, data: string, sender: string, feeRate: number, serviceFee: number, serviceFeeReceiver: string, btcPrice: number, websiteFeeInSats: number, network: bitcoin.Network) => {
    chosenUTXOs: Array<SafeCardinalUTXO>;
    change: number;
    commitSize: number;
    commitCost: number;
    revealSize: number;
    revealCost: number;
    serviceFee: number;
    postageSize: number;
};
declare const btc_inscribe: (senderMnemonic: string, mimeType: string, data: string, websiteFeeReceiver: string | null, websiteFeeInSats: number | null, inscriptionReceiver: string | null, chosenUTXOs: Array<SafeCardinalUTXO>, committerAddress: string, revealCost: number, change: number, serviceFee: {
    feeAmount: number;
    feeReceiver: string;
}, network: bitcoin.Network, postageSize: number, isTestNet?: boolean) => Promise<{
    commit: string;
    commitHex: string;
    revealHex: string;
    reveal: string;
}>;

declare const ERROR_CODE: {
    INVALID_CODE: string;
    INVALID_PARAMS: string;
    NOT_SUPPORT_SEND: string;
    NOT_FOUND_INSCRIPTION: string;
    NOT_ENOUGH_BTC_TO_SEND: string;
    NOT_ENOUGH_BTC_TO_PAY_FEE: string;
    ERR_BROADCAST_TX: string;
    INVALID_SIG: string;
    INVALID_VALIDATOR_LABEL: string;
    NOT_FOUND_UTXO: string;
    NOT_FOUND_DUMMY_UTXO: string;
    WALLET_NOT_SUPPORT: string;
    SIGN_XVERSE_ERROR: string;
    CREATE_COMMIT_TX_ERR: string;
    INVALID_TAPSCRIPT_ADDRESS: string;
};
declare const ERROR_MESSAGE: {
    [x: string]: {
        message: string;
        desc: string;
    };
};
declare class SDKError extends Error {
    message: string;
    code: string;
    desc: string;
    constructor(code: string, desc?: string);
    getMessage(): string;
}

declare class Validator {
    value: any;
    label: string;
    isRequired: boolean;
    constructor(label: string, value: any);
    _throwError(message: string): void;
    _isDefined(): boolean;
    _onCondition(condition: () => any, message: string): this;
    required(message?: string): this;
    string(message?: string): this;
    buffer(message?: string): this;
    function(message?: string): this;
    boolean(message?: string): this;
    number(message?: string): this;
    array(message?: string): this;
    privateKey(message?: string): this;
}

export { AddressTxsUtxo, BNZero, BlockStreamURL, BuyReqFullInfo, BuyReqInfo, DummyUTXOValue, ECPair, ERROR_CODE, ERROR_MESSAGE, ICreateRawTxResp, ICreateTxBuyResp, ICreateTxResp, ICreateTxSellResp, ICreateTxSplitInscriptionResp, ISignPSBTResp, InputSize, Inscription, MAINNET_DERIV_PATH, MinSats, NETWORK, NeedPaymentUTXO, Network, NetworkType, OutputSize, PaymentInfo, SDKError, SafeCardinalUTXO, SafeInscription, SafeOrdinalUTXO, TESTNET_DERIV_PATH, UTXO, Validator, Wallet, WalletType, broadcastTx, btc_inscribe, chooseUTXOs, convertPrivateKey, convertPrivateKeyFromStr, createDummyUTXOFromCardinal, createPSBTToBuy, createPSBTToSell, createRawPSBTToSell, createRawTx, createRawTxDummyUTXOForSale, createRawTxDummyUTXOFromCardinal, createRawTxSendBTC, createRawTxSplitFundFromOrdinalUTXO, createRawTxToPrepareUTXOsToBuyMultiInscs, createTx, createTxSendBTC, createTxSplitFundFromOrdinalUTXO, createTxWithSpecificUTXOs, decryptWallet, encryptWallet, estimateNumInOutputs, estimateNumInOutputsForBuyInscription, estimateTxFee, filterAndSortCardinalUTXOs, findExactValueUTXO, fromSat, generateAddress, generateP2PKHKeyFromRoot, generateP2PKHKeyPair, generateRevealAddress, generateTaprootAddress, generateTaprootAddressFromPubKey, generateTaprootKeyPair, generateTaprootSigner, getBTCBalance, getBitcoinKeySignContent, getInscribeCommitTx, getInscribeRevealTx, getInscribeTxsInfo, getWalletNode, importBTCPrivateKey, mnemonicToTaprootPrivateKey, prepareUTXOsToBuyMultiInscriptions, reqBuyInscription, reqBuyMultiInscriptions, reqListForSaleInscription, selectCardinalUTXOs, selectInscriptionUTXO, selectTheSmallestUTXO, selectUTXOs, selectUTXOsToCreateBuyTx, setBTCNetwork, signPSBT, signPSBT2, signPSBTFromWallet, splitByNChars, tapTweakHash, toXOnly, tweakSigner };
