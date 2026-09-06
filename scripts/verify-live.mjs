import {readFile,writeFile} from 'node:fs/promises';
import {generatePrivateKey} from 'viem/accounts';
import {createAccount,createClient} from 'genlayer-js';import {studionet} from 'genlayer-js/chains';import {TransactionStatus} from 'genlayer-js/types';
const d=JSON.parse(await readFile(new URL('../artifacts/deployment.json',import.meta.url),'utf8')),address=d.address,events=[];
const owner=createClient({chain:studionet,account:createAccount(generatePrivateKey())}),party=createClient({chain:studionet,account:createAccount(generatePrivateKey())}),observer=createClient({chain:studionet,account:createAccount(generatePrivateKey())});
async function write(client,functionName,args){const hash=await client.writeContract({address,functionName,args,value:0n});console.log(functionName+': '+hash);await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,retries:180,interval:2500});const tx=await client.getTransaction({hash});const rs=tx.consensus_data?.leader_receipt;const leader=Array.isArray(rs)?rs.find(x=>x.mode==='leader')||rs[0]:rs;if(tx.result_name!=='MAJORITY_AGREE'||leader?.execution_result!=='SUCCESS')throw Error(functionName+' failed: '+tx.result_name+'/'+leader?.execution_result);events.push({functionName,hash});}
async function read(fn,args){return JSON.parse(String(await observer.readContract({address,functionName:fn,args})));}function check(x,m){if(!x)throw Error(m)}
const oid=owner.account.address,pid=party.account.address,url='https://raw.githubusercontent.com/rankoo21/CovenantLoom/master/README.md';
await write(owner,'create_covenant',['LIVE-COV','Counterparty evidence agreement','The published document must explicitly identify the project as Covenant Loom.',pid]);
await write(owner,'open_checkpoint',['LIVE-CP','LIVE-COV','Verify the project name in the counterparty-published repository document.',3600]);
await write(party,'submit_fulfillment',[oid,'LIVE-CP',url]);let r=await read('get_checkpoint',[oid,'LIVE-CP']);check(r.status==='CHALLENGE_WINDOW'&&r.source_url===url&&r.source_digest.length===64,'authenticated submission failed');
await write(owner,'challenge_fulfillment',['LIVE-CP','Clarify that the published source is bound to the designated counterparty and fetched by validators.']);
await write(party,'submit_rebuttal',[oid,'LIVE-CP',url]);await write(observer,'finalize_checkpoint',[oid,'LIVE-CP']);r=await read('get_checkpoint',[oid,'LIVE-CP']);check(r.status==='FINAL'&&r.history.length===4&&r.rebuttal_digest.length===64,'dispute lifecycle failed');
await writeFile(new URL('../artifacts/live-verification.json',import.meta.url),JSON.stringify({address,owner:oid,counterparty:pid,observer:observer.account.address,events,final_record:r},null,2)+'\n');console.log('LIVE COUNTERPARTY LIFECYCLE PASSED');
