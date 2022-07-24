import { configure, exec } from './uvb';
import { all as allUvb } from './tests/uvb';
import { all as allAssert } from './tests/assert';
import { all as allDiff } from './tests/diff';

const testReporter = (function () {
  return {
    suiteStart,
    suiteResult,
    testPass,
    testFail,
    result,
  };

  function suiteStart(name) {
    console.log('suiteStart', name);
  }

  function suiteResult(errors, selected, done, skipped) {
    console.log('suiteResult', errors, selected, done, skipped);
  }

  function testPass() {
    console.log('testPass');
  }

  function testFail() {
    console.log('testFail');
  }

  function result(results) {
    console.log('result', results);
  }
})();

configure({
  reporter: testReporter,
  bail: false,
  autorun: false,
});

// schedule test execution
for (const run of allUvb()) run();
for (const run of allAssert()) run();
for (const run of allDiff()) run();

// execute all scheduled tests
exec().then((withErrors) =>
  console.log(`exec() finished withErrors: ${withErrors}`)
);
