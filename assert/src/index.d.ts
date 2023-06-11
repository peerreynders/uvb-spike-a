// --- assert
export type AssertionOptions = {
  message?: string;
  details?: unknown;
  generated?: boolean;
  operator?: string;
  expected?: unknown;
  actual?: unknown;
};

export class Assertion extends Error {
  constructor(options: AssertionOptions);
  code: string;
  details?: unknown;
  generated?: boolean;
  operator?: string;
  expected?: unknown;
  actual?: unknown;
}

export function equal(
  actual: unknown,
  expected: unknown,
  message?: string | Error
): void;

export function instance(
  actual: unknown,
  // eslint-disable-next-line @typescript-eslint/ban-types
  expected: Function,
  message?: string | Error
): void;

export function is(
  actual: unknown,
  expected: unknown,
  message?: string | Error
): void;

declare namespace is {
  function not(
    actual: unknown,
    expected: unknown,
    message?: string | Error
  ): void;
}

export function match(
  actual: string,
  expected: string | RegExp,
  message?: string | Error
): void;

export function not(actual: unknown, message?: string | Error): void;

declare namespace not {
  function equal(
    actual: unknown,
    expected: unknown,
    message?: string | Error
  ): void;

  function instance(
    actual: unknown,
    // eslint-disable-next-line @typescript-eslint/ban-types
    expected: Function,
    message?: string | Error
  ): void;

  function match(
    actual: string,
    expected: string | RegExp,
    message?: string | Error
  ): void;

  function ok(actual: unknown, message?: string | Error): void;

  function snapshot(
    actual: string,
    expected: string,
    message?: string | Error
  ): void;

  function throws(
    fn: () => void,
    expected?: ((error: Error) => boolean) | RegExp,
    message?: string | Error
  ): void;

  function type(
    expected: unknown,
    expected: TypeofType,
    message?: string | Error
  ): void;
}

export function ok(actual: unknown, message?: string | Error): void;

export function snapshot(
  actual: string,
  expected: string,
  message?: string | Error
): void;

export function throws(
  fn: () => void,
  expected?: string | ((error: Error) => boolean) | RegExp,
  message?: string | Error
): void;

export function type(
  expected: unknown,
  expected: TypeofType,
  message?: string | Error
): void;

export function unreachable(message?: string | Error): void;
