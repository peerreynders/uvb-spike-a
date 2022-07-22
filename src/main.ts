import { configure, suite } from './uvb/core';
import { all as allAssert } from './tests/assert';
import { all as allDiff } from './tests/diff';

const testReporter = (function () {
  return {
    groupStart,
    groupResult,
    testPass,
    testFail,
    result,
  };

  function groupStart(name) {
    console.log('groupStart', name);
  }

  function groupResult(errors, selected, done, skipped) {
    console.log('groupResult', errors, selected, done, skipped);
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

configure(testReporter, { bail: false });

// schedule test execution
for (const run of allAssert()) run();
for (const run of allDiff()) run();
