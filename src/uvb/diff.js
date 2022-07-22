import { diffArrays, diffChars, diffLines } from 'diff';

/**
   @template TOld
   @template TNew
   @typedef { import('./diff').DiffArrays<TOld,TNew> } DiffArrays<TOld,TNew>
*/
/**
   @typedef { import('./diff').DiffLines } DiffLines
   @typedef { import('./diff').DiffChars } DiffChars
   @typedef { import('./diff').DiffDirect } DiffDirect
   @typedef { import('./diff').ObjectF } ObjectF
   @typedef { import('./diff').FrameArray } FrameArray
   @typedef { import('./diff').FrameObject } FrameObject
*/

/** @type {<TOld,TNew>(actual: TOld[], expected: TNew[]) => DiffArrays<TOld,TNew>} */
function arrays(actual, expected) {
  return {
    kind: 'arrays',
    diff: diffArrays(actual, expected),
  };
}

/** @type {(actual: string, expected: string) => DiffLines} */
function lines(actual, expected, lineNo = 0) {
  return {
    kind: 'lines',
    lineNo,
    diff: diffLines(actual, expected),
  };
}

/** @type {(actual: string, expected: string) => DiffChars} */
function chars(actual, expected) {
  return {
    kind: 'chars',
    diff: diffChars(actual, expected),
  };
}

/** @type {(actual: unknown, expected: unknown) => DiffDirect} */
function direct(actual, expected) {
  return {
    kind: 'direct',
    actual: typeof actual === 'string' ? actual : String(actual),
    actualType: typeof actual,
    expected: typeof expected === 'string' ? expected : String(expected),
    expectedType: typeof expected,
  };
}

const hasOwn = Object.prototype.hasOwnProperty;

/** @type {(actual: object, expected: object) => FrameArray | FrameObject} */
function makeFrame(actual, expected) {
  if (typeof actual !== 'object' || typeof expected !== 'object')
    throw new Error('makeFrame: non-object arguments');

  if (Array.isArray(actual) && Array.isArray(expected)) {
    return {
      kind: 'array',
      result: [],
      index: 0,
      actual,
      expected,
    };
  }

  if (Array.isArray(actual) || Array.isArray(expected))
    throw new Error('makeFrame: mismatched argument types');

  return {
    kind: 'object',
    result: {},
    index: 0,
    keys: Object.keys(expected),
    // prettier-ignore
    actual: /** @type {ObjectF} */(actual),
    // prettier-ignore
    expected: /** @type {ObjectF} */(expected),
  };
}

// `sort` returns a `result` where the key/value entries
// are equivalent to the ones in `actual` but are sequenced
// based on the order found in `expected` with the
// rest added to the end.
// Arrays are traversed without resequencing but
// their elements are are resequenced.
//
/** @type {(actual: (ObjectF | unknown[]), expected: (ObjectF | unknown[])) => (ObjectF | unknown[])} */
function sort(actual, expected) {
  const frames = [makeFrame(actual, expected)];
  let top = frames[0];
  let waiting = false;
  let done;

  do {
    top = frames[frames.length - 1];

    // First place the result of the `done` frame
    // into the waiting `top` frame
    if (done) {
      if (top.kind === 'array') {
        top.result[top.index] = done.result;
        top.index += 1;
      } else {
        top.result[top.keys[top.index]] = done.result;
        top.index += 1;
      }
      done = undefined;
    }

    // Advance work on the `top` frame
    //
    waiting = false;
    if (top.kind === 'array') {
      const { actual, expected, result } = top;

      // Resequence any objects in the array;
      // everything else keep as is.
      for (; top.index < actual.length; top.index += 1) {
        const value = actual[top.index];
        if (!value || typeof value !== 'object') {
          result[top.index] = value;
          continue;
        }

        // Waiting for a resequenced element
        // prettier-ignore
        frames.push(makeFrame(value, /** @type {object} */(expected[top.index])));
        waiting = true;
        break;
      }

      if (!waiting) done = frames.pop();
    } else {
      // `top.kind === 'object'`
      const { actual, expected, keys, result } = top;

      // Add entries that exist both
      // in `expected` and `actual`
      // in `expected` order
      // Resequence any objects encountered
      for (; top.index < keys.length; top.index += 1) {
        const key = keys[top.index];
        if (!hasOwn.call(actual, key)) continue;

        const value = actual[key];
        if (!value || typeof value !== 'object') {
          result[key] = value;
          continue;
        }

        // Waiting for a resequenced value
        // prettier-ignore
        frames.push(makeFrame(value, /** @type {object} */(expected[key])));
        waiting = true;
        break;
      }

      if (!waiting) {
        // Now add entries that only exist in `actual`
        for (const key in actual) {
          if (hasOwn.call(result, key)) continue;

          result[key] = actual[key];
        }
        done = frames.pop();
      }
    }
  } while (frames.length > 0);

  if (!done) throw new Error('sort: no result (done)');

  return done.result;
}

// Creates a helper function for JSON.stringify
// so that objects with circular or multi references
// can still be converted to text
//
function circular() {
  const refCache = new Set();

  return function print(key, value) {
    if (value === void 0) return '[__VOID__]';

    const typeofValue = typeof value;
    if (typeofValue === 'number' && value !== value) return '[__NAN__]';

    if (typeofValue === 'bigint') return value.toString();

    if (!value || typeofValue !== 'object') return value;

    // 'seen before' potentially circular
    if (refCache.has(value)) return '[Circular]';

    refCache.add(value);
    return value;
  };
}

// Customized JSON.stringify to genenerate a text version
// of the `input` that can potentially be used for failure display.
function stringify(input) {
  return JSON.stringify(input, circular(), 2)
    .replace(/"\[__NAN__\]"/g, 'NaN')
    .replace(/"\[__VOID__\]"/g, 'undefined');
}

function toStringMaybe(value, typeofValue) {
  return typeofValue === 'object'
    ? stringify(value)
    : typeofValue === 'string'
    ? value
    : undefined;
}

function useString(preferred, value) {
  return preferred ? preferred : String(value);
}

function preferString(preferred, value) {
  return preferred ? preferred : value;
}

function compare(actual, expected) {
  // Generate `arrays` difference when both are arrays
  if (Array.isArray(expected) && Array.isArray(actual))
    return arrays(actual, expected);

  // For regular expressions
  // compare the string representation
  // character by character (a `chars` difference)
  if (expected instanceof RegExp)
    return chars(String(actual), String(expected));

  // Use string representations for
  // 'object' and of course 'string' entities
  // Leave the others alone
  const typeofActual = actual && typeof actual;
  const typeofExpected = expected && typeof expected;

  // For `actual` sort entries according to `expected` order first
  const actualString =
    typeofActual === 'object' && typeofExpected === 'object'
      ? stringify(sort(actual, expected))
      : toStringMaybe(actual, typeofActual);
  const expectedString = toStringMaybe(expected, typeofExpected);

  // if `actual` was converted to a multi-line string
  // use `lines` difference
  if (actualString && /\r?\n/.test(actualString))
    return lines(actualString, useString(expectedString, expected));

  // if `expected` was converted to a multi-line string
  // use `lines` difference
  if (expectedString && /\r?\n/.test(expectedString))
    return lines(useString(actualString, actual), expectedString);

  // If both `actual` and `expected` were
  // converted to single line strings
  // compare character by character
  // (a `chars` difference)
  if (actualString && expectedString)
    return chars(actualString, expectedString);

  // When all else fail used a
  // `direct` difference
  return direct(
    preferString(actualString, actual),
    preferString(expectedString, expected)
  );
}

export { arrays, chars, circular, compare, direct, lines, stringify, sort };


// export { arrays, chars, direct, lines, sort };
