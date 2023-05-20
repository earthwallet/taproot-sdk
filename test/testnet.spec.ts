import * as bitcoin from 'bitcoinjs-lib';
import { assert } from 'chai';
import BIP32Factory from 'bip32';
import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import {
  generateTaprootKeyPair,
  setBTCNetwork,
  NetworkType,
  createTx,
  Inscription,
  getBTCBalance,
} from '../src/index';
import axios from 'axios';
import BigNumber from 'bignumber.js';

const bip32 = BIP32Factory(ecc);
initEccLib(ecc);

export const NETWORK = true ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
export const DEFAULT_DERIV_PATH = "m/86'/1'/0'/0/0";

const TEST_MNE_1 =
  'open jelly jeans corn ketchup supreme brief element armed lens vault weather original scissors rug priority vicious lesson raven spot gossip powder person volcano';

describe('Sign msg Tx', async () => {
  it('create signed raw tc tx', async () => {
    const seed = bip39.mnemonicToSeedSync(TEST_MNE_1);
    const rootKey = await bip32.fromSeed(seed, NETWORK);
    const taprootChild = rootKey.derivePath(DEFAULT_DERIV_PATH);

    const privateKey = taprootChild.privateKey!;
  
  
    setBTCNetwork(NetworkType.Testnet);

    const { senderAddress, keyPair } = generateTaprootKeyPair(privateKey);
    console.log(senderAddress)
    assert(senderAddress == 'tb1p5hwep2dna6wjhk6atjh0uyjmmp095y2arz3z32c9udmde7qrgwrseypr8x');

    const utxos = await getUtxos(senderAddress);
    const parsedUtxos =
      utxos?.length > 0
        ? utxos?.map((utxo: any) => ({
            tx_hash: utxo.txid,
            tx_output_n: utxo.vout,
            value: new BigNumber(utxo.value), // normal
          }))
        : [];

    let inscriptions: { [key: string]: Inscription[] } = {
      '68fb52991055475d22516b13ff3381f6a244f006d8fc68f631da329473b26ea6:0': [
        {
          id: '68fb52991055475d22516b13ff3381f6a244f006d8fc68f631da329473b26ea6i0',
          offset: new BigNumber(0),
        },
      ],
    };
    const overallBalance = await getBalance(senderAddress);
    const cardinalBalance = await getBTCBalance({ utxos: parsedUtxos, inscriptions });
    console.log(overallBalance, 'overallBalance', cardinalBalance.toNumber(), 'cardinalBalance');

    const response = await createTx(
      privateKey,
      parsedUtxos,
      inscriptions,
      undefined,
      senderAddress,
      new BigNumber(1234),
      7
    );
    assert(response.selectedUTXOs.length == 1);
    console.log(response, 'response');

    const sendOrdinal = await createTx(
      privateKey,
      parsedUtxos,
      inscriptions,
      '68fb52991055475d22516b13ff3381f6a244f006d8fc68f631da329473b26ea6i0',
      'tb1p5hwep2dna6wjhk6atjh0uyjmmp095y2arz3z32c9udmde7qrgwrseypr8x',
      new BigNumber(0),
      7,
      false
    );
    console.log('sendOrdinal', sendOrdinal, sendOrdinal.fee.toNumber());
    return false;
  });
});

export const getUtxos = async (address: string) => {
  //curl -sSL "https://mempool.space/testnet/api/address/tb1q4kgratttzjvkxfmgd95z54qcq7y6hekdm3w56u/utxo"
  let utxos = [];
  await axios.get(`https://mempool.space/testnet/api/address/${address}/utxo`).then((res) => {
    utxos = res.data;
  });
  return utxos;
};

export const getBalance = async (address: string) => {
  /*

curl -sSL "https://mempool.space/api/address/1wiz18xYmhRX6xStj2b9t1rwWX4GKUgpv"

{
  address: "1wiz18xYmhRX6xStj2b9t1rwWX4GKUgpv",
  chain_stats: {
    funded_txo_count: 5,
    funded_txo_sum: 15007599040,
    spent_txo_count: 5,
    spent_txo_sum: 15007599040,
    tx_count: 7
  },
  mempool_stats: {
    funded_txo_count: 0,
    funded_txo_sum: 0,
    spent_txo_count: 0,
    spent_txo_sum: 0,
    tx_count: 0
  }
}
balance = 51546
*/
  let balance = 0;
  await axios
    .get(`https://mempool.space/testnet/api/address/${address}`)
    .then((res) => {
      balance = res.data.chain_stats.funded_txo_sum - res.data.chain_stats.spent_txo_sum;
    })
    .catch((err) => {
      console.log(err);
    });
  return balance;
};
