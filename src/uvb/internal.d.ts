export type State<U extends object = Record<string, never>> = {
  __test__: string;
  __suite__: string;
} & U;

export type Handler<U extends object = Record<string, never>> = (
  state?: State<U>
) => void | Promise<void>;
export type TestEntry<U extends object = Record<string, never>> = [
  name: string,
  handler: Handler<U>
];

export type Context<U extends object = Record<string, never>> = {
  tests: TestEntry<U>[];
  before: Handler<U>[];
  after: Handler<U>[];
  bEach: Handler<U>[];
  aEach: Handler<U>[];
  only: TestEntry<U>[];
  skipped: number;
  state: State<U>;
};

export type EndResult = {
  withErrors: boolean;
  done: number;
  skipped: number;
  total: number;
  duration: number;
};

export type SuiteErrors = [
  error: unknown,
  testName: string,
  suiteName: string
][];

export interface Reporter {
  suiteStart: (name: string) => void;
  suiteResult: (
    errors: SuiteErrors,
    selected: number,
    done: number,
    skipped: number
  ) => void;
  testPass: () => void;
  testFail: () => void;
  result: (result: EndResult) => void;
  isAttached: () => boolean;
  onDetach: (handler: () => void) => void;
}

export type RunResult = [
  done: number,
  skipped: number,
  selected: number,
  withErrors: boolean
];

export type RunSuite = (reporter: Reporter) => () => Promise<true | RunResult>;

// diff
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

// Only supported under V8
//
export interface ErrorConstructor {
  captureStackTrace(thisArg: unknown, func: unknown): void;
}

export type TypeofType =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function';

// uvb-report

export type EntrySuiteStart = {
  kind: 'suite-start';
  name: string;
};

export type EntrySuiteTest = {
  kind: 'suite-test';
  passed: boolean;
};

export type EntrySuiteResult = {
  kind: 'suite-result';
  selected: number;
  passed: number;
  skipped: number;
  errors: SuiteErrors;
};

export type EntryEndResult = {
  kind: 'end-result';
  endResult: EndResult;
};

export type ReportEntry =
  | EntrySuiteStart
  | EntrySuiteTest
  | EntrySuiteResult
  | EntryEndResult;

export type ReportSummary = {
  withErrors: boolean;
  withSkips: boolean;
  total: string;
  passed: string;
  skipped: string;
  duration: string;
};

export type ReportError = {
  suiteName: string;
  testName: string;
  message: string;
  operator: string;
  stack: string;
};

export type SummaryRefs = {
  total: HTMLTableCellElement;
  passedRow: HTMLTableRowElement;
  passed: HTMLTableCellElement;
  skipped: HTMLTableCellElement;
  duration: HTMLTableCellElement;
  tbody: HTMLTableSectionElement;
};

export type SuiteRefs = {
  header: HTMLTableCellElement;
  count: HTMLTableCellElement;
  indicators: HTMLTableCellElement;
  id: string;
  outcomes: string[];
};
