import * as ecc from "@bitcoinerlab/secp256k1";

import { AES, enc } from "crypto-js";
import { ECPairAPI, ECPairFactory } from "ecpair";
import { Inscription, UTXO, Wallet } from "./types";
import {
    Signer,
    crypto,
    initEccLib,
    payments
} from "bitcoinjs-lib";

import BIP32Factory from "bip32";
import { BIP32Interface } from "bip32";
import BigNumber from "bignumber.js";
import { Network } from "./network";
import { filterAndSortCardinalUTXOs } from "./selectcoin";
import wif from "wif";

initEccLib(ecc);
const ECPair: ECPairAPI = ECPairFactory(ecc);

const BTCSegwitWalletDefaultPath = "m/84'/0'/0'/0/0";



/**
* convertPrivateKey converts buffer private key to WIF private key string
* @param bytes buffer private key
* @returns the WIF private key string
*/
const convertPrivateKey = (bytes: Buffer): string => {
    return wif.encode(128, bytes, true);
};

/**
* convertPrivateKeyFromStr converts private key WIF string to Buffer
* @param str private key string
* @returns buffer private key
*/
const convertPrivateKeyFromStr = (str: string): Buffer => {
    const res = wif.decode(str);
    return res?.privateKey;
};

function toXOnly(pubkey: Buffer): Buffer {
    return pubkey.subarray(1, 33);
}

function tweakSigner(signer: Signer, opts: any = {}): Signer {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey: Uint8Array | undefined = signer.privateKey!;
    if (!privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc.privateNegate(privateKey);
    }

    const tweakedPrivateKey = ecc.privateAdd(
        privateKey,
        tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash),
    );

    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }

    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network,
    });
}

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
    return crypto.taggedHash(
        "TapTweak",
        Buffer.concat(h ? [pubKey, h] : [pubKey]),
    );
}

const generateTaprootAddress = (privateKey: Buffer): string => {
    const keyPair = ECPair.fromPrivateKey(privateKey, { network: Network });
    const internalPubkey = toXOnly(keyPair.publicKey);

    const { address } = payments.p2tr({
        internalPubkey,
        network: Network,
    });

    return address ? address : "";
};

const generateTaprootAddressFromPubKey = (pubKey: Buffer) => {
    // const internalPubkey = toXOnly(pubKey);
    const internalPubkey = pubKey;

    const p2pktr = payments.p2tr({
        internalPubkey,
        network: Network,
    });

    return { address: p2pktr.address || "", p2pktr };
};

const generateTaprootKeyPair = (privateKey: Buffer) => {
    // init key pair from senderPrivateKey
    const keyPair = ECPair.fromPrivateKey(privateKey, { network: Network });
    // Tweak the original keypair
    const tweakedSigner = tweakSigner(keyPair, { network: Network });

    // Generate an address from the tweaked public key
    const p2pktr = payments.p2tr({
        pubkey: toXOnly(tweakedSigner.publicKey),
        network: Network
    });
    const senderAddress = p2pktr.address ? p2pktr.address : "";
    if (senderAddress === "") {
        throw new Error("Can not get sender address from private key");
    }

    return { keyPair, senderAddress, tweakedSigner, p2pktr };
};

const generateP2PKHKeyPair = (privateKey: Buffer) => {
    // init key pair from senderPrivateKey
    const keyPair = ECPair.fromPrivateKey(privateKey, { network: Network });

    // Generate an address from the tweaked public key
    const p2pkh = payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: Network
    });
    const address = p2pkh.address ? p2pkh.address : "";
    if (address === "") {
        throw new Error("Can not get sender address from private key");
    }

    return { keyPair, address, p2pkh: p2pkh, privateKey };
};

const generateP2PKHKeyFromRoot = (root: BIP32Interface) => {
    const childSegwit = root.derivePath(BTCSegwitWalletDefaultPath);
    const privateKey = childSegwit.privateKey as Buffer;

    return generateP2PKHKeyPair(privateKey);
};


/**
* getBTCBalance returns the Bitcoin balance from cardinal utxos. 
*/
const getBTCBalance = (
    params: {
        utxos: UTXO[],
        inscriptions: { [key: string]: Inscription[] },
    }
): BigNumber => {
    const { utxos, inscriptions } = params;
    const { totalCardinalAmount } = filterAndSortCardinalUTXOs(utxos, inscriptions);
    return totalCardinalAmount;
};


/**
* importBTCPrivateKey returns the bitcoin private key and the corresponding taproot address. 
*/
const importBTCPrivateKey = (
    wifPrivKey: string
): {
    taprootPrivKeyBuffer: Buffer, taprootAddress: string,
} => {
    const privKeyBuffer = convertPrivateKeyFromStr(wifPrivKey);
    const { senderAddress } = generateTaprootKeyPair(privKeyBuffer);

    return {
        taprootPrivKeyBuffer: privKeyBuffer,
        taprootAddress: senderAddress,
    };
};
  

const getBitcoinKeySignContent = (message: string): Buffer => {
    return Buffer.from(message);
};
 

/**
* encryptWallet encrypts Wallet object by AES algorithm. 
* @param wallet includes the plaintext private key need to encrypt
* @param password the password to encrypt
* @returns the signature with prefix "0x"
*/
const encryptWallet = (wallet: Wallet, password: string) => {
    // convert wallet to string
    const walletStr = JSON.stringify(wallet);
    const ciphertext = AES.encrypt(walletStr, password).toString();
    return ciphertext;
};

/**
* decryptWallet decrypts ciphertext to Wallet object by AES algorithm. 
* @param ciphertext ciphertext
* @param password the password to decrypt
* @returns the Wallet object
*/
const decryptWallet = (ciphertext: string, password: string): Wallet => {
    const plaintextBytes = AES.decrypt(ciphertext, password);

    // parse to wallet object
    const wallet = JSON.parse(plaintextBytes.toString(enc.Utf8));

    return wallet;
};


export {
    ECPair,
    convertPrivateKey,
    convertPrivateKeyFromStr,
    toXOnly,
    tweakSigner,
    tapTweakHash,
    generateTaprootAddress,
    generateTaprootKeyPair,
    generateP2PKHKeyPair,
    generateP2PKHKeyFromRoot,
    getBTCBalance,
    importBTCPrivateKey,
    getBitcoinKeySignContent,
    encryptWallet,
    decryptWallet,
    generateTaprootAddressFromPubKey,
};