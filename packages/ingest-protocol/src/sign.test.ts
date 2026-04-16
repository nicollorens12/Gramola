import { describe, expect, it } from 'vitest';
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, sign } from './sign';
import { verify, VerifyError } from './verify';

const SECRET = 'test-secret-does-not-matter-its-deterministic';

describe('sign + verify round-trip', () => {
  it('verifies a signature produced by sign()', () => {
    const body = JSON.stringify({ hello: 'world' });
    const { timestamp, signature } = sign(body, SECRET, 1_700_000_000);

    const result = verify(
      body,
      { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: signature },
      SECRET,
      { nowSeconds: 1_700_000_010 },
    );

    expect(result.timestamp).toBe(1_700_000_000);
  });

  it('accepts headers with mixed casing', () => {
    const body = '{"x":1}';
    const { timestamp, signature } = sign(body, SECRET, 1_700_000_000);

    const result = verify(
      body,
      { 'X-Gramola-Timestamp': timestamp, 'X-Gramola-Signature': signature },
      SECRET,
      { nowSeconds: 1_700_000_000 },
    );

    expect(result.timestamp).toBe(1_700_000_000);
  });

  it('rejects when headers are missing', () => {
    expect(() => verify('{}', {}, SECRET)).toThrow(VerifyError);
    try {
      verify('{}', {}, SECRET);
    } catch (err) {
      expect((err as VerifyError).code).toBe('missing_headers');
    }
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ value: 1 });
    const { timestamp, signature } = sign(body, SECRET, 1_700_000_000);
    const tampered = JSON.stringify({ value: 2 });

    expect(() =>
      verify(
        tampered,
        { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: signature },
        SECRET,
        { nowSeconds: 1_700_000_000 },
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'bad_signature' }),
    );
  });

  it('rejects a tampered signature', () => {
    const body = '{}';
    const { timestamp, signature } = sign(body, SECRET, 1_700_000_000);
    const flipped = signature.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));

    expect(() =>
      verify(
        body,
        { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: flipped },
        SECRET,
        { nowSeconds: 1_700_000_000 },
      ),
    ).toThrowError(expect.objectContaining({ code: 'bad_signature' }));
  });

  it('rejects when the timestamp is outside the skew window', () => {
    const body = '{}';
    const { timestamp, signature } = sign(body, SECRET, 1_700_000_000);

    // 10 minutes later, default 5-min window.
    expect(() =>
      verify(
        body,
        { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: signature },
        SECRET,
        { nowSeconds: 1_700_000_000 + 10 * 60 },
      ),
    ).toThrowError(expect.objectContaining({ code: 'stale_timestamp' }));
  });

  it('rejects a non-numeric timestamp', () => {
    const body = '{}';
    const { signature } = sign(body, SECRET, 1_700_000_000);
    expect(() =>
      verify(
        body,
        { [TIMESTAMP_HEADER]: 'not-a-number', [SIGNATURE_HEADER]: signature },
        SECRET,
      ),
    ).toThrowError(expect.objectContaining({ code: 'invalid_timestamp' }));
  });

  it('rejects a wrong secret', () => {
    const body = '{}';
    const { timestamp, signature } = sign(body, SECRET, 1_700_000_000);

    expect(() =>
      verify(
        body,
        { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: signature },
        'different-secret',
        { nowSeconds: 1_700_000_000 },
      ),
    ).toThrowError(expect.objectContaining({ code: 'bad_signature' }));
  });

  it('sign() throws on empty secret', () => {
    expect(() => sign('{}', '')).toThrow();
  });
});
