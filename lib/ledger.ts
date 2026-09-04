'use client';
import { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import { validateRequest } from './validation';
export function useLedger(address: string) {
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [hash, setHash] = useState('');
  const reader = createClient({ chain: studionet });
  useEffect(() => {
    const eth = (window as any).ethereum;
    const reset = () => {
      setAccount('');
      setMessage('Wallet changed. Reconnect to reload your workspace.');
    };
    eth?.on?.('accountsChanged', reset);
    eth?.on?.('chainChanged', reset);
    return () => {
      eth?.removeListener?.('accountsChanged', reset);
      eth?.removeListener?.('chainChanged', reset);
    };
  }, []);
  async function connect() {
    try {
      const eth = (window as any).ethereum;
      if (!eth) throw Error('Install MetaMask to continue.');
      const [a] = await eth.request({ method: 'eth_requestAccounts' });
      const w = createClient({ chain: studionet, account: a, provider: eth });
      await w.connect('studionet');
      setAccount(a);
      setMessage('');
    } catch (e: any) {
      setMessage(e.message);
    }
  }
  async function read(method: string, args: any[]) {
    return JSON.parse(
      String(
        await reader.readContract({
          address: address as any,
          functionName: method,
          args,
        }),
      ),
    );
  }
  async function write(
    method: string,
    args: any[],
    verify: () => Promise<boolean>,
  ) {
    if (busy) return;
    setBusy(true);
    setHash('');
    setMessage('Waiting for wallet approval…');
    try {
      validateRequest(method, args);
    } catch (e: any) {
      setMessage('Please check your input: ' + e.message);
      setBusy(false);
      return;
    }
    try {
      if (!account) throw Error('Connect your wallet first.');
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_accounts' });
      if (accounts[0]?.toLowerCase() !== account.toLowerCase())
        throw Error('Wallet changed. Reconnect.');
      const writer = createClient({
        chain: studionet,
        account: account as any,
        provider: eth,
      });
      await writer.connect('studionet');
      const h = await writer.writeContract({
        address: address as any,
        functionName: method,
        args,
        value: BigInt(0),
      });
      setHash(h);
      setMessage('Submitted. Waiting for consensus and finalization…');
      await reader.waitForTransactionReceipt({
        hash: h,
        status: TransactionStatus.FINALIZED,
        retries: 180,
        interval: 2500,
      });
      const tx: any = await reader.getTransaction({ hash: h });
      const leaders = tx.consensus_data?.leader_receipt;
      const execution = Array.isArray(leaders)
        ? leaders[leaders.length - 1]
        : leaders;
      if (
        tx.result_name !== 'MAJORITY_AGREE' ||
        execution?.execution_result !== 'SUCCESS'
      )
        throw Error(
          'Consensus or execution failed: ' +
            (tx.result_name || 'unconfirmed result'),
        );
      if (!(await verify()))
        throw Error(
          'Transaction finalized but the expected state was not found. Check the explorer; do not assume success.',
        );
      setMessage('Confirmed: expected data read back from the contract.');
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }
  return { account, busy, message, hash, connect, read, write };
}
