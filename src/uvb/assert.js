import { dequal } from 'dequal';
import { compare } from './diff';

class Assertion extends Error {
  /**
   * @param {import('.').AssertionOptions} options
   */
  constructor(options) {
    super(options.message);
    this.name = 'Assertion';
    this.code = 'ERR_ASSERTION';

    // prettier-ignore
    const cons =
      /** @type{import('./internal').ErrorConstructor} */ (/** @type{unknown} */ (Error));
    cons.captureStackTrace?.(this, this.constructor);

    this.details = options.details;
    this.generated = options.generated;
    this.operator = options.operator;
    this.expected = options.expected;
    this.actual = options.actual;
  }
}

/**
 * Builds `Assertion` with the specified properties
 * and throws it if assertion failed
 * @param {boolean} assertion `false` throw; otherwise let is pass.
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} operator
 * @param {((actual: unknown, expected: unknown) => unknown) | undefined} detailer
 * Function to generate details about the differences between `actual` and `expected`
 * @param {string} backup  generated message.
 * @param {string | Error} [message] Optional: custom message or custom Error to throw
 */
function assert(
  assertion,
  actual,
  expected,
  operator,
  detailer,
  backup,
  message
) {
  if (assertion) return;
  if (message instanceof Error) throw message;

  throw new Assertion({
    actual,
    expected,
    operator,
    message: message || backup,
    generated: !message,
    details: detailer?.(actual, expected),
  });
}

/**
 * Structural equality
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string | Error} [message]
 */
function equal(actual, expected, message) {
  assert(
    dequal(actual, expected),
    actual,
    expected,
    'equal',
    compare,
    'Expected values to be deeply equal:',
    message
  );
}

/**
 * Structural inequality
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string | Error} [message]
 */
function notEqual(actual, expected, message) {
  assert(
    !dequal(actual, expected),
    actual,
    expected,
    'not.equal',
    undefined,
    'Expected values not to be deeply equal',
    message
  );
}

// --- begin `instance`
/**
 * `actual` instanceof `expected`
 * @param {unknown} actual
 * @param {Function} expected
 * @param {string | Error} [message]
 */
function instance(actual, expected, message) {
  assert(
    actual instanceof expected,
    actual,
    expected,
    'instance',
    undefined,
    `Expected value to be an instance of \`${
      expected.name || expected.constructor.name
    }\``,
    message
  );
}

/**
 * `actual` not instanceof `expected`
 * @param {unknown} actual
 * @param {Function} expected
 * @param {string | Error} [message]
 */
function notInstance(actual, expected, message) {
  assert(
    !(actual instanceof expected),
    actual,
    expected,
    'not.instance',
    undefined,
    `Expected value not to be an instance of \`${
      expected.name || expected.constructor.name
    }\``,
    message
  );
}
// --- end `instance`

// --- begin `is`
/**
 * Referential equality
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string | Error} [message]
 */
function is(actual, expected, message) {
  assert(
    actual === expected,
    actual,
    expected,
    'is',
    compare,
    'Expected values to be strictly equal:',
    message
  );
}

/**
 * Referential inequality
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string | Error} [message]
 */
function isNot(actual, expected, message) {
  assert(
    actual !== expected,
    actual,
    expected,
    'is.not',
    undefined,
    'Expected values not to be strictly equal',
    message
  );
}

is.not = isNot;
// --- end `is`

// ---  begin `match`
/**
 * Match substring or regular expression
 * @param {string} actual
 * @param {string | RegExp} expected
 * @param {string | Error} [message]
 */
function match(actual, expected, message) {
  if (typeof expected === 'string') {
    assert(
      actual.includes(expected),
      actual,
      expected,
      'match',
      undefined,
      `Expected value to include "${expected}" substring`,
      message
    );
  } else {
    assert(
      expected.test(actual),
      actual,
      expected,
      'match',
      undefined,
      `Expected value to match \`${String(expected)}\` pattern`,
      message
    );
  }
}

/**
 * Don't match substring or regular expression
 * @param {string} actual
 * @param {string | RegExp} expected
 * @param {string | Error} [message]
 */
function notMatch(actual, expected, message) {
  if (typeof expected === 'string') {
    assert(
      !actual.includes(expected),
      actual,
      expected,
      'not.match',
      undefined,
      `Expected value not to include "${expected}" substring`,
      message
    );
  } else {
    assert(
      !expected.test(actual),
      actual,
      expected,
      'not.match',
      undefined,
      `Expected value not to match \`${expected.toString()}\` pattern`,
      message
    );
  }
}
// --- end `match`

// --- `not` pushed to the end
/**
 * Is truthy
 * @param {unknown} actual
 * @param {string | Error} [message]
 */
function ok(actual, message) {
  const assertion = Boolean(actual);
  assert(
    assertion,
    assertion,
    true,
    'ok',
    undefined,
    'Expected value to be truthy',
    message
  );
}

// --- begin `throws`

/**
 * @param {boolean} assertion
 * @param {string} backup
 * @param {string | Error} [message]
 */
function throwsAssert(assertion, backup, message) {
  assert(assertion, false, true, 'throws', undefined, backup, message);
}

/**
 * Function expression throws
 * @param {() => void} fn
 * @param {string | ((error: Error) => boolean) | RegExp} expected
 * @param {string | Error} [message]
 */
function throws(fn, expected, message) {
  const msg = !message && typeof expected === 'string' ? expected : message;
  try {
    fn();
    throwsAssert(false, 'Expected function to throw', msg);
  } catch (error) {
    if (error instanceof Assertion) throw error;

    if (typeof expected === 'function' && error instanceof Error) {
      throwsAssert(
        expected(error),
        'Expected function to throw matching exception',
        msg
      );
      return;
    }

    if (expected instanceof RegExp && error instanceof Error) {
      throwsAssert(
        expected.test(error.message),
        `Expected function to throw exception matching \`${String(
          expected
        )}\` pattern`,
        msg
      );
      return;
    }
  }
}

/**
 * @param {boolean} assertion
 * @param {string} backup
 * @param {string | Error} [message]
 */
function notThrowsAssert(assertion, backup, message) {
  assert(assertion, true, false, 'not.throws', undefined, backup, message);
}

/**
 * Function expression does not throw
 * @param {() => void} fn
 * @param {((error: Error) => boolean) | RegExp} expected
 * @param {string | Error} [message]
 */
function notThrows(fn, expected, message) {
  const msg = !message && typeof expected === 'string' ? expected : message;

  try {
    fn();
  } catch (error) {
    if (typeof expected === 'function' && error instanceof Error) {
      notThrowsAssert(
        !expected(error),
        'Expected function not to throw matching exception',
        msg
      );
      return;
    }

    if (expected instanceof RegExp && error instanceof Error) {
      notThrowsAssert(
        !expected.test(error.message),
        `Expected function not to throw exception matching \`${String(
          expected
        )}\` pattern`,
        msg
      );
      return;
    }

    if (!expected) {
      notThrowsAssert(false, 'Expected function not to throw', msg);
      return;
    }
  }
}
// --- end `throws`

// --- begin `type`

/**
 * Expected type
 * @param {unknown} actual
 * @param {import('./internal').TypeofType} expected
 * @param {string | Error} [message]
 */
function type(actual, expected, message) {
  const typeActual = typeof actual;
  assert(
    typeActual === expected,
    typeActual,
    expected,
    'type',
    undefined,
    `Expected "${typeActual}" to be "${expected}"`,
    message
  );
}

/**
 * Not the specified type
 * @param {unknown} actual
 * @param {import('./internal').TypeofType} expected
 * @param {string | Error} [message]
 */
function notType(actual, expected, message) {
  const typeActual = typeof actual;
  assert(
    typeActual !== expected,
    typeActual,
    expected,
    'not.type',
    undefined,
    `Expected "${typeActual}" not to be "${expected}"`,
    message
  );
}
// --- end `type`

/**
 * Throws Assertion if invoked
 * @param {string | Error} [message]
 */
function unreachable(message) {
  assert(
    false,
    true,
    false,
    'unreachable',
    undefined,
    'Expected not to be reached!',
    message
  );
}

// --- begin `not`
/**
 * Is falsy
 * @param {unknown} actual
 * @param {string | Error} [message]
 */
function not(actual, message) {
  assert(
    !actual,
    true,
    false,
    'not',
    undefined,
    'Expected value to be falsey',
    message
  );
}

not.equal = notEqual;
not.instance = notInstance;
not.match = notMatch;
not.ok = not;
not.throws = notThrows;
not.type = notType;

// --- end `not`

export {
  Assertion,
  equal,
  instance,
  is,
  not,
  match,
  ok,
  throws,
  type,
  unreachable,
};
