import axios, { AxiosRequestConfig } from 'axios';
import BigNumber from 'bignumber.js';
import { AddressTxsUtxo, ICreateTxResp, ICreateRawTxResp, ICreateTxBuyResp, ICreateTxSellResp, Inscription, UTXO } from './types';

const getScriptFromTxId = async (txId, vout,testnet = false) => {
  const apiUrl = testnet ? `https://mempool.space/testnet/api/tx/${txId}` : `https://mempool.space/api/tx/${txId}`;

  try {
    const response = await axios.get(apiUrl);
    const transaction = response.data;

    const output = transaction.vout[vout];
    if (output) {
      const script = output;
      return script;
    } else {
      console.log('Output not found');
      return '';
    }
  } catch (error) {
    console.log(error);
    return '';
  }
};

export const getAllUnspentTransactions_mempool = async (address, symbol, testnet = false) => {
  const apiUrl = testnet? `https://mempool.space/testnet/api/address/${address}/utxo` : `https://mempool.space/api/address/${address}/utxo`;

  try {
    const response = await axios.get(apiUrl);
    const unspentTransactions = response.data;
    const promises = unspentTransactions.map(async (utxo: AddressTxsUtxo) => {
      let scripData = await getScriptFromTxId(utxo.txid, utxo.vout, testnet);
      return {
        hash: utxo.txid,
        index: utxo.vout,
        value: utxo.value,
        blockHeight: utxo.status.block_height,
        script: scripData.scriptpubkey,
        address: scripData.scriptpubkey_address,
        type: scripData.scriptpubkey_type,
      };
    });
    return Promise.all(promises);
  } catch (error) {
    console.error(error);
    return [];
  }
};