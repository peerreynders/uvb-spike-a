export type ReportError = {
  suiteName: string;
  testName: string;
  message: string;
  operator: string;
  stack: string;
};

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

export type SuiteRefs = {
  header: HTMLTableCellElement;
  count: HTMLTableCellElement;
  indicators: HTMLTableCellElement;
  id: string;
  outcomes: string[];
};

export type SummaryRefs = {
  total: HTMLTableCellElement;
  passedRow: HTMLTableRowElement;
  passed: HTMLTableCellElement;
  skipped: HTMLTableCellElement;
  duration: HTMLTableCellElement;
  tbody: HTMLTableSectionElement;
};

export type ReportSummary = {
  withErrors: boolean;
  withSkips: boolean;
  total: string;
  passed: string;
  skipped: string;
  duration: string;
};
