import { configure, exec } from './uvb';
import { all as allUvb } from './tests/uvb';
import { all as allSuite } from './tests/suite';
import { all as allAssert } from './tests/assert';
import { all as allDiff } from './tests/diff';

import type { EndResult, Reporter, SuiteErrors } from './uvb';

const testReporter = (function (): Reporter {
  return {
    suiteStart: (name: string) => console.log('suiteStart', name),
    suiteResult: (
      errors: SuiteErrors,
      selected: number,
      done: number,
      skipped: number
    ) => console.log('suiteResult', errors, selected, done, skipped),
    testPass: () => console.log('testPass'),
    testFail: () => console.error('testFail'),
    result: (result: EndResult) => console.log('result', result),
  };
})();

configure({
  reporter: testReporter,
  bail: false,
  autorun: false,
});

// schedule test execution
for (const run of allUvb()) run();
for (const run of allSuite()) run();
for (const run of allAssert()) run();
for (const run of allDiff()) run();

// execute all scheduled tests (automatic with `autorun: true`)
exec().then((withErrors) =>
  console.log(`exec() finished withErrors: ${withErrors}`)
);
