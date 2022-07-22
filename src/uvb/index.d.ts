import type { ArrayChange, Change } from 'diff';

// diff
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
