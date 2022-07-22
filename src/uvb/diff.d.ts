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

type ObjectF = {
  [key: string]: unknown;
};

type FrameObject = {
  kind: 'object';
  result: ObjectF;
  index: number;
  keys: string[];
  actual: ObjectF;
  expected: ObjectF;
};

export type {
  DiffArrays,
  DiffLines,
  DiffChars,
  DiffDirect,
  ObjectF,
  FrameArray,
  FrameObject,
};
