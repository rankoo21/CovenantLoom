import {readFile,writeFile} from "node:fs/promises";
import {generatePrivateKey} from "viem/accounts";
import {createAccount,createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {TransactionStatus} from "genlayer-js/types";
const d=JSON.parse(await readFile(new URL("../artifacts/deployment.json",import.meta.url),"utf8"));
const owner=createAccount(generatePrivateKey()),challenger=createAccount(generatePrivateKey());
const a=createClient({chain:studionet,account:owner}),b=createClient({chain:studionet,account:challenger}),events=[];
async function send(client,functionName,args){const hash=await client.writeContract({address:d.address,functionName,args,value:0n});console.log(functionName+": "+hash);await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,retries:180,interval:2500});const tx=await client.getTransaction({hash}); if(tx.result_name!=="MAJORITY_AGREE")throw Error("Consensus failed for "+functionName+": "+tx.result_name); events.push({functionName,hash});}
await send(a,"create_covenant",["CHALLENGE-COV","Document package review","The delivery report must include an explicit file count of two."]);
await send(a,"open_checkpoint",["CHALLENGE-CP","CHALLENGE-COV","Review the delivery package using the attached report."]);
await send(a,"submit_fulfillment",["CHALLENGE-CP","The delivery report explicitly states that the file count is two.","Report excerpt: file count = 2. The two entries are alpha.md and beta.md."]);
await send(b,"challenge_fulfillment",[owner.address,"CHALLENGE-CP","The original report explicitly gives a file count of two, but the corrected manifest gives a file count of one and states beta.md was never delivered."]);
const r=JSON.parse(String(await a.readContract({address:d.address,functionName:"get_checkpoint",args:[owner.address,"CHALLENGE-CP"]})));
if(r.status!=="CHALLENGED"||r.history.length!==2||!r.history[1].packet.counter_evidence||r.history[0].packet.report!==r.report)throw Error("Challenge/history readback failed: "+JSON.stringify(r));
await writeFile(new URL("../artifacts/live-challenge.json",import.meta.url),JSON.stringify({address:d.address,owner:owner.address,challenger:challenger.address,events,record:r},null,2));
console.log("CHALLENGE CHECK PASSED");
