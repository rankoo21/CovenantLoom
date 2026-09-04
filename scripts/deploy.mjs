import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
const key = process.env.GENLAYER_PRIVATE_KEY;
if (!key) throw new Error('GENLAYER_PRIVATE_KEY is required');
const client = createClient({
  chain: studionet,
  account: createAccount(key.startsWith('0x') ? key : '0x' + key),
});
const code = await readFile(
  new URL('../contracts/covenant_loom.py', import.meta.url),
  'utf8',
);
const hash = await client.deployContract({ code, args: [] });
console.log('DEPLOY_TX=' + hash);
const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.FINALIZED,
  retries: 180,
  interval: 2500,
});
const address = receipt.to_address || receipt.recipient;
if (!address) throw new Error('Missing deployed address');
const deployed = await client.getContractCode(address);
const decoded = deployed.startsWith('0x')
  ? Buffer.from(deployed.slice(2), 'hex').toString('utf8')
  : deployed;
if (decoded !== code) throw new Error('Deployed source does not match');
const evidence = {
  address,
  transaction: hash,
  source_sha256: createHash('sha256').update(code).digest('hex'),
  network: 'studionet',
  source_verified: true,
};
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../artifacts/deployment.json', import.meta.url),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
