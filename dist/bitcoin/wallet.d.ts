/// <reference types="node" />
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairAPI } from "ecpair";
import { Inscription, UTXO, Wallet } from "./types";
import { Signer } from "bitcoinjs-lib";
import { BIP32Interface } from "bip32";
import BigNumber from "bignumber.js";
declare const ECPair: ECPairAPI;
export declare const NETWORK: bitcoin.networks.Network;
export declare const TESTNET_DERIV_PATH = "m/86'/1'/0'/0/0";
export declare const MAINNET_DERIV_PATH = "m/86'/0'/0'/0/0";
export declare const mnemonicToTaprootPrivateKey: (mnemonic: string, testnet?: any) => Promise<Buffer>;
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
    keyPair: import("ecpair").ECPairInterface;
    senderAddress: string;
    tweakedSigner: bitcoin.Signer;
    p2pktr: bitcoin.payments.Payment;
};
declare const generateP2PKHKeyPair: (privateKey: Buffer) => {
    keyPair: import("ecpair").ECPairInterface;
    address: string;
    p2pkh: bitcoin.payments.Payment;
    privateKey: Buffer;
};
declare const generateP2PKHKeyFromRoot: (root: BIP32Interface) => {
    keyPair: import("ecpair").ECPairInterface;
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
export { ECPair, convertPrivateKey, convertPrivateKeyFromStr, toXOnly, tweakSigner, tapTweakHash, generateTaprootAddress, generateTaprootKeyPair, generateP2PKHKeyPair, generateP2PKHKeyFromRoot, getBTCBalance, importBTCPrivateKey, getBitcoinKeySignContent, encryptWallet, decryptWallet, generateTaprootAddressFromPubKey, };
