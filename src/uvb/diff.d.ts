import type { ArrayChange, Change } from 'diff';

type DiffArrays<TOld, TNew> = {
  kind: 'arrays';
  diff: ArrayChange<TOld | TNew>[];
};

type DiffLines = {
  kind: 'lines';
  lineNo: number;
  diff: Change[];
};

type DiffChars = {
  kind: 'chars';
  diff: Change[];
};

type DiffDirect = {
  kind: 'direct';
  actual: string;
  expected: string;
  actualType: string;
  expectedType: string;
};

type FrameArray = {
  kind: 'array';
  result: unknown[];
  index: number;
  actual: unknown[];
  expected: unknown[];
};

type FrameObject = {
  kind: 'object';
  result: Record<string, unknown>;
  index: number;
  keys: string[];
  actual: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type {
  DiffArrays,
  DiffLines,
  DiffChars,
  DiffDirect,
  FrameArray,
  FrameObject,
};
