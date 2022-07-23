import type { ArrayChange, Change } from 'diff';
import type {
  Handler,
  GroupErrors,
  Reporter,
  EndResult,
  TypeofType,
} from './internal';

// suite
export import Handler = Handler;

export type RegisterHook<U extends object = {}> = (handler: Handler<U>) => void;
export type RegisterHookTop<U extends object = {}> = {
  (handler: Handler<U>): void;
  each: RegisterHook<U>;
};
export type RegisterTest<U extends object = {}> = (
  name: string,
  handler: Handler<U>
) => void;
export type RegisterSkip<U extends object = {}> = (
  _name?: string,
  _handler?: Handler<U>
) => void;

export type Suite<U extends object = {}> = {
  (name: string, handler: Handler<U>): void;
  only: RegisterTest<U>;
  skip: RegisterSkip<U>;
  before: RegisterHookTop<U>;
  after: RegisterHookTop<U>;
  run: () => void;
};

export function configure(reporter: Reporter, options?: ReporterOptions);
export function suite<U extends object = {}>(name?: string, userContext?: U);

// run/reporter
export import EndResult = EndResult;

export import GroupErrors = GroupErrors;

export import Reporter = Reporter;

export type ReporterOptions = {
  bail?: boolean;
};

// --- assert
export type AssertionOptions = {
  message?: string;
  details: unknown;
  generated: boolean;
  operator: string;
  expected: unknown;
  actual: unknown;
};

export class Assertion extends Error {
  constructor(options: AssertionOptions);
  code: string;
  details: unknown;
  generated: boolean;
  operator: string;
  expected: unknown;
  actual: unknown;
}

export function equal(
  actual: unknown,
  expected: unknown,
  message?: string | Error
): void;

export function instance(
  actual: unknown,
  expected: Function,
  message?: string | Error
): void;

export function is(
  actual: unknown,
  expected: unknown,
  message?: string | Error
): void;

declare module is {
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

declare module not {
  function equal(
    actual: unknown,
    expected: unknown,
    message?: string | Error
  ): void;

  function instance(
    actual: unknown,
    expected: Function,
    message?: string | Error
  ): void;

  function match(
    actual: string,
    expected: string | RegExp,
    message?: string | Error
  ): void;

  function ok(actual: unknown, message?: string | Error): void;

  function throws(
    fn: () => void,
    expected: ((error: Error) => boolean) | RegExp,
    message?: string | Error
  ): void;

  function type(
    expected: unknown,
    expected: TypeofType,
    message?: string | Error
  ): void;
}

export function ok(actual: unknown, message?: string | Error): void;

export function throws(
  fn: () => void,
  expected: string | ((error: Error) => boolean) | RegExp,
  message?: string | Error
): void;

export function type(
  expected: unknown,
  expected: TypeofType,
  message?: string | Error
): void;

// --- diff
export type DiffArrays<TOld, TNew> = {
  kind: 'arrays';
  diff: ArrayChange<TOld | TNew>[];
};

export type DiffLines = {
  kind: 'lines';
  lineNo: number;
  diff: Change[];
};

export type DiffChars = {
  kind: 'chars';
  diff: Change[];
};

export type DiffDirect = {
  kind: 'direct';
  actual: string;
  expected: string;
  actualType: string;
  expectedType: string;
};

export function arrays<TOld, TNew>(
  actual: TOld[],
  expected: TNew[]
): DiffArrays<TOld, TNew>;

export function lines(
  actual: string,
  expected: string,
  lineNo?: number
): DiffLines;

export function chars(actual: string, expected: string): DiffChars;

export function direct(actual: unknown, expected: unknown): DiffDirect;

export function sort(
  actual: Record<string, unknown> | unknown[],
  expected: Record<string, unknown> | unknown[]
): Record<string, unknown> | unknown[];

export function circular(): (key: string, value: unknown) => unknown;

export function stringify(value: unknown): string;

export function compare(
  actual: unknown,
  expected: unknown
): DiffArrays<unknown, unknown> | DiffLines | DiffChars | DiffDirect;
