import { diffArrays, diffChars, diffLines } from 'diff';

/**
 * Difference arrays
 * @template TOld
 * @template TNew
 * @param {TOld[]} actual
 * @param {TNew[]} expected
 * @returns {import('./internal').DiffArrays<TOld,TNew>}
 */
function arrays(actual, expected) {
  return {
    kind: 'arrays',
    diff: diffArrays(actual, expected),
  };
}

/**
 * Difference multiline strings
 * @param {string} actual
 * @param {string} expected
 * @param {number} [lineNo]
 * @returns {import('./internal').DiffLines}
 */
function lines(actual, expected, lineNo = 0) {
  return {
    kind: 'lines',
    lineNo,
    diff: diffLines(actual, expected),
  };
}

/**
 * Difference strings
 * @param {string} actual
 * @param {string} expected
 * @returns {import('./internal').DiffChars}
 */
function chars(actual, expected) {
  return {
    kind: 'chars',
    diff: diffChars(actual, expected),
  };
}

/**
 * Difference anything else
 * @param {unknown} actual
 * @param {unknown} expected
 * @returns {import('./internal').DiffDirect}
 */
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

/**
 * Create a 'frame of work' for `sort()`
 * @param {object} actual
 * @param {object} expected
 * @returns {import('./internal').FrameArray | import('./internal').FrameObject}
 */
function makeFrame(actual, expected) {
  if (typeof actual !== 'object' || typeof expected !== 'object')
    throw new Error('makeFrame: non-object arguments');

  if (
    Array.isArray(actual) &&
    (Array.isArray(expected) || expected == undefined)
  ) {
    return {
      kind: 'array',
      result: [],
      index: 0,
      actual,
      expected,
    };
  }

  return {
    kind: 'object',
    result: {},
    index: 0,
    keys: Object.keys(expected),
    // prettier-ignore
    actual: /** @type {Record<string,unknown>} */(actual),
    // prettier-ignore
    expected: /** @type {Record<string,unknown>} */(expected),
  };
}

// `sort` returns a `result` where the key/value entries
// are equivalent to the ones in `actual` but are sequenced
// based on the order found in `expected` with the
// rest added to the end.
// Arrays are traversed without resequencing but
// their elements are resequenced.
//
/**
 * @param {object | unknown[]} actual
 * @param {object | unknown[]} expected
 * @returns {object | unknown[]}
 */
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
/**
 * @returns {(key: string, value: unknown) => unknown}
 */
function circular() {
  const refCache = new Set();

  return function print(_key, value) {
    if (value === void 0) return '[__VOID__]';

    if (typeof value === 'number' && value !== value) return '[__NAN__]';

    if (typeof value === 'bigint') return value.toString();

    if (!value || typeof value !== 'object') return value;

    // 'seen before' potentially circular
    if (refCache.has(value)) return '[Circular]';

    refCache.add(value);
    return value;
  };
}

// Customized JSON.stringify to genenerate a text version
// of the `input` that can potentially be used for failure display.
/**
 * @param {unknown} value
 * @returns {string}
 */
function stringify(value) {
  return JSON.stringify(value, circular(), 2)
    .replace(/"\[__NAN__\]"/g, 'NaN')
    .replace(/"\[__VOID__\]"/g, 'undefined');
}

/**
 * Returns:
 * - `string` representation of the non-nullish object
 * - the `string` itself
 * - `undefined` otherwise
 * @param {unknown} value
 * @returns {string | undefined}
 */
function toStringMaybe(value) {
  return value && typeof value === 'object'
    ? stringify(value)
    : typeof value === 'string'
    ? value
    : undefined;
}

/**
 * Returns:
 * - the passed preferred `string` if present
 * - the string representation of the value passed
 * @param {string | undefined} preferred
 * @param {unknown} value
 * @returns {string}
 */
function useString(preferred, value) {
  return preferred ? preferred : String(value);
}

/** @type {(preferred: string | undefined, value: unknown) => unknown} */
/**
 * Returns:
 * - the passed preferred `string` if present
 * - the value passed
 * @param {string | undefined} preferred
 * @param {unknown} value
 * @returns {unknown}
 */
function preferString(preferred, value) {
  return preferred ? preferred : value;
}

/**
 * Generates a difference representation for the passed
 * `actual` and `expected`
 * @param {unknown} actual
 * @param {unknown} expected
 * @returns {import('./internal').DiffArrays<unknown,unknown> | import('./internal').DiffLines | import('./internal').DiffChars | import('./internal').DiffDirect}
 */
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

  // For `actual` sort entries according to `expected` order first
  // prettier-ignore
  const actualString =
        (actual && typeof actual === 'object')
        && (expected && typeof expected === 'object')
        ? stringify(
          sort(
            /** @type {unknown[] | Record<string, unknown>} */(actual),
            /** @type {unknown[] | Record<string, unknown>} */(expected)
          )
        )
      : toStringMaybe(actual);
  const expectedString = toStringMaybe(expected);

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
