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
