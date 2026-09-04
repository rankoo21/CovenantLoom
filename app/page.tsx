'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLedger } from '@/lib/ledger';
import deployment from '@/artifacts/deployment.json';
export default function Home() {
  const l = useLedger(deployment.address),
    [covs, setCovs] = useState<any[]>([]),
    [cps, setCps] = useState<any[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  const [f, setF] = useState<Record<string, string>>({
    cov: '',
    title: '',
    terms: '',
    cp: '',
    deliverable: '',
    report: '',
    evidence: '',
    target: '',
    targetId: '',
    counter: '',
  });
  const [external, setExternal] = useState<any>(null);
  const field = (name: string, label: string, multi = false) => (
    <label className="block mt-4 text-sm">
      {label}
      {multi ? (
        <Textarea
          className="mt-2 min-h-24 bg-white/5"
          value={f[name]}
          onChange={(e) => setF({ ...f, [name]: e.target.value })}
        />
      ) : (
        <Input
          className="mt-2 bg-white/5"
          value={f[name]}
          onChange={(e) => setF({ ...f, [name]: e.target.value })}
        />
      )}
    </label>
  );
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      setCovs(l.account ? await l.read('list_covenants', [l.account]) : []);
      setCps(l.account ? await l.read('list_checkpoints', [l.account]) : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setCovs([]);
    setCps([]);
    setExternal(null);
    void refresh();
  }, [l.account]);
  const id = (s: string) => s.trim().toUpperCase();
  async function act(
    method: string,
    args: string[],
    view: string,
    key: string,
    test: (v: any) => boolean,
    owner = l.account,
  ) {
    await l.write(method, args, async () =>
      test(await l.read(view, [owner, key])),
    );
    await refresh();
  }
  async function lookup() {
    try {
      setExternal(
        await l.read('get_checkpoint', [f.target.trim(), id(f.targetId)]),
      );
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  }
  return (
    <main className="min-h-screen bg-[#241820] text-[#f7eddc]">
      <header className="p-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/20">
        <div>
          <h1 className="text-3xl font-serif">Covenant Loom</h1>
          <p className="text-xs tracking-widest text-[#e4b970]">
            VERSIONED PROMISES / TEXT ASSESSMENT
          </p>
        </div>
        <Button onClick={l.connect} disabled={l.busy}>
          {l.account ? l.account.slice(0, 8) + '…' : 'Connect wallet'}
        </Button>
      </header>
      <section className="p-6 lg:p-10">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-4xl font-serif">
              One promise. An unbroken record.
            </h2>
            <p className="max-w-3xl mt-3 text-sm opacity-80">
              Create your own terms, freeze a checkpoint, then assess the
              supplied report against that exact version. This is not external
              verification, legal arbitration, or escrow. Creators can finalize
              without a mandatory challenge window.
            </p>
          </div>
          <a
            className="underline text-sm"
            href={
              'https://explorer-studio.genlayer.com/address/' +
              deployment.address
            }
          >
            Studionet contract ↗
          </a>
        </div>
        <div
          role="status"
          aria-live="polite"
          className="my-5 p-4 border border-[#e4b970]/40 rounded-xl"
        >
          {l.message || 'Connect a wallet to load its on-chain workspace.'}
          {l.hash && (
            <a
              className="block underline break-all text-xs mt-2"
              href={'https://explorer-studio.genlayer.com/tx/' + l.hash}
            >
              Transaction: {l.hash}
            </a>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="grid xl:grid-cols-[340px_1fr_340px] gap-6">
          <aside className="rounded-2xl bg-white/5 p-5">
            <h2 className="text-xl text-[#e4b970]">01 / Establish terms</h2>
            <p className="text-xs mt-2">
              IDs: 3–48 letters/digits/-/_. One obligation per line, 20–600
              characters each; 1–8 obligations.
            </p>
            {field('cov', 'Covenant ID')}
            {field('title', 'Title (8–120 characters)')}
            {field('terms', 'Canonical obligations', true)}
            <Button
              className="mt-4"
              disabled={!l.account || l.busy}
              onClick={() =>
                act(
                  'create_covenant',
                  [id(f.cov), f.title.trim(), f.terms.trim()],
                  'get_covenant',
                  id(f.cov),
                  (v) => v.title === f.title.trim() && v.version === 1,
                )
              }
            >
              Create covenant
            </Button>
            <Button
              variant="outline"
              className="mt-3 ml-2"
              disabled={
                !l.account || l.busy || !covs.some((c) => c.id === id(f.cov))
              }
              onClick={() => {
                const before = covs.find((c) => c.id === id(f.cov));
                void act(
                  'revise_covenant',
                  [id(f.cov), f.terms.trim()],
                  'get_covenant',
                  id(f.cov),
                  (v) => v.version === before.version + 1,
                );
              }}
            >
              Revise
            </Button>
            <h2 className="text-xl text-[#e4b970] mt-8">
              02 / Freeze checkpoint
            </h2>
            {field('cp', 'Checkpoint ID')}
            {field('deliverable', 'Deliverable (20–1500 characters)', true)}
            <Button
              className="mt-4"
              disabled={!l.account || l.busy}
              onClick={() =>
                act(
                  'open_checkpoint',
                  [id(f.cp), id(f.cov), f.deliverable.trim()],
                  'get_checkpoint',
                  id(f.cp),
                  (v) =>
                    v.status === 'OPEN' &&
                    v.deliverable === f.deliverable.trim(),
                )
              }
            >
              Open checkpoint
            </Button>
          </aside>
          <section>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif">Your threads</h2>
              <Button disabled={loading || l.busy} onClick={refresh}>
                Refresh
              </Button>
            </div>
            <p className="my-3 text-xs">
              {loading
                ? 'Reading chain…'
                : l.account
                  ? covs.length + ' covenants · ' + cps.length + ' checkpoints'
                  : 'No wallet connected'}
            </p>
            {covs.map((c) => (
              <details
                className="p-4 border border-white/15 rounded-xl mb-3"
                key={c.id}
              >
                <summary>
                  {c.id} · {c.title} · v{c.version}
                </summary>
                <ol className="mt-3 list-decimal ml-5 text-sm">
                  {c.obligations.map((o: string, i: number) => (
                    <li key={i}>{o}</li>
                  ))}
                </ol>
                <Button
                  className="mt-3"
                  onClick={() =>
                    setF({
                      ...f,
                      cov: c.id,
                      title: c.title,
                      terms: c.obligations.join('\n'),
                    })
                  }
                >
                  Use covenant
                </Button>
              </details>
            ))}
            {cps.map((c) => (
              <article
                key={c.id}
                className="p-5 rounded-2xl bg-[#f7eddc] text-[#241820] mb-4"
              >
                <div className="flex justify-between">
                  <b>{c.id}</b>
                  <span>{c.status}</span>
                </div>
                <p className="text-xs mt-2">
                  {c.covenant_id} / frozen v{c.covenant_version}
                </p>
                <p className="my-3">{c.deliverable}</p>
                <b>{c.outcome || 'Not assessed'}</b>
                <p className="text-sm mt-2">{c.reason}</p>
                <details className="mt-3 text-xs">
                  <summary>
                    Canonical snapshot, submitted text & history
                  </summary>
                  <pre className="whitespace-pre-wrap overflow-auto mt-3">
                    {JSON.stringify(c, null, 2)}
                  </pre>
                </details>
                <div className="flex flex-wrap gap-2 mt-4">
                  {c.status === 'OPEN' && (
                    <>
                      <Button onClick={() => setF({ ...f, cp: c.id })}>
                        Select for report
                      </Button>
                      <Button
                        disabled={l.busy}
                        onClick={() =>
                          act(
                            'cancel_checkpoint',
                            [c.id],
                            'get_checkpoint',
                            c.id,
                            (v) => v.status === 'CANCELLED',
                          )
                        }
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {['EVALUATED', 'CHALLENGED'].includes(c.status) && (
                    <Button
                      disabled={l.busy}
                      onClick={() =>
                        act(
                          'finalize_checkpoint',
                          [c.id],
                          'get_checkpoint',
                          c.id,
                          (v) => v.status === 'FINAL',
                        )
                      }
                    >
                      Finalize (closes challenges)
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </section>
          <aside className="p-5 rounded-2xl bg-white/5">
            <h2 className="text-xl text-[#e4b970]">
              03 / Assess delivery text
            </h2>
            <p className="text-xs mt-2">
              Uses checkpoint ID from step 02. All text is public. Do not submit
              secrets.
            </p>
            {field('report', 'Report (50–4000 characters)', true)}
            {field('evidence', 'Supporting text (30–4000 characters)', true)}
            <Button
              className="mt-4"
              disabled={!l.account || l.busy}
              onClick={() =>
                act(
                  'submit_fulfillment',
                  [id(f.cp), f.report.trim(), f.evidence.trim()],
                  'get_checkpoint',
                  id(f.cp),
                  (v) =>
                    v.status === 'EVALUATED' &&
                    v.report === f.report.trim() &&
                    v.evidence === f.evidence.trim(),
                )
              }
            >
              Assess checkpoint
            </Button>
            <h2 className="text-xl text-[#e4b970] mt-8">
              Independent challenge
            </h2>
            <p className="text-xs mt-2">
              Another wallet may challenge once before the creator finalizes.
              The original report stays in history.
            </p>
            {field('target', 'Creator wallet address')}
            {field('targetId', 'Checkpoint ID')}
            <Button className="mt-3" onClick={lookup}>
              Look up checkpoint
            </Button>
            {external && (
              <pre className="text-xs whitespace-pre-wrap mt-3">
                {external.id
                  ? external.id +
                    ' · ' +
                    external.status +
                    ' · ' +
                    external.outcome
                  : 'Checkpoint not found'}
              </pre>
            )}
            {field('counter', 'Counter-evidence (40–4000 characters)', true)}
            <Button
              className="mt-4"
              disabled={
                !l.account || l.busy || external?.status !== 'EVALUATED'
              }
              onClick={async () => {
                await act(
                  'challenge_fulfillment',
                  [f.target.trim(), id(f.targetId), f.counter.trim()],
                  'get_checkpoint',
                  id(f.targetId),
                  (v) =>
                    v.status === 'CHALLENGED' &&
                    v.history[1]?.packet.counter_evidence === f.counter.trim(),
                  f.target.trim(),
                );
                await lookup();
              }}
            >
              Submit challenge
            </Button>
          </aside>
        </div>
      </section>
    </main>
  );
}
