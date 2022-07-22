import { suite } from '../uvb';
import * as assert from '../uvb/assert';

function isError(error, actual, expected, operator, message, details) {
  assert.instance(error, Error);
  if (message) assert.is(error.message, message, '~> message');
  assert.is(error.generated, !message, '~> generated');
  assert.ok(error.stack, '~> stack');

  assert.instance(error, assert.Assertion);
  assert.is(error.name, 'Assertion');
  assert.is(error.code, 'ERR_ASSERTION');
  assert.equal(error.details, details, '~> details');
  assert.is(error.operator, operator, '~> operator');
  assert.equal(error.expected, expected, '~> expected');
  assert.equal(error.actual, actual, '~> actual');
}

const suiteRuns = [];

const Assertion = suite('Assertion');

Assertion('should extend Error', () => {
  assert.instance(new assert.Assertion({ message: 'Assertion' }), Error);
});

Assertion('should expect input options', () => {
  const options = Object.freeze({
    actual: 'foo',
    expected: 'bar',
    operator: 'is',
    message: 'Expected "foo" to equal "bar"',
    generated: false,
  });
  const error = new assert.Assertion(options);

  isError(
    error,
    options.actual,
    options.expected,
    options.operator,
    options.message,
    undefined
  );
});

suiteRuns.push(Assertion.run);

// ---

const ok = suite('ok');

ok('should be a function', () => {
  assert.type(assert.ok, 'function');
});

ok('should not throw if valid', () => {
  assert.not.throws(() => assert.ok(true));
});

ok('should throw if invalid', () => {
  const actual = false;
  const message = '';
  try {
    assert.ok(actual);
  } catch (error) {
    isError(error, actual, true, 'ok', message, undefined);
  }
});

ok('should throw with custom message', () => {
  const actual = false;
  const message = 'hello there';
  try {
    assert.ok(actual, message);
  } catch (error) {
    isError(error, actual, true, 'ok', message, undefined);
  }
});

suiteRuns.push(ok.run);

// ---

const is = suite('is');

is('should be a function', () => {
  assert.type(assert.is, 'function');
});

is('should not throw if valid', () => {
  assert.not.throws(() => assert.is('abc', 'abc'));
  assert.not.throws(() => assert.is(true, true));
  assert.not.throws(() => assert.is(123, 123));
});

is('should throw if invalid', () => {
  try {
    assert.is('foo', 'bar');
  } catch (error) {
    isError(error, 'foo', 'bar', 'is', '', {
      kind: 'chars',
      diff: [
        {
          count: 3,
          added: undefined,
          removed: true,
          value: 'foo',
        },
        {
          count: 3,
          added: true,
          removed: undefined,
          value: 'bar',
        },
      ],
    });
  }
});

is('should throw with custom message', () => {
  try {
    assert.is(123, 456, 'hello there');
  } catch (error) {
    isError(error, 123, 456, 'is', 'hello there', {
      kind: 'direct',
      actual: '123',
      actualType: 'number',
      expected: '456',
      expectedType: 'number',
    });
  }
});

is('should use strict equality checks', () => {
  try {
    const arr = [3, 4, 5];
    assert.is(arr, arr.slice());
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
  }

  try {
    const obj = { foo: 123 };
    assert.is(obj, { ...obj });
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
  }
});

suiteRuns.push(is.run);

// ---

const equal = suite('equal');

equal('should be a function', () => {
  assert.type(assert.equal, 'function');
});

equal('should not throw if valid', () => {
  assert.not.throws(() => assert.equal('abc', 'abc'));
  assert.not.throws(() => assert.equal(true, true));
  assert.not.throws(() => assert.equal(123, 123));

  assert.not.throws(() => assert.equal([1, 2, 3], [1, 2, 3]));
  assert.not.throws(() => assert.equal({ foo: [2, 3] }, { foo: [2, 3] }));
});

equal('should throw if invalid', () => {
  const actual = {
    foo: ['aaa'],
    bar: [2, 3],
  };

  const expected = {
    foo: ['a', 'a'],
    bar: [{ a: 1, b: 2 }],
  };

  try {
    assert.equal(actual, expected);
  } catch (error) {
    isError(error, actual, expected, 'equal', '', {
      kind: 'lines',
      lineNo: 0,
      diff: [
        {
          count: 2,
          value: '{\n  "foo": [\n',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '    "aaa"\n',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '    "a",\n    "a"\n',
        },
        {
          count: 2,
          value: '  ],\n  "bar": [\n',
        },
        {
          count: 2,
          added: undefined,
          removed: true,
          value: '    2,\n    3\n',
        },
        {
          count: 4,
          added: true,
          removed: undefined,
          value: '    {\n      "a": 1,\n      "b": 2\n    }\n',
        },
        {
          count: 2,
          value: '  ]\n}',
        },
      ],
    });
  }
});

equal('should throw with custom message', () => {
  const actual = {
    foo: ['aaa'],
    bar: [2, 3],
  };

  const expected = {
    foo: ['a', 'a'],
    bar: [{ a: 1, b: 2 }],
  };

  try {
    assert.equal(actual, expected, 'hello there');
  } catch (error) {
    isError(error, actual, expected, 'equal', 'hello there', {
      kind: 'lines',
      lineNo: 0,
      diff: [
        {
          count: 2,
          value: '{\n  "foo": [\n',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '    "aaa"\n',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '    "a",\n    "a"\n',
        },
        {
          count: 2,
          value: '  ],\n  "bar": [\n',
        },
        {
          count: 2,
          added: undefined,
          removed: true,
          value: '    2,\n    3\n',
        },
        {
          count: 4,
          added: true,
          removed: undefined,
          value: '    {\n      "a": 1,\n      "b": 2\n    }\n',
        },
        {
          count: 2,
          value: '  ]\n}',
        },
      ],
    });
  }
});

equal('should use deep equality checks', () => {
  try {
    assert.equal({ a: [{ b: 2 }] }, { a: [{ b: 1 }] });
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
  }

  try {
    assert.equal([{ a: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }]);
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
  }
});

equal('should throw assertion error on array type mismatch', () => {
  try {
    assert.equal(null, []);
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
  }
  /*
  try {
    assert.equal([], null);
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
  }
  */
});

suiteRuns.push(equal.run);

// ---

const unreachable = suite('unreachable');

unreachable('should be a function', () => {
  assert.type(assert.unreachable, 'function');
});

unreachable('should always throw', () => {
  try {
    assert.unreachable();
  } catch (error) {
    isError(error, true, false, 'unreachable', '', undefined);
  }
});

unreachable('should customize message', () => {
  try {
    assert.unreachable('hello');
  } catch (error) {
    isError(error, true, false, 'unreachable', 'hello', undefined);
  }
});

suiteRuns.push(unreachable.run);

// ---

const instance = suite('instance');

instance('should be a function', () => {
  assert.type(assert.instance, 'function');
});

instance('should not throw if valid', () => {
  assert.not.throws(() => assert.instance(new Date(), Date));
  assert.not.throws(() => assert.instance(/foo/, RegExp));
  assert.not.throws(() => assert.instance({}, Object));
  assert.not.throws(() => assert.instance([], Array));
});

instance('should throw if invalid', () => {
  try {
    assert.instance('foo', Error);
  } catch (error) {
    isError(error, 'foo', Error, 'instance', '', undefined);
  }
});

instance('should throw with custom message', () => {
  try {
    assert.instance('foo', Error, 'hello there');
  } catch (error) {
    isError(error, 'foo', Error, 'instance', 'hello there', undefined);
  }
});

suiteRuns.push(instance.run);

// ---

const type = suite('type');

type('should be a function', () => {
  assert.type(assert.type, 'function');
});

type('should not throw if valid', () => {
  assert.not.throws(() => assert.type(123, 'number'));
  assert.not.throws(() => assert.type(true, 'boolean'));
  assert.not.throws(() => assert.type(assert.type, 'function'));
  assert.not.throws(() => assert.type('abc', 'string'));
  assert.not.throws(() => assert.type(/x/, 'object'));
});

type('should throw if invalid', () => {
  try {
    assert.type('foo', 'number');
  } catch (error) {
    isError(error, 'string', 'number', 'type', '', undefined);
  }
});

type('should throw with custom message', () => {
  try {
    assert.type('foo', 'number', 'hello there');
  } catch (error) {
    isError(error, 'string', 'number', 'type', 'hello there', undefined);
  }
});

suiteRuns.push(type.run);

// --- NO snapshot

// ---

const match = suite('match');

match('should be a function', () => {
  assert.type(assert.match, 'function');
});

match('should not throw if valid', () => {
  assert.not.throws(() => assert.match('foobar', 'foo'));
  assert.not.throws(() => assert.match('foobar', 'bar'));

  assert.not.throws(() => assert.match('foobar', /foo/));
  assert.not.throws(() => assert.match('foobar', /bar/i));
});

match('should throw if invalid', () => {
  try {
    assert.match('foobar', 'hello');
  } catch (error) {
    isError(error, 'foobar', 'hello', 'match', '', undefined);
  }

  try {
    assert.match('foobar', /hello/i);
  } catch (error) {
    isError(error, 'foobar', /hello/i, 'match', '', undefined);
  }
});

match('should throw with custom message', () => {
  try {
    assert.match('foobar', 'hello', 'howdy partner');
  } catch (error) {
    isError(error, 'foobar', 'hello', 'match', 'howdy partner', undefined);
  }
});

suiteRuns.push(match.run);

// ---

const throws = suite('throws');

throws('should be a function', () => {
  assert.type(assert.throws, 'function');
});

throws('should throw if function does not throw Error :: generic', () => {
  try {
    assert.throws(() => 123);
  } catch (error) {
    assert.is(error.message, 'Expected function to throw');
    isError(error, false, true, 'throws', '', undefined);
  }
});

throws(
  'should throw if function does not throw matching Error :: RegExp',
  () => {
    try {
      assert.throws(() => {
        throw new Error('hello');
      }, /world/);
    } catch (error) {
      assert.is(
        error.message,
        'Expected function to throw exception matching `/world/` pattern'
      );
      isError(error, false, true, 'throws', '', undefined);
    }
  }
);

throws(
  'should throw if function does not throw matching Error :: Function',
  () => {
    try {
      assert.throws(
        () => {
          throw new Error();
        },
        (error) => error.message.includes('foobar')
      );
    } catch (error) {
      assert.is(error.message, 'Expected function to throw matching exception');
      isError(error, false, true, 'throws', '', undefined);
    }
  }
);

throws('should not throw if function does throw Error :: generic', () => {
  assert.not.throws(() =>
    assert.throws(() => {
      throw new Error();
    })
  );
});

throws(
  'should not throw if function does throw matching Error :: RegExp',
  () => {
    assert.not.throws(() =>
      assert.throws(() => {
        throw new Error('hello');
      }, /hello/)
    );
  }
);

throws(
  'should not throw if function does throw matching Error :: Function',
  () => {
    assert.not.throws(() => {
      assert.throws(
        () => {
          throw new Error('foobar');
        },
        (error) => error.message.includes('foobar')
      );
    });
  }
);

suiteRuns.push(throws.run);

// ---

const not = suite('not');

function notIsFunction(suite, notFn) {
  suite('should be a function', () => {
    assert.type(notFn, 'function');
  });
}

function notNoThrow(suite, notFn) {
  suite('should not throw if falsey', () => {
    assert.not.throws(() => notFn(false));
    assert.not.throws(() => notFn(undefined));
    assert.not.throws(() => notFn(null));
    assert.not.throws(() => notFn(''));
    assert.not.throws(() => notFn(0));
  });
}

function notDoThrow(suite, notFn) {
  suite('should throw if truthy', () => {
    try {
      notFn(true);
    } catch (error) {
      isError(error, true, false, 'not', '', undefined);
    }
  });
}

function notDoThrowCustom(suite, notFn) {
  suite('should throw with custom message', () => {
    try {
      notFn(true, 'hello there');
    } catch (error) {
      isError(error, true, false, 'not', 'hello there', undefined);
    }
  });
}

notIsFunction(not, assert.not);
notNoThrow(not, assert.not);
notDoThrow(not, assert.not);
notDoThrowCustom(not, assert.not);

suiteRuns.push(not.run);

// ---

const notOk = suite('not.ok');

notIsFunction(notOk, assert.not.ok);
notNoThrow(notOk, assert.not.ok);
notDoThrow(notOk, assert.not.ok);
notDoThrowCustom(notOk, assert.not.ok);

suiteRuns.push(notOk.run);

// ---

const isNot = suite('is.not');

isNot('should be a function', () => {
  assert.type(assert.is.not, 'function');
});

isNot('should not throw if values are not strictly equal', () => {
  assert.not.throws(() => assert.is.not(true, false));
  assert.not.throws(() => assert.is.not(123, undefined));
  assert.not.throws(() => assert.is.not('123', 123));
  assert.not.throws(() => assert.is.not(NaN, NaN));
  assert.not.throws(() => assert.is.not([], []));
});

isNot('should throw if values are strictly equal', () => {
  try {
    assert.is.not('hello', 'hello');
  } catch (error) {
    isError(error, 'hello', 'hello', 'is.not', '', undefined);
  }
});

isNot('should throw with custom message', () => {
  try {
    assert.is.not('foo', 'foo', 'hello there');
  } catch (error) {
    isError(error, 'foo', 'foo', 'is.not', 'hello there', undefined);
  }
});

suiteRuns.push(isNot.run);

// ---

const notEqual = suite('not.equal');

notEqual('should be a function', () => {
  assert.type(assert.not.equal, 'function');
});

notEqual('should throw if values are deeply equal', () => {
  try {
    assert.not.equal('abc', 'abc');
  } catch (error) {
    isError(error, 'abc', 'abc', 'not.equal', '', undefined);
  }

  try {
    assert.not.equal(true, true);
  } catch (error) {
    isError(error, true, true, 'not.equal', '', undefined);
  }

  try {
    assert.not.equal(123, 123);
  } catch (error) {
    isError(error, 123, 123, 'not.equal', '', undefined);
  }

  const arr = [1, 2, 3];
  const obj = { foo: [2, 3] };

  try {
    assert.not.equal(arr, arr);
  } catch (error) {
    isError(error, arr, arr, 'not.equal', '', undefined);
  }

  try {
    assert.not.equal(obj, obj);
  } catch (error) {
    isError(error, obj, obj, 'not.equal', '', undefined);
  }
});

notEqual('should not throw if values are not deeply equal', () => {
  const actual = {
    foo: ['aaa'],
    bar: [2, 3],
  };

  const expected = {
    foo: ['a', 'a'],
    bar: [{ a: 1, b: 2 }],
  };

  assert.not.throws(() => assert.not.equal(actual, expected));
});

notEqual('should throw with custom message', () => {
  const actual = {
    foo: ['aaa'],
    bar: [2, 3],
  };

  try {
    assert.not.equal(actual, actual, 'hello there');
  } catch (error) {
    isError(error, actual, actual, 'not.equal', 'hello there', undefined);
  }
});

notEqual('should use deep equality checks', () => {
  try {
    assert.not.equal({ a: [{ b: 2 }] }, { a: [{ b: 2 }] });
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
    assert.is(error.operator, 'not.equal');
  }

  try {
    assert.not.equal([{ a: 2 }, { b: 2 }], [{ a: 2 }, { b: 2 }]);
    assert.unreachable();
  } catch (error) {
    assert.instance(error, assert.Assertion);
    assert.is(error.operator, 'not.equal');
  }
});

suiteRuns.push(notEqual.run);

// ---

const notType = suite('not.type');

notType('should be a function', () => {
  assert.type(assert.not.type, 'function');
});

notType('should throw if types match', () => {
  try {
    assert.not.type(123, 'number');
  } catch (error) {
    isError(error, 'number', 'number', 'not.type', '', undefined);
  }

  try {
    assert.not.type(true, 'boolean');
  } catch (error) {
    isError(error, 'boolean', 'boolean', 'not.type', '', undefined);
  }

  try {
    assert.not.type(assert.not.type, 'function');
  } catch (error) {
    isError(error, 'function', 'function', 'not.type', '', undefined);
  }

  try {
    assert.not.type('abc', 'string');
  } catch (error) {
    isError(error, 'string', 'string', 'not.type', '', undefined);
  }

  try {
    assert.not.type(/x/, 'object');
  } catch (error) {
    isError(error, 'object', 'object', 'not.type', '', undefined);
  }
});

notType('should not throw if types do not match', () => {
  assert.not.throws(() => assert.not.type('foo', 'number'));
});

notType('should throw with custom message', () => {
  try {
    assert.not.type('abc', 'string', 'hello world');
  } catch (error) {
    isError(error, 'string', 'string', 'not.type', 'hello world', undefined);
  }
});

suiteRuns.push(notType.run);

// ---

const notInstance = suite('not.instance');

notInstance('should be a function', () => {
  assert.type(assert.not.instance, 'function');
});

notInstance('should throw if values match', () => {
  // isError uses is() check -- lazy
  const actuals = {
    date: new Date(),
    regExp: /foo/,
    object: {},
    array: [],
  };

  try {
    assert.not.instance(actuals.date, Date);
  } catch (error) {
    isError(error, actuals.date, Date, 'not.instance', '', undefined);
  }

  try {
    assert.not.instance(actuals.regExp, RegExp);
  } catch (error) {
    isError(error, actuals.regExp, RegExp, 'not.instance', '', undefined);
  }

  try {
    assert.not.instance(actuals.object, Object);
  } catch (error) {
    isError(error, actuals.object, Object, 'not.instance', '', undefined);
  }

  try {
    assert.not.instance(actuals.array, Array);
  } catch (error) {
    isError(error, actuals.array, Array, 'not.instance', '', undefined);
  }
});

notInstance('should not throw on mismatch', () => {
  assert.not.throws(() => assert.not.instance('foo', Error));
});

notInstance('should throw with custom message', () => {
  try {
    assert.not.instance('foo', String, 'hello there');
  } catch (error) {
    isError(error, 'foo', String, 'instance', 'hello there', undefined);
  }
});

suiteRuns.push(notInstance.run);

// ---

const notMatch = suite('not.match');

notMatch('should be a function', () => {
  assert.type(assert.not.match, 'function');
});

notMatch('should throw if values match', () => {
  try {
    assert.not.match('foobar', 'foo');
  } catch (error) {
    isError(error, 'foobar', 'foo', 'not.match', '', undefined);
  }

  try {
    assert.not.match('foobar', 'bar');
  } catch (error) {
    isError(error, 'foobar', 'bar', 'not.match', '', undefined);
  }

  try {
    assert.not.match('foobar', /foo/);
  } catch (error) {
    isError(error, 'foobar', /foo/, 'not.match', '', undefined);
  }
});

notMatch('should not throw if types do not match', () => {
  assert.not.throws(() => assert.not.match('foobar', 'hello'));

  assert.not.throws(() => assert.not.match('foobar', /hello/));
});

notMatch('should throw with custom message', () => {
  try {
    assert.not.match('foobar', 'hello', 'hello world');
  } catch (error) {
    isError(error, 'foobar', 'hello', 'not.match', 'hello world', undefined);
  }
});

suiteRuns.push(notMatch.run);

// ---

const notThrows = suite('not.throws');

notThrows('should be a function', () => {
  assert.type(assert.throws, 'function');
});

notThrows(
  'should not throw if function does not throw Error :: generic',
  () => {
    try {
      () => assert.not.throws(() => 123);
    } catch (error) {
      assert.unreachable('Expected function not to throw');
    }
  }
);

notThrows(
  'should not throw if function does not throw matching Error :: RegExp',
  () => {
    try {
      () =>
        assert.not.throws(() => {
          throw new Error('hello');
        }, /world/);
    } catch (error) {
      assert.unreachable('Expected function not to throw');
    }
  }
);

notThrows(
  'should not throw if function does not throw matching Error :: Function',
  () => {
    try {
      assert.not.throws(
        () => {
          throw new Error('hello');
        },
        (error) => error.message.includes('world')
      );
    } catch (error) {
      assert.unreachable('Expected function not to throw');
    }
  }
);

notThrows('should throw if function does throw Error :: generic', () => {
  try {
    assert.not.throws(() => {
      throw new Error();
    });
  } catch (error) {
    assert.is(error.message, 'Expected function not to throw');
    isError(error, true, false, 'not.throws', '', undefined);
  }
});

notThrows(
  'should throw if function does throw matching Error :: RegExp',
  () => {
    try {
      assert.not.throws(() => {
        throw new Error('hello');
      }, /hello/);
    } catch (error) {
      assert.is(
        error.message,
        'Expected function not to throw exception matching `/hello/` pattern'
      );
      isError(error, true, false, 'not.throws', '', undefined);
    }
  }
);

notThrows(
  'should throw if function does throw matching Error :: Function',
  () => {
    try {
      assert.not.throws(
        () => {
          throw new Error();
        },
        (err) => err instanceof Error
      );
    } catch (error) {
      assert.is(
        error.message,
        'Expected function not to throw matching exception'
      );
      isError(error, true, false, 'not.throws', '', undefined);
    }
  }
);

suiteRuns.push(notThrows.run);

// ---

function all() {
  return suiteRuns.slice();
}

export {
  Assertion,
  all,
  equal,
  instance,
  is,
  isNot,
  match,
  not,
  notEqual,
  notInstance,
  notMatch,
  notOk,
  notThrows,
  notType,
  ok,
  throws,
  type,
  unreachable,
};
