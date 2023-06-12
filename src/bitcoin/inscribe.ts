import * as bitcoin from 'bitcoinjs-lib';
import { initEccLib } from 'bitcoinjs-lib';
import BIP32Factory, { BIP32Interface } from 'bip32';
import { Taptree } from 'bitcoinjs-lib/src/types';
import {
  Network,
  NetworkType,
  generateTaprootKeyPair,
  mnemonicToTaprootPrivateKey,
  setBTCNetwork,
  toXOnly,
  SafeCardinalUTXO,
  SafeOrdinalUTXO,
} from '.';
import * as ecc from '@bitcoinerlab/secp256k1';
import { mnemonicToSeedSync } from 'bip39';
import wif from 'wif';
import { getTxSize } from './sizeEstimate';

// Source - https://github.com/OrdinalSafe/ordinalsafe-extension/blob/e26ac38ed8717d62714dd75e6ea573fbd58b14c2/src/pages/Popup/pages/Inscribe.jsx#L70
const DUST_LIMIT = 546;
const bip32 = BIP32Factory(ecc);

export const splitByNChars = (str: string, n: number): string[] => {
  const result = [];
  let i = 0;
  const len = str.length;

  while (i < len) {
    result.push(str.substr(i, n));
    i += n;
  }

  return result;
};

export const generateRevealAddress = (
  xOnlyPubKey: Buffer,
  mimeType: string,
  hexData: string,
  network: bitcoin.Network
): {
  p2tr: bitcoin.Payment;
  tapLeafScript: {
    leafVersion: number;
    script: Buffer;
    controlBlock: Buffer;
  };
} => {
  let inscribeLockScript = bitcoin.script.fromASM(
    `${xOnlyPubKey.toString('hex')} OP_CHECKSIG OP_0 OP_IF ${Buffer.from('ord').toString(
      'hex'
    )} OP_1 ${Buffer.from(mimeType).toString('hex')} OP_0 ${splitByNChars(hexData, 1040).join(
      ' '
    )} OP_ENDIF`
  );

  inscribeLockScript = Buffer.from(
    inscribeLockScript.toString('hex').replace('6f726451', '6f72640101'),
    'hex'
  );

  const scriptTree: Taptree = {
    output: inscribeLockScript,
  };

  const inscribeLockRedeem = {
    output: inscribeLockScript,
    redeemVersion: 192,
  };
  const inscribeP2tr = bitcoin.payments.p2tr({
    internalPubkey: xOnlyPubKey,
    scriptTree,
    network,
    redeem: inscribeLockRedeem,
  });

  const tapLeafScript = {
    leafVersion: inscribeLockRedeem.redeemVersion,
    script: inscribeLockRedeem.output || Buffer.from(''),
    controlBlock: inscribeP2tr.witness[inscribeP2tr.witness?.length - 1],
  };

  return {
    p2tr: inscribeP2tr,
    tapLeafScript,
  };
};

const utxoToPSBTInput = (input: SafeCardinalUTXO | SafeOrdinalUTXO, xOnlyPubKey: Buffer) => {
  return {
    hash: input.txId,
    index: input.index,
    witnessUtxo: {
      script: Buffer.from(input.script, 'hex'),
      value: input.value,
    },
    tapInternalKey: xOnlyPubKey,
  };
};

export const getInscribeCommitTx = (
  inputs: Array<SafeCardinalUTXO>,
  committerAddress: string,
  revealerAddress: string,
  revealCost: number,
  change: number,
  xOnlyPubKey: Buffer,
  serviceFee: number,
  serviceFeeReceiver: string,
  network: bitcoin.Network
): bitcoin.Psbt => {
  if (inputs.length === 0) throw new Error('Not enough funds');

  let outputs = [
    {
      address: revealerAddress,
      value: revealCost,
    },
  ];

  if (change !== 0) {
    outputs.push({
      address: committerAddress,
      value: change,
    });
  }

  if (serviceFee > 0) {
    outputs.push({
      value: serviceFee,
      address: serviceFeeReceiver,
    });
  }

  const psbt = new bitcoin.Psbt({ network });

  inputs.forEach((input) => {
    psbt.addInput(utxoToPSBTInput(input, xOnlyPubKey));
  });

  outputs.forEach((output) => {
    psbt.addOutput(output);
  });

  return psbt;
};

export const signPSBTFromWallet = (
  signer: bitcoin.Signer,
  psbt: bitcoin.Psbt
): bitcoin.Transaction => {
  initEccLib(ecc);
  try {
    psbt.signAllInputs(signer);
    //psbt.validateSignaturesOfAllInputs(signer)
  } catch (error) {
    console.log(error, 'signPSBTFromWallet error');
  }

  psbt.finalizeAllInputs();

  return psbt.extractTransaction();
};

export const getInscribeRevealTx = (
  commitHash: Buffer,
  commitIndex: number,
  revealCost: number,
  postageSize: number,
  receiverAddress: string,
  inscriberOutputScript: Buffer,
  xOnlyPubKey: Buffer,
  tapLeafScript: { leafVersion: number; script: Buffer; controlBlock: Buffer },
  websiteFeeReceiver: string | null = null,
  websiteFeeInSats: number | null = null,
  network: bitcoin.Network
): bitcoin.Psbt => {
  const psbt = new bitcoin.Psbt({ network });

  psbt.addInput({
    hash: commitHash,
    index: commitIndex,
    witnessUtxo: {
      script: inscriberOutputScript || Buffer.from(''),
      value: revealCost,
    },
    tapInternalKey: xOnlyPubKey,
    tapLeafScript: [tapLeafScript],
  });

  psbt.addOutput({
    address: receiverAddress,
    value: postageSize,
  });

  if (websiteFeeReceiver && websiteFeeInSats) {
    psbt.addOutput({
      address: websiteFeeReceiver,
      value: websiteFeeInSats,
    });
  }

  return psbt;
};
export const generateTaprootSigner = (node: BIP32Interface): bitcoin.Signer => {
  const xOnlyPubKey = node.publicKey.slice(1, 33);
  const signer = node.tweak(bitcoin.crypto.taggedHash('TapTweak', xOnlyPubKey));

  return signer;
};

export const generateAddress = (
  masterNode: BIP32Interface,
  path: Number = 0,
  isTestNet?
): BIP32Interface => {
  const derived = isTestNet
    ? masterNode.derivePath(`m/86'/1'/0'/0/${path}`)
    : masterNode.derivePath(`m/86'/0'/0'/0/${path}`);
  return derived;
};

export const getWalletNode = (senderMnemonic: string, isTestNet?): any => {
  const network = isTestNet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  const seed = mnemonicToSeedSync(senderMnemonic);

  const masterNode = bip32.fromSeed(seed, network);

  const address = generateAddress(masterNode, 0, isTestNet);
  const decoded = wif.decode(address.toWIF(), address.network.wif);
  return bip32.fromPrivateKey(decoded.privateKey, address.chainCode, network);
};

export const chooseUTXOs = (
  utxos: Array<SafeCardinalUTXO>,
  amount: number
): { chosenUTXOs: Array<SafeCardinalUTXO>; change: number } => {
  const lessers = utxos.filter((utxo) => utxo.value < amount);
  const greaters = utxos.filter((utxo) => utxo.value >= amount);
  if (greaters.length > 0) {
    let min;
    let minUTXO;
    for (const utxo of greaters) {
      if (!min || utxo.value < min) {
        min = utxo.value;
        minUTXO = utxo;
      }
    }
    if (minUTXO) {
      const change = minUTXO.value - amount;
      return { chosenUTXOs: [minUTXO], change };
    } else {
      return { chosenUTXOs: [], change: 0 };
    }
  } else {
    lessers.sort((a, b) => b.value - a.value);

    let sum = 0;
    const chosen = [];
    for (const utxo of lessers) {
      if (utxo.value < DUST_LIMIT)
        throw new Error('Amount requires usage of dust UTXOs. Set smaller amount');
      sum += utxo.value;
      chosen.push(utxo);
      if (sum >= amount) break;
    }
    if (sum < amount) return { chosenUTXOs: [], change: 0 };

    const change = sum - amount;

    return { chosenUTXOs: chosen, change };
  }
};

const getOutputAddressTypeCounts = (addresses: Array<string>, network: bitcoin.Network) => {
  let p2pkh = 0;
  let p2sh = 0;
  let p2wpkh = 0;
  let p2wsh = 0;
  let p2tr = 0;
  if (JSON.stringify(network) === JSON.stringify(bitcoin.networks.testnet)) {
    addresses.forEach((address) => {
      if (address.startsWith('tb1p')) p2tr++;
      else if (address.startsWith('3')) p2sh++;
      else if (address.startsWith('1')) p2pkh++;
      else if (address.startsWith('tb1q')) {
        let decodeBech32 = bitcoin.address.fromBech32(address);
        if (decodeBech32.data.length === 20) p2wpkh++;
        if (decodeBech32.data.length === 32) p2wsh++;
      } else {
        p2tr++; // if dont know type assum taproot bc it has the highset size for outputs
      }
    });
  } else {
    addresses.forEach((address) => {
      if (address.startsWith('bc1p')) p2tr++;
      else if (address.startsWith('3')) p2sh++;
      else if (address.startsWith('1')) p2pkh++;
      else if (address.startsWith('bc1q')) {
        let decodeBech32 = bitcoin.address.fromBech32(address);
        if (decodeBech32.data.length === 20) p2wpkh++;
        if (decodeBech32.data.length === 32) p2wsh++;
      } else {
        p2tr++; // if dont know type assum taproot bc it has the highset size for outputs
      }
    });
  }

  return { p2pkh, p2sh, p2wpkh, p2wsh, p2tr };
};

export const getInscribeTxsInfo = (
  utxos: Array<SafeCardinalUTXO>,
  data: string,
  sender: string,
  feeRate: number,
  serviceFee: number,
  serviceFeeReceiver: string, // to use in outputs size calculation
  btcPrice: number, // in USD
  websiteFeeInSats: number,
  network: bitcoin.Network
): {
  chosenUTXOs: Array<SafeCardinalUTXO>;
  change: number;
  commitSize: number;
  commitCost: number;
  revealSize: number;
  revealCost: number;
  serviceFee: number;
  postageSize: number;
} => {
  const POSTAGE_SIZE = 546;
  // 1 input 1 output taproot tx size 111 vBytes
  // some safety buffer + data size / 4
  const hexData = Buffer.from(data);
  const REVEAL_TX_SIZE = (websiteFeeInSats ? 180 : 137) + hexData.length / 4;

  const SERVICE_FEE = Math.ceil((serviceFee / btcPrice) * 100000000);
  const REVEAL_COST = POSTAGE_SIZE + (websiteFeeInSats || 0) + Math.ceil(REVEAL_TX_SIZE * feeRate);

  let chosenUTXOs: Array<SafeCardinalUTXO> = [];
  let change;
  let knownSize = 0;
  let newSize = 0;
  do {
    knownSize = newSize;

    ({ chosenUTXOs, change } = chooseUTXOs(
      utxos,
      REVEAL_COST + SERVICE_FEE + Math.ceil(knownSize * feeRate)
    ));

    if (chosenUTXOs.length === 0) throw new Error('Not enough funds');

    const addresses = [];
    if (change !== 0) addresses.push(sender);
    if (SERVICE_FEE !== 0) addresses.push(serviceFeeReceiver);
    const outputAddressTypeCounts = getOutputAddressTypeCounts(addresses, network);

    newSize = Math.ceil(
      getTxSize(
        chosenUTXOs.length,
        'P2TR',
        1,
        1,
        outputAddressTypeCounts.p2pkh,
        outputAddressTypeCounts.p2sh,
        0,
        0,
        outputAddressTypeCounts.p2wpkh,
        outputAddressTypeCounts.p2wsh,
        outputAddressTypeCounts.p2tr + 1 // +1 for reveal address
      ).vBytes
    );
  } while (knownSize !== newSize);

  const COMMIT_TX_SIZE = knownSize;
  const COMMIT_COST = REVEAL_COST + SERVICE_FEE + Math.ceil(COMMIT_TX_SIZE * feeRate);

  return {
    chosenUTXOs,
    change,
    commitCost: COMMIT_COST,
    commitSize: COMMIT_TX_SIZE,
    revealCost: REVEAL_COST,
    revealSize: REVEAL_TX_SIZE,
    serviceFee: SERVICE_FEE,
    postageSize: POSTAGE_SIZE,
  };
};

export const btc_inscribe = async (
  senderMnemonic: string,
  mimeType: string,
  data: string,
  websiteFeeReceiver: string | null,
  websiteFeeInSats: number | null,
  inscriptionReceiver: string | null,
  chosenUTXOs: Array<SafeCardinalUTXO>,
  committerAddress: string,
  revealCost: number,
  change: number,
  serviceFee: { feeAmount: number; feeReceiver: string },
  network: bitcoin.Network,
  postageSize: number,
  btcPrice: number,
  isTestNet?: boolean
): Promise<{ commit: string; commitHex: string; revealHex: string; reveal: string }> => {
  try {
    setBTCNetwork(isTestNet ? NetworkType.Testnet : NetworkType.Mainnet);

    const walletNode = getWalletNode(senderMnemonic, isTestNet);
    const signer = generateTaprootSigner(walletNode);

    const senderPrivateKey = await mnemonicToTaprootPrivateKey(senderMnemonic, isTestNet);

    const { keyPair } = generateTaprootKeyPair(senderPrivateKey);
    const internalPubKey = toXOnly(keyPair.publicKey);
    const hexData = Buffer.from(data).toString('hex');
    const { p2tr: revealAddress, tapLeafScript } = generateRevealAddress(
      Buffer.from(internalPubKey),
      mimeType,
      hexData,
      Network
    );
    const serviceFeeFeeAmountInSats = Math.ceil((serviceFee.feeAmount / btcPrice) * 100000000);
    const commitPSBT = getInscribeCommitTx(
      chosenUTXOs,
      committerAddress,
      revealAddress.address,
      revealCost,
      change,
      Buffer.from(internalPubKey),
      serviceFeeFeeAmountInSats,
      serviceFee.feeReceiver,
      network
    );
    const commitTx = signPSBTFromWallet(signer, commitPSBT);

    const revealPSBT = getInscribeRevealTx(
      commitTx.getHash(),
      0,
      revealCost,
      postageSize,
      inscriptionReceiver,
      revealAddress.output,
      revealAddress.internalPubkey,
      tapLeafScript,
      websiteFeeReceiver,
      websiteFeeInSats,
      Network
    );

    const revealTx = signPSBTFromWallet(walletNode, revealPSBT);
    return {
      commit: commitTx.getId(),
      commitHex: commitTx.toHex(),
      revealHex: revealTx.toHex(),
      reveal: revealTx.getId(),
    };
  } catch (error) {
    console.log('btc_inscribe: ' + error);
    throw error;
  }
};
