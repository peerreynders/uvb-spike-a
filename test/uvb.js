import { exec as execFn, suite, test as testFn } from '../src';
import * as assert from '../assert/src';

/** @type {(() => void)[]} */
const suiteRuns = [];

const ste = suite('suite');

ste('should be a function', () => {
  assert.type(suite, 'function');
});

suiteRuns.push(ste.run);

// ---

const test = suite('test');

test('should be a function', () => {
  assert.type(testFn, 'function');
});

suiteRuns.push(test.run);

// ---

const exec = suite('exec');

exec('should be a function', () => {
  assert.type(execFn, 'function');
});

suiteRuns.push(exec.run);

// ---

function all() {
  return suiteRuns.slice();
}

export { ste, test, exec, all };
