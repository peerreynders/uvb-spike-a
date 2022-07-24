import { exec, suite, test } from '../uvb';
import * as assert from '../uvb/assert';

/** @type {(() => void)[]} */
const suiteRuns = [];

const Ste = suite('suite');

Ste('should be a function', () => {
  assert.type(suite, 'function');
});

suiteRuns.push(Ste.run);

// ---

const Test = suite('test');

Test('should be a function', () => {
  assert.type(test, 'function');
});

suiteRuns.push(Test.run);

// ---

const Exec = suite('exec');

Test('should be a function', () => {
  assert.type(exec, 'function');
});

suiteRuns.push(Exec.run);

// ---

function all() {
  return suiteRuns.slice();
}

export { Ste, all };
