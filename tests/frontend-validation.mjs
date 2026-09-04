import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest } from '../lib/validation.ts';
test('reject invalid input before wallet', () => {
  assert.throws(() =>
    validateRequest('submit_memory', ['x', 'short', 'missing', 'PUBLIC']),
  );
  assert.throws(() =>
    validateRequest('challenge_fulfillment', [
      'not-a-wallet',
      'CP-001',
      'x'.repeat(50),
    ]),
  );
  assert.throws(() =>
    validateRequest('create_covenant', ['COV-001', 'Valid title', 'short']),
  );
});
test('accept complete edited payloads', () => {
  assert.doesNotThrow(() =>
    validateRequest('submit_memory', [
      'MEM-002',
      'An operator prefers readable summary paragraphs.',
      'The operator stated this preference during the session.',
      'PUBLIC',
    ]),
  );
  assert.doesNotThrow(() =>
    validateRequest('create_covenant', [
      'COV-002',
      'Delivery report',
      'The report must include a detailed release summary.',
    ]),
  );
});
