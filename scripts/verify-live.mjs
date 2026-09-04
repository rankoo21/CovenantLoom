import { readFile, writeFile } from 'node:fs/promises';
import { generatePrivateKey } from 'viem/accounts';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
const d = JSON.parse(
  await readFile(
    new URL('../artifacts/deployment.json', import.meta.url),
    'utf8',
  ),
);
const account = createAccount(generatePrivateKey()),
  client = createClient({ chain: studionet, account });
const address = d.address,
  events = [];
async function write(functionName, args) {
  const hash = await client.writeContract({
    address,
    functionName,
    args,
    value: 0n,
  });
  console.log(functionName + ': ' + hash);
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 180,
    interval: 2500,
  });
  const tx = await client.getTransaction({ hash });
  if (tx.result_name !== 'MAJORITY_AGREE')
    throw Error('Consensus failed for ' + functionName + ': ' + tx.result_name);
  events.push({ functionName, hash });
}
async function read(functionName, args) {
  return JSON.parse(
    String(await client.readContract({ address, functionName, args })),
  );
}
function check(ok, msg) {
  if (!ok) throw Error(msg);
}

await write('create_covenant', [
  'SMOKE-COV',
  'Release documentation agreement',
  'The report must list the names of two delivered files.',
]);
await write('open_checkpoint', [
  'SMOKE-CP',
  'SMOKE-COV',
  'Assess the supplied release documentation report.',
]);
await write('revise_covenant', [
  'SMOKE-COV',
  'The report must list the names of five delivered files.',
]);
await write('submit_fulfillment', [
  'SMOKE-CP',
  'The delivered package contains the following two files: release.md and changes.md.',
  'Delivery manifest excerpt: release.md contains release notes; changes.md contains the detailed change log.',
]);
const r = await read('get_checkpoint', [account.address, 'SMOKE-CP']);
check(
  r.status === 'EVALUATED' &&
    r.covenant_version === 1 &&
    r.obligations[0].includes('two'),
  'Snapshot or assessment failed: ' + JSON.stringify(r),
);
check(r.outcome === 'SATISFIED', 'Unexpected assessment ' + JSON.stringify(r));
await write('finalize_checkpoint', ['SMOKE-CP']);
check(
  (await read('get_checkpoint', [account.address, 'SMOKE-CP'])).status ===
    'FINAL',
  'Finalization failed',
);
await writeFile(
  new URL('../artifacts/live-verification.json', import.meta.url),
  JSON.stringify(
    { address, reviewer: account.address, events, assessed_record: r },
    null,
    2,
  ),
);
console.log('LIVE CHECKS PASSED');
