export function validateRequest(method: string, args: unknown[]) {
  const a = args.map(String);
  const identifier = (i: number) => {
    if (!/^[A-Z0-9_-]{3,48}$/.test(a[i]))
      throw Error('Use an ID of 3–48 uppercase letters, digits, - or _.');
  };
  const length = (i: number, min: number, max: number) => {
    if (a[i].length < min || a[i].length > max)
      throw Error(
        'Field ' +
          (i + 1) +
          ' must contain ' +
          min +
          '–' +
          max +
          ' characters.',
      );
  };
  if (method === 'challenge_fulfillment') {
    if (!/^0x[0-9a-fA-F]{40}$/.test(a[0]))
      throw Error('Enter a valid creator wallet address.');
    identifier(1);
    length(2, 40, 4000);
    return;
  }
  identifier(0);
  if (method === 'submit_memory') {
    length(1, 30, 1600);
    length(2, 25, 1000);
    if (!['PUBLIC', 'INTERNAL', 'RESTRICTED'].includes(a[3]))
      throw Error('Invalid sensitivity.');
  }
  if (method === 'resolve_quarantine') length(1, 25, 1000);
  if (method === 'create_covenant' || method === 'revise_covenant') {
    const i = method === 'create_covenant' ? 2 : 1;
    if (i === 2) length(1, 8, 120);
    const lines = a[i]
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      lines.length < 1 ||
      lines.length > 8 ||
      lines.some((s) => s.length < 20 || s.length > 600) ||
      new Set(lines).size !== lines.length
    )
      throw Error(
        'Use 1–8 unique obligations, each 20–600 characters, one per line.',
      );
  }
  if (method === 'open_checkpoint') {
    identifier(1);
    length(2, 20, 1500);
  }
  if (method === 'submit_fulfillment') {
    length(1, 50, 4000);
    length(2, 30, 4000);
  }
}
