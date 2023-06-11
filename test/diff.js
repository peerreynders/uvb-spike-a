import { suite } from '../src';
import * as assert from '../assert/src';
import * as diff from '../assert/src/diff';

/** @type {(() => void)[]} */
const suiteRuns = [];

const arrays = suite('arrays');

arrays('should handle simple values', () => {
  assert.equal(diff.arrays([1, 2, 3], [1, 2, 4]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        value: [1, 2],
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: [3],
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: [4],
      },
    ],
  });
});

arrays('should handle nullish values', () => {
  assert.equal(diff.arrays(['foo', 'bar', undefined], ['foo', 'bar', 'baz']), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        value: ['foo', 'bar'],
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: [undefined],
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: ['baz'],
      },
    ],
  });

  assert.equal(diff.arrays([1, 2, NaN, undefined], [1, 2, null, null]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        value: [1, 2],
      },
      {
        count: 2,
        added: undefined,
        removed: true,
        value: [NaN, undefined],
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: [null, null],
      },
    ],
  });
});

arrays('should allow dangling "Actual" block', () => {
  assert.equal(diff.arrays([1, 2, 3, 4], [1, 2, 4]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        value: [1, 2],
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: [3],
      },
      {
        count: 1,
        value: [4],
      },
    ],
  });
});

arrays('should allow dangling "Expected" block', () => {
  assert.equal(diff.arrays([1, 2, 4], [1, 2, 3, 4]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        value: [1, 2],
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: [3],
      },
      {
        count: 1,
        value: [4],
      },
    ],
  });
});

arrays('should print/bail on complex objects', () => {
  assert.equal(diff.arrays([{ foo: 1 }, { bar: 2 }], [{ foo: 1 }]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: [{ foo: 1 }, { bar: 2 }],
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: [{ foo: 1 }],
      },
    ],
  });

  assert.equal(diff.arrays([[111], ['bbb']], [[333], ['xxx']]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: [[111], ['bbb']],
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: [[333], ['xxx']],
      },
    ],
  });

  assert.equal(
    diff.arrays(
      [
        [111, 222],
        ['aaa', 'bbb'],
      ],
      [
        [333, 444],
        ['aaa', 'xxx'],
      ]
    ),
    {
      kind: 'arrays',
      diff: [
        {
          count: 2,
          added: undefined,
          removed: true,
          value: [
            [111, 222],
            ['aaa', 'bbb'],
          ],
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: [
            [333, 444],
            ['aaa', 'xxx'],
          ],
        },
      ],
    }
  );

  assert.equal(
    diff.arrays(
      [
        {
          foobar: 123,
          position: {
            start: { line: 1, column: 1, offset: 0, index: 0 },
            end: { line: 1, column: 8, offset: 7 },
          },
        },
      ],
      [
        {
          foobar: 456,
          position: {
            start: { line: 2, column: 1, offset: 0, index: 0 },
            end: { line: 9, column: 9, offset: 6 },
          },
        },
      ]
    ),
    {
      kind: 'arrays',
      diff: [
        {
          count: 1,
          added: undefined,
          removed: true,
          value: [
            {
              foobar: 123,
              position: {
                start: { line: 1, column: 1, offset: 0, index: 0 },
                end: { line: 1, column: 8, offset: 7 },
              },
            },
          ],
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: [
            {
              foobar: 456,
              position: {
                start: { line: 2, column: 1, offset: 0, index: 0 },
                end: { line: 9, column: 9, offset: 6 },
              },
            },
          ],
        },
      ],
    }
  );
});

suiteRuns.push(arrays.run);

// ---

const lines = suite('lines');

lines('should be a function', () => {
  assert.type(diff.lines, 'function');
});

lines('should split on `\\r\\n` chars', () => {
  assert.equal(diff.lines('foo\nbar', 'foo\nbat'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'bar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'bat',
      },
    ],
  });

  assert.equal(diff.lines('foo\r\nbar', 'foo\r\nbat'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: 'foo\r\n',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'bar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'bat',
      },
    ],
  });
});

lines('should allow for dangling "Actual" block', () => {
  assert.equal(diff.lines('foo\nbar\nbaz', 'foo\nbaz'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'bar\n',
      },
      {
        count: 1,
        value: 'baz',
      },
    ],
  });
});

lines('should allow for dangling "Expected" block', () => {
  assert.equal(diff.lines('foo\nbaz', 'foo\nbar\nbaz'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'bar\n',
      },
      {
        count: 1,
        value: 'baz',
      },
    ],
  });
});

lines('should accept line numbers', () => {
  assert.equal(diff.lines('foo\nbar', 'foo\nbat', 1), {
    kind: 'lines',
    lineNo: 1,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'bar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'bat',
      },
    ],
  });
});

lines('should handle line numbers with num-digits change', () => {
  assert.equal(
    diff.lines(
      '1\n2\n3\n4\n5\n6\n7\n8a\n9a\n10a\n11\n12\n13',
      '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13',
      1
    ),
    {
      kind: 'lines',
      lineNo: 1,
      diff: [
        {
          count: 7,
          value: '1\n2\n3\n4\n5\n6\n7\n',
        },
        {
          count: 3,
          added: undefined,
          removed: true,
          value: '8a\n9a\n10a\n',
        },
        {
          count: 3,
          added: true,
          removed: undefined,
          value: '8\n9\n10\n',
        },
        {
          count: 3,
          value: '11\n12\n13',
        },
      ],
    }
  );
});

lines('should track "expected" for line numbers', () => {
  assert.equal(diff.lines('foo\nbaz', 'foo\nbar\nbaz', 1), {
    kind: 'lines',
    lineNo: 1,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'bar\n',
      },
      {
        count: 1,
        value: 'baz',
      },
    ],
  });
});

lines('should retain new lines ("↵") differences', () => {
  assert.equal(diff.lines('foo\nbaz', 'foo\n\n\nbaz'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: '\n\n',
      },
      {
        count: 1,
        value: 'baz',
      },
    ],
  });

  assert.equal(diff.lines('foo\nbaz', 'foo\n\n\nbaz', 1), {
    kind: 'lines',
    lineNo: 1,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: '\n\n',
      },
      {
        count: 1,
        value: 'baz',
      },
    ],
  });
});

suiteRuns.push(lines.run);

// ---

const chars = suite('chars');

chars('should be a function', () => {
  assert.type(diff.chars, 'function');
});

chars('should handle `"foo"` vs `"fo"` diff', () => {
  assert.equal(diff.chars('foo', 'fo'), {
    kind: 'chars',
    diff: [
      {
        count: 2,
        value: 'fo',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'o',
      },
    ],
  });
});

chars('should handle `"fo"` vs `"foo"` diff', () => {
  assert.equal(diff.chars('fo', 'foo'), {
    kind: 'chars',
    diff: [
      {
        count: 2,
        value: 'fo',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'o',
      },
    ],
  });
});

chars('should handle `"foo"` vs `"bar"` diff', () => {
  assert.equal(diff.chars('foo', 'bar'), {
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
});

chars('should handle `"foobar"` vs `"foobaz"` diff', () => {
  assert.equal(diff.chars('foobar', 'foobaz'), {
    kind: 'chars',
    diff: [
      {
        count: 5,
        value: 'fooba',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'r',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'z',
      },
    ],
  });
});

chars('should handle two `Date.toISOString()` diff', () => {
  assert.equal(
    diff.chars('2019-12-23T01:26:30.092Z', '2020-06-23T01:45:31.268Z'),
    {
      kind: 'chars',
      diff: [
        {
          count: 2,
          value: '20',
        },
        {
          count: 4,
          added: undefined,
          removed: true,
          value: '19-1',
        },
        {
          count: 1,
          value: '2',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '0',
        },
        {
          count: 1,
          value: '-',
        },
        {
          count: 3,
          added: true,
          removed: undefined,
          value: '06-',
        },
        {
          count: 6,
          value: '23T01:',
        },
        {
          count: 2,
          added: undefined,
          removed: true,
          value: '26',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '45',
        },
        {
          count: 2,
          value: ':3',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '0',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '1',
        },
        {
          count: 1,
          value: '.',
        },
        {
          count: 2,
          added: undefined,
          removed: true,
          value: '09',
        },
        {
          count: 1,
          value: '2',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '68',
        },
        {
          count: 1,
          value: 'Z',
        },
      ],
    }
  );

  assert.equal(
    diff.chars('2019-12-23T01:26:30.098Z', '2020-06-23T01:45:31.268Z'),
    {
      kind: 'chars',
      diff: [
        {
          count: 2,
          value: '20',
        },
        {
          count: 4,
          added: undefined,
          removed: true,
          value: '19-1',
        },
        {
          count: 1,
          value: '2',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '0',
        },
        {
          count: 1,
          value: '-',
        },
        {
          count: 3,
          added: true,
          removed: undefined,
          value: '06-',
        },
        {
          count: 6,
          value: '23T01:',
        },
        {
          count: 2,
          added: undefined,
          removed: true,
          value: '26',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '45',
        },
        {
          count: 2,
          value: ':3',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '0',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '1',
        },
        {
          count: 1,
          value: '.',
        },
        {
          count: 2,
          added: undefined,
          removed: true,
          value: '09',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '26',
        },
        {
          count: 2,
          value: '8Z',
        },
      ],
    }
  );

  assert.equal(
    diff.chars('2020-09-23T01:45:31.268Z', '2020-06-23T01:45:31.268Z'),
    {
      kind: 'chars',
      diff: [
        {
          count: 6,
          value: '2020-0',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '9',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '6',
        },
        {
          count: 17,
          value: '-23T01:45:31.268Z',
        },
      ],
    }
  );
});

chars('should handle two `Date.toISOString()` diff', () => {
  assert.equal(
    diff.chars('2020-09-23T01:45:31.268Z', '2020-06-23T01:45:31.268Z'),
    {
      kind: 'chars',
      diff: [
        {
          count: 6,
          value: '2020-0',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '9',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '6',
        },
        {
          count: 17,
          value: '-23T01:45:31.268Z',
        },
      ],
    }
  );
});

chars('should handle `"help"` vs `"hello"` diff', () => {
  assert.equal(diff.chars('help', 'hello'), {
    kind: 'chars',
    diff: [
      {
        count: 3,
        value: 'hel',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'p',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: 'lo',
      },
    ],
  });
});

chars('should handle `"yellow"` vs `"hello"` diff', () => {
  assert.equal(diff.chars('yellow', 'hello'), {
    kind: 'chars',
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'y',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'h',
      },
      {
        count: 4,
        value: 'ello',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'w',
      },
    ],
  });

  assert.equal(diff.chars('hello', 'yellow'), {
    kind: 'chars',
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'h',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'y',
      },
      {
        count: 4,
        value: 'ello',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'w',
      },
    ],
  });
});

chars('should handle shared prefix', () => {
  assert.equal(diff.chars('abc123', 'abc1890'), {
    kind: 'chars',
    diff: [
      {
        count: 4,
        value: 'abc1',
      },
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '23',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '890',
      },
    ],
  });

  assert.equal(diff.chars('abc1890', 'abc123'), {
    kind: 'chars',
    diff: [
      {
        count: 4,
        value: 'abc1',
      },
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '890',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: '23',
      },
    ],
  });

  assert.equal(diff.chars('abc1890', 'abc1234'), {
    kind: 'chars',
    diff: [
      {
        count: 4,
        value: 'abc1',
      },
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '890',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '234',
      },
    ],
  });
});

chars('should handle shared suffix', () => {
  assert.equal(diff.chars('123xyz', '00xyz'), {
    kind: 'chars',
    diff: [
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '123',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: '00',
      },
      {
        count: 3,
        value: 'xyz',
      },
    ],
  });

  assert.equal(diff.chars('00xyz', '123xyz'), {
    kind: 'chars',
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '00',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '123',
      },
      {
        count: 3,
        value: 'xyz',
      },
    ],
  });

  assert.equal(diff.chars('000xyz', '123xyz'), {
    kind: 'chars',
    diff: [
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '000',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '123',
      },
      {
        count: 3,
        value: 'xyz',
      },
    ],
  });
});

chars('should handle shared middle', () => {
  assert.equal(diff.chars('123xyz456', '789xyz000'), {
    kind: 'chars',
    diff: [
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '123',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '789',
      },
      {
        count: 3,
        value: 'xyz',
      },
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '456',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '000',
      },
    ],
  });

  assert.equal(diff.chars('123xyz45', '789xyz000'), {
    kind: 'chars',
    diff: [
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '123',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '789',
      },
      {
        count: 3,
        value: 'xyz',
      },
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '45',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '000',
      },
    ],
  });

  assert.equal(diff.chars('23xyz45', '789xyz000'), {
    kind: 'chars',
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '23',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '789',
      },
      {
        count: 3,
        value: 'xyz',
      },
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '45',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '000',
      },
    ],
  });
});

chars('should print "·" character for space', () => {
  assert.equal(diff.chars('foo bar', 'foo bar baz'), {
    kind: 'chars',
    diff: [
      {
        count: 7,
        value: 'foo bar',
      },
      {
        count: 4,
        added: true,
        removed: undefined,
        value: ' baz',
      },
    ],
  });

  assert.equal(diff.chars('foo   bar', 'foo bar'), {
    kind: 'chars',
    diff: [
      {
        count: 4,
        value: 'foo ',
      },
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '  ',
      },
      {
        count: 3,
        value: 'bar',
      },
    ],
  });
});

chars('should print "→" character for tab', () => {
  assert.equal(diff.chars('foo bar\tbaz \t', 'foo bar\tbaz \t\t bat'), {
    kind: 'chars',
    diff: [
      {
        count: 13,
        value: 'foo bar\tbaz \t',
      },
      {
        count: 5,
        added: true,
        removed: undefined,
        value: '\t bat',
      },
    ],
  });

  assert.equal(diff.chars('foo bar\tbaz \t\t bat', 'foo bar\tbaz \t'), {
    kind: 'chars',
    diff: [
      {
        count: 13,
        value: 'foo bar\tbaz \t',
      },
      {
        count: 5,
        added: undefined,
        removed: true,
        value: '\t bat',
      },
    ],
  });

  assert.equal(diff.chars('foo\tbar\tbaz', 'foo bar baz'), {
    kind: 'chars',
    diff: [
      {
        count: 3,
        value: 'foo',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: '\t',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: ' ',
      },
      {
        count: 3,
        value: 'bar',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: '\t',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: ' ',
      },
      {
        count: 3,
        value: 'baz',
      },
    ],
  });
});

chars('should handle empty string', () => {
  assert.equal(diff.chars('foo bar', ''), {
    kind: 'chars',
    diff: [
      {
        count: 7,
        added: undefined,
        removed: true,
        value: 'foo bar',
      },
    ],
  });

  assert.equal(diff.chars('', 'foo bar'), {
    kind: 'chars',
    diff: [
      {
        count: 7,
        added: true,
        removed: undefined,
        value: 'foo bar',
      },
    ],
  });
});

suiteRuns.push(chars.run);

// ---

const direct = suite('direct');

direct('should be a function', () => {
  assert.type(diff.direct, 'function');
});

direct('should handle `"foo"` vs `"fo"` diff', () => {
  assert.equal(diff.direct('foo', 'fo'), {
    kind: 'direct',
    actual: 'foo',
    actualType: 'string',
    expected: 'fo',
    expectedType: 'string',
  });
});

direct('should handle `"fo"` vs `"foo"` diff', () => {
  assert.equal(diff.direct('fo', 'foo'), {
    kind: 'direct',
    actual: 'fo',
    actualType: 'string',
    expected: 'foo',
    expectedType: 'string',
  });
});

direct('should handle `"foo"` vs `"bar"` diff', () => {
  assert.equal(diff.direct('foo', 'bar'), {
    kind: 'direct',
    actual: 'foo',
    actualType: 'string',
    expected: 'bar',
    expectedType: 'string',
  });
});

direct('should handle `123` vs `456` diff', () => {
  assert.equal(diff.direct(123, 456), {
    kind: 'direct',
    actual: '123',
    actualType: 'number',
    expected: '456',
    expectedType: 'number',
  });
});

direct('should handle `123` vs `"123"` diff', () => {
  assert.equal(diff.direct(123, '123'), {
    kind: 'direct',
    actual: '123',
    actualType: 'number',
    expected: '123',
    expectedType: 'string',
  });

  assert.equal(diff.direct('123', 123), {
    kind: 'direct',
    actual: '123',
    actualType: 'string',
    expected: '123',
    expectedType: 'number',
  });
});

direct('should handle `12` vs `"123"` diff', () => {
  assert.equal(diff.direct(12, '123'), {
    kind: 'direct',
    actual: '12',
    actualType: 'number',
    expected: '123',
    expectedType: 'string',
  });

  assert.equal(diff.direct('123', 12), {
    kind: 'direct',
    actual: '123',
    actualType: 'string',
    expected: '12',
    expectedType: 'number',
  });
});

direct('should handle `null` vs `"null"` diff', () => {
  assert.equal(diff.direct(null, 'null'), {
    kind: 'direct',
    actual: 'null',
    actualType: 'object',
    expected: 'null',
    expectedType: 'string',
  });

  assert.equal(diff.direct('null', null), {
    kind: 'direct',
    actual: 'null',
    actualType: 'string',
    expected: 'null',
    expectedType: 'object',
  });
});

direct('should handle `true` vs `"true"` diff', () => {
  assert.equal(diff.direct(true, 'true'), {
    kind: 'direct',
    actual: 'true',
    actualType: 'boolean',
    expected: 'true',
    expectedType: 'string',
  });

  assert.equal(diff.direct('true', true), {
    kind: 'direct',
    actual: 'true',
    actualType: 'string',
    expected: 'true',
    expectedType: 'boolean',
  });
});

direct('should handle `false` vs `"true"` diff', () => {
  assert.equal(diff.direct(false, 'true'), {
    kind: 'direct',
    actual: 'false',
    actualType: 'boolean',
    expected: 'true',
    expectedType: 'string',
  });

  assert.equal(diff.direct('true', false), {
    kind: 'direct',
    actual: 'true',
    actualType: 'string',
    expected: 'false',
    expectedType: 'boolean',
  });
});

suiteRuns.push(direct.run);

// ---

const sort = suite('sort');

sort('should ignore Date instances', () => {
  assert.equal(diff.sort({}, new Date()), {});
  assert.equal(diff.sort(new Date(), new Date()), {});
  assert.equal(diff.sort(new Date(), {}), {});
});

sort('should ignore RegExp instances', () => {
  assert.equal(diff.sort({}, /foo/), {});
  assert.equal(diff.sort(/foo/, /foo/), {});
  assert.equal(diff.sort(/foo/, {}), {});
});

sort('should ignore Set instances', () => {
  assert.equal(diff.sort({}, new Set()), {});
  assert.equal(diff.sort(new Set(), new Set()), {});
  assert.equal(diff.sort(new Set(), {}), {});
});

sort('should ignore Map instances', () => {
  assert.equal(diff.sort({}, new Map()), {});
  assert.equal(diff.sort(new Map(), new Map()), {});
  assert.equal(diff.sort(new Map(), {}), {});
});

sort('should align `input` to `expect` key order', () => {
  assert.equal(diff.sort({ b: 2, a: 1 }, { a: 1, b: 2 }), { a: 1, b: 2 });
});

sort('should append extra `input` keys', () => {
  assert.equal(diff.sort({ c: 3, b: 2, a: 1 }, { a: 1 }), { a: 1, c: 3, b: 2 });
});

sort('should omit missing `expect` keys', () => {
  assert.equal(diff.sort({ c: 3, a: 1 }, { a: 1, b: 2, c: 3 }), { a: 1, c: 3 });
});

sort('should loop through Arrays for nested sorts', () => {
  assert.equal(
    diff.sort(
      [
        { a2: 2, a1: 1 },
        { b3: 3, b2: 2 },
      ],
      [
        { a1: 1, a2: 2, a3: 3 },
        { b1: 1, b2: 2, b3: 3 },
      ]
    ),
    [
      { a1: 1, a2: 2 },
      { b2: 2, b3: 3 },
    ]
  );
});

sort('should handle nested Object sorts', () => {
  assert.equal(
    diff.sort(
      {
        bar: { b: 2, a: 1 },
        foo: { c: 3, b: 2, a: 1 },
      },
      {
        foo: { b: 2, c: 3 },
        bar: { b: 2 },
      }
    ),
    {
      foo: { b: 2, c: 3, a: 1 },
      bar: { b: 2, a: 1 },
    }
  );
});

sort('should handle Object dictionary', () => {
  const input = Object.create(null);
  const expect = Object.create(null);

  input.aaa = 123;
  input.bbb = 123;
  input.ccc = 123;

  expect.ccc = 123;
  expect.aaa = 123;
  expect.bbb = 123;

  assert.equal(diff.sort(input, expect), { ccc: 123, bbb: 123, aaa: 123 });
});

suiteRuns.push(sort.run);

// ---

const circular = suite('circular');

circular('should ignore non-object values', () => {
  const input = { a: 1, b: 2, c: 'c', d: null, e: () => false };

  assert.is(
    JSON.stringify(input, diff.circular()),
    '{"a":1,"b":2,"c":"c","d":null}'
  );
});

circular('should retain `undefined` and `NaN` values', () => {
  const input = { a: 1, b: undefined, c: NaN };

  assert.is(
    JSON.stringify(input, diff.circular()),
    '{"a":1,"b":"[__VOID__]","c":"[__NAN__]"}'
  );

  assert.is(JSON.stringify(input), '{"a":1,"c":null}');
});

circular(
  'should replace circular references with "[Circular]" :: Object',
  () => {
    /** @type {{
     *    a: number,
     *    b: number,
     *    self?: object,
     *  }}
     */
    const input = { a: 1, b: 2 };
    input.self = input;

    assert.is(
      JSON.stringify(input, diff.circular()),
      '{"a":1,"b":2,"self":"[Circular]"}'
    );

    assert.throws(
      () => JSON.stringify(input),
      'Converting circular structure to JSON'
    );

    assert.is(
      JSON.stringify({ aaa: input, bbb: 123 }, diff.circular()),
      '{"aaa":{"a":1,"b":2,"self":"[Circular]"},"bbb":123}'
    );
  }
);

circular(
  'should replace circular references with "[Circular]" :: Array',
  () => {
    /** @type {{
     *    a: number,
     *    b: number,
     *    self?: object,
     *  }}
     */
    const input = { a: 1, b: 2 };
    input.self = input;

    assert.is(
      JSON.stringify([input], diff.circular()),
      '[{"a":1,"b":2,"self":"[Circular]"}]'
    );

    assert.throws(
      () => JSON.stringify(input),
      'Converting circular structure to JSON'
    );

    assert.is(
      JSON.stringify([{ aaa: 1 }, { aaa: input }], diff.circular()),
      '[{"aaa":1},{"aaa":{"a":1,"b":2,"self":"[Circular]"}}]'
    );
  }
);

suiteRuns.push(circular.run);

// ---

const stringify = suite('stringify');

stringify('should wrap `JSON.stringify` native', () => {
  const input = { a: 1, b: 2, c: 'c', d: null, e: () => false };

  assert.is(diff.stringify(input), JSON.stringify(input, null, 2));
});

stringify('should retain `undefined` and `NaN` values :: Object', () => {
  assert.is(
    diff.stringify({ a: 1, b: undefined, c: NaN }),
    '{\n  "a": 1,\n  "b": undefined,\n  "c": NaN\n}'
  );
});

// In ES6, array holes are treated like `undefined` values
stringify('should retain `undefined` and `NaN` values :: Array', () => {
  // eslint-disable-next-line no-sparse-arrays
  const input = [1, undefined, 2, , 3, NaN, 4, 5];
  assert.is(
    diff.stringify(input),
    '[\n  1,\n  undefined,\n  2,\n  undefined,\n  3,\n  NaN,\n  4,\n  5\n]'
  );
});

const bigIntOk = (() => {
  if (BigInt === undefined) return false;

  try {
    Object(BigInt(3)) && Object(4n);
    return true;
  } catch (_e) {
    return false;
  }
})();

if (bigIntOk) {
  // Not currently supporting :: Object(BigInt(3)) && Object(4n)
  stringify('should handle `BigInt` values correctly', () => {
    const bigInt = 100n;
    assert.is(diff.stringify(BigInt(1)), '"1"');
    assert.is(diff.stringify(bigInt), '"100"');
    assert.is(diff.stringify([BigInt(1), bigInt]), '[\n  "1",\n  "100"\n]');
  });
}

suiteRuns.push(stringify.run);

// ---

const compare = suite('compare');

compare('should be a function', () => {
  assert.type(diff.compare, 'function');
});

compare('should proxy `$.arrays` for Array inputs', () => {
  assert.equal(diff.compare([1, 2, 3], [1, 2, 4]), {
    kind: 'arrays',
    diff: [
      {
        count: 2,
        value: [1, 2],
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: [3],
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: [4],
      },
    ],
  });
});

compare('should proxy `$.chars` for RegExp inputs', () => {
  assert.equal(diff.compare(/foo/g, /foobar/gi), {
    kind: 'chars',
    diff: [
      {
        count: 4,
        value: '/foo',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: 'bar',
      },
      {
        count: 2,
        value: '/g',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'i',
      },
    ],
  });

  assert.equal(diff.compare(/foobar/gi, /foo/g), {
    kind: 'chars',
    diff: [
      {
        count: 4,
        value: '/foo',
      },
      {
        count: 3,
        added: undefined,
        removed: true,
        value: 'bar',
      },
      {
        count: 2,
        value: '/g',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'i',
      },
    ],
  });
});

compare('should proxy `$.lines` for Object inputs', () => {
  assert.equal(diff.compare({ foo: 1 }, { foo: 2, bar: 3 }), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: '{\n',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: '  "foo": 1\n',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: '  "foo": 2,\n  "bar": 3\n',
      },
      {
        count: 1,
        value: '}',
      },
    ],
  });

  assert.equal(diff.compare({ foo: 2, bar: 3 }, { foo: 1 }), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: '{\n',
      },
      {
        count: 2,
        added: undefined,
        removed: true,
        value: '  "foo": 2,\n  "bar": 3\n',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: '  "foo": 1\n',
      },
      {
        count: 1,
        value: '}',
      },
    ],
  });

  assert.equal(
    diff.compare({ foo: 2, bar: undefined, baz: NaN }, { foo: 1, bar: null }),
    {
      kind: 'lines',
      lineNo: 0,
      diff: [
        {
          count: 1,
          value: '{\n',
        },
        {
          count: 3,
          added: undefined,
          removed: true,
          value: '  "foo": 2,\n  "bar": undefined,\n  "baz": NaN\n',
        },
        {
          count: 2,
          added: true,
          removed: undefined,
          value: '  "foo": 1,\n  "bar": null\n',
        },
        {
          count: 1,
          value: '}',
        },
      ],
    }
  );

  assert.equal(
    diff.compare(
      { foo: 2, bar: null, baz: NaN },
      { foo: 2, bar: undefined, baz: NaN }
    ),
    {
      kind: 'lines',
      lineNo: 0,
      diff: [
        {
          count: 2,
          value: '{\n  "foo": 2,\n',
        },
        {
          count: 1,
          added: undefined,
          removed: true,
          value: '  "bar": null,\n',
        },
        {
          count: 1,
          added: true,
          removed: undefined,
          value: '  "bar": undefined,\n',
        },
        {
          count: 2,
          value: '  "baz": NaN\n}',
        },
      ],
    }
  );
});

compare('should proxy `$.lines` for multi-line String inputs', () => {
  assert.equal(diff.compare('foo\nbar', 'foo\nbat'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        value: 'foo\n',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'bar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'bat',
      },
    ],
  });
});

compare('should proxy `$.chars` for single-line String inputs', () => {
  assert.equal(diff.compare('foobar', 'foobaz'), {
    kind: 'chars',
    diff: [
      {
        count: 5,
        value: 'fooba',
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'r',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'z',
      },
    ],
  });
});

compare('should proxy `$.direct` for Number inputs', () => {
  assert.equal(diff.compare(123, 12345), {
    kind: 'direct',
    actual: '123',
    actualType: 'number',
    expected: '12345',
    expectedType: 'number',
  });

  assert.equal(diff.compare(123, NaN), {
    kind: 'direct',
    actual: '123',
    actualType: 'number',
    expected: 'NaN',
    expectedType: 'number',
  });

  assert.equal(diff.compare(NaN, 123), {
    kind: 'direct',
    actual: 'NaN',
    actualType: 'number',
    expected: '123',
    expectedType: 'number',
  });
});

compare('should proxy `$.direct` for Boolean inputs', () => {
  assert.equal(diff.compare(true, false), {
    kind: 'direct',
    actual: 'true',
    actualType: 'boolean',
    expected: 'false',
    expectedType: 'boolean',
  });
});

compare('should handle string against non-type mismatch', () => {
  assert.equal(diff.compare('foobar', null), {
    kind: 'direct',
    actual: 'foobar',
    actualType: 'string',
    expected: 'null',
    expectedType: 'object',
  });

  assert.equal(diff.compare(null, 'foobar'), {
    kind: 'direct',
    actual: 'null',
    actualType: 'object',
    expected: 'foobar',
    expectedType: 'string',
  });

  assert.equal(diff.compare('foobar', 123), {
    kind: 'direct',
    actual: 'foobar',
    actualType: 'string',
    expected: '123',
    expectedType: 'number',
  });

  assert.equal(diff.compare(123, 'foobar'), {
    kind: 'direct',
    actual: '123',
    actualType: 'number',
    expected: 'foobar',
    expectedType: 'string',
  });

  assert.equal(diff.compare('foobar', undefined), {
    kind: 'direct',
    actual: 'foobar',
    actualType: 'string',
    expected: 'undefined',
    expectedType: 'undefined',
  });

  assert.equal(diff.compare(undefined, 'foobar'), {
    kind: 'direct',
    actual: 'undefined',
    actualType: 'undefined',
    expected: 'foobar',
    expectedType: 'string',
  });

  assert.equal(diff.compare(NaN, undefined), {
    kind: 'direct',
    actual: 'NaN',
    actualType: 'number',
    expected: 'undefined',
    expectedType: 'undefined',
  });

  assert.equal(diff.compare(undefined, NaN), {
    kind: 'direct',
    actual: 'undefined',
    actualType: 'undefined',
    expected: 'NaN',
    expectedType: 'number',
  });
});

compare('should handle multi-line string against non-type mismatch', () => {
  assert.equal(diff.compare('foo\nbar', null), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: 'foo\nbar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'null',
      },
    ],
  });

  assert.equal(diff.compare(null, 'foo\nbar'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'null',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: 'foo\nbar',
      },
    ],
  });

  assert.equal(diff.compare('foo\nbar', 123), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: 'foo\nbar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: '123',
      },
    ],
  });

  assert.equal(diff.compare(123, 'foo\nbar'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: '123',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: 'foo\nbar',
      },
    ],
  });

  assert.equal(diff.compare('foo\nbar', undefined), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 2,
        added: undefined,
        removed: true,
        value: 'foo\nbar',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'undefined',
      },
    ],
  });

  assert.equal(diff.compare(undefined, 'foo\nbar'), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'undefined',
      },
      {
        count: 2,
        added: true,
        removed: undefined,
        value: 'foo\nbar',
      },
    ],
  });
});

compare('should handle `null` vs object', () => {
  assert.equal(diff.compare(null, { foo: 123 }), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'null',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '{\n  "foo": 123\n}',
      },
    ],
  });

  assert.equal(diff.compare({ foo: 123 }, null), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '{\n  "foo": 123\n}',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'null',
      },
    ],
  });
});

compare('should handle `undefined` vs object', () => {
  assert.equal(diff.compare(undefined, { foo: 123 }), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 1,
        added: undefined,
        removed: true,
        value: 'undefined',
      },
      {
        count: 3,
        added: true,
        removed: undefined,
        value: '{\n  "foo": 123\n}',
      },
    ],
  });

  assert.equal(diff.compare({ foo: 123 }, undefined), {
    kind: 'lines',
    lineNo: 0,
    diff: [
      {
        count: 3,
        added: undefined,
        removed: true,
        value: '{\n  "foo": 123\n}',
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: 'undefined',
      },
    ],
  });
});

suiteRuns.push(compare.run);

// ---

function all() {
  return suiteRuns.slice();
}

export { all, arrays, chars, compare, direct, lines, sort, stringify };
