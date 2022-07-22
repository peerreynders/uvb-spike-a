export type FrameArray = {
  kind: 'array';
  result: unknown[];
  index: number;
  actual: unknown[];
  expected: unknown[];
};

export type FrameObject = {
  kind: 'object';
  result: Record<string, unknown>;
  index: number;
  keys: string[];
  actual: Record<string, unknown>;
  expected: Record<string, unknown>;
};
