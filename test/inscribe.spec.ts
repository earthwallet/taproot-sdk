import * as bitcoin from 'bitcoinjs-lib';
import { getAllUnspentTransactions_mempool } from '../src/bitcoin/btc';
import { SafeCardinalUTXO, btc_inscribe, getInscribeTxsInfo } from '../src/bitcoin/inscribe';

const TEST_MNE_1 =
  'open jelly jeans corn ketchup supreme brief element armed lens vault weather original scissors rug priority vicious lesson raven spot gossip powder person volcano';

describe('Create Inscription', async () => {
  it('create inscription', async () => {
    return;
    const utxos = await getAllUnspentTransactions_mempool(
      'bc1pyj9qkgtlfnalxg925ks973wff5rvsfyctqmgrwrwj7e84f628gvsgjcpyk',
      'BTC_TAPROOT',
      false
    );

    /*
 {
  status: string; // for now always mined
  txId: string;
  index: number;
  value: number;
  script: string;
  address: string;
  blockHeight: number;
  type: string;
  inscriptions: never;
}
    */
    const parsedUtxos: SafeCardinalUTXO[] =
      utxos?.length > 0
        ? utxos?.map((utxo: any) => ({
            ...utxo,
            txId: utxo.hash,
            status: 'mined',
          }))
        : [];
    console.log(parsedUtxos, 'parsedUtxos');

   
    const respo = await btc_inscribe(
      TEST_MNE_1,
      'text/plain;charset=utf-8',
      'hello world',
      null,
      null,
      'bc1pyj9qkgtlfnalxg925ks973wff5rvsfyctqmgrwrwj7e84f628gvsgjcpyk',
      parsedUtxos,
      'bc1pyj9qkgtlfnalxg925ks973wff5rvsfyctqmgrwrwj7e84f628gvsgjcpyk',
      700,
      0,
      {
        feeAmount: 0,
        feeReceiver: 'bc1pyj9qkgtlfnalxg925ks973wff5rvsfyctqmgrwrwj7e84f628gvsgjcpyk',
      },
      bitcoin.networks.bitcoin,
      10,
      false
    );
    console.log('respo', respo);
  });
});

describe('Create Testnet Inscription', async () => {
  it('create Testnet inscription', async () => {
    const myAddress = 'tb1p5hwep2dna6wjhk6atjh0uyjmmp095y2arz3z32c9udmde7qrgwrseypr8x';
    const utxos = await getAllUnspentTransactions_mempool(myAddress, 'BTC_TAPROOT', true);

    /*
 {
  status: string; // for now always mined
  txId: string;
  index: number;
  value: number;
  script: string;
  address: string;
  blockHeight: number;
  type: string;
  inscriptions: never;
}
    */
    const parsedUtxos: SafeCardinalUTXO[] =
      utxos?.length > 0
        ? utxos?.map((utxo: any) => ({
            ...utxo,
            txId: utxo.hash,
            status: 'mined',
          }))
        : [];

    const cardinalUTXOsToUse = parsedUtxos;
    const content = {
      data: 'hello world',
      mime: 'text/plain;charset=utf-8',
    };
    const websiteFeeInSats = 0;
    const feeRate = 7;
    const serviceFee = {
      feeAmount: 0, // in dollars
      feeReceiver: 'tb1p5hwep2dna6wjhk6atjh0uyjmmp095y2arz3z32c9udmde7qrgwrseypr8x',
    };
    const websiteFee = {
      websiteFeeInSats: null,
      websiteFeeReceiver: null,
    };
    const btcPrice = 27000; // in USD
    const network = bitcoin.networks.testnet;
    const { chosenUTXOs, change, commitCost, revealCost, postageSize } = getInscribeTxsInfo(
      cardinalUTXOsToUse,
      content.data,
      myAddress,
      feeRate,
      serviceFee.feeAmount,
      serviceFee.feeReceiver,
      btcPrice,
      websiteFeeInSats,
      network
    );
    const inscriptionReceiver = myAddress;
    const committerAddress = myAddress;
    console.log(commitCost, revealCost, chosenUTXOs, change, postageSize, 'costs');
    const respo = await btc_inscribe(
      TEST_MNE_1,
      content.mime,
      content.data,
      websiteFee.websiteFeeReceiver,
      websiteFee.websiteFeeInSats,
      inscriptionReceiver,
      chosenUTXOs,
      committerAddress,
      revealCost,
      change,
      serviceFee,
      network,
      postageSize,
      true
    );
    console.log('respo', respo);
  });
});