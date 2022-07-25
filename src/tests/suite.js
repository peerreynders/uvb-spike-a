import { suite } from '../uvb';
import * as assert from '../uvb/assert';

/** @type {(() => void)[]} */
const suiteRuns = [];

/**
 * @typedef {{
 *   before: number;
 *   beforeEach: number;
 *   afterEach: number;
 *   after: number;
 * }} HooksContext
 */

/** @type {HooksContext} */
const hooksContext = {
  before: 0,
  beforeEach: 0,
  afterEach: 0,
  after: 0,
};

const hooks = suite('hooks', hooksContext);

/**
 * @param {import('../uvb/internal').State<HooksContext>} suiteState
 * @returns {HooksContext}
 */
function pickHookStats(suiteState) {
  const { before, beforeEach, afterEach, after } = suiteState;
  return { before, beforeEach, afterEach, after };
}

hooks.before(
  /** @param {import('../uvb/internal').State<HooksContext>} context */
  (context) => {
    assert.equal(pickHookStats(context), {
      before: 0,
      beforeEach: 0,
      afterEach: 0,
      after: 0,
    });
    context.before += 1;
  }
);

hooks.before.each(
  /** @param {import('../uvb/internal').State<HooksContext>} context */
  (context) => {
    const actual = pickHookStats(context);
    const expected = {
      before: 1,
      beforeEach: actual.afterEach,
      afterEach: actual.beforeEach,
      after: 0,
    };
    assert.equal(actual, expected);

    context.beforeEach += 1;
  }
);

hooks.after.each(
  /** @param {import('../uvb/internal').State<HooksContext>} context */
  (context) => {
    const actual = pickHookStats(context);
    const expected = {
      before: 1,
      beforeEach: actual.afterEach + 1,
      afterEach: actual.beforeEach - 1,
      after: 0,
    };
    assert.equal(actual, expected);

    context.afterEach += 1;
  }
);

hooks.after(
  /** @param {import('../uvb/internal').State<HooksContext>} context */
  (context) => {
    const actual = pickHookStats(context);
    const expected = {
      before: 1,
      beforeEach: 2,
      afterEach: 2,
      after: 0,
    };
    assert.equal(actual, expected);
    context.after += 1;
  }
);

hooks(
  'test #1',
  /** @param {import('../uvb/internal').State<HooksContext>} context */
  (context) => {
    assert.equal(pickHookStats(context), {
      before: 1,
      beforeEach: 1,
      afterEach: 0,
      after: 0,
    });
  }
);

hooks(
  'test #2',
  /** @param {import('../uvb/internal').State<HooksContext>} context */
  (context) => {
    assert.equal(pickHookStats(context), {
      before: 1,
      beforeEach: 2,
      afterEach: 1,
      after: 0,
    });
  }
);

function hooksRunAndAfterHookTest() {
  hooks.run();

  // Note: By design run() clears all registrations!
  // So by the time the next test is registered and run
  // all the other hooks and tests are gone.
  //
  // However the context/state persists
  // across runs

  hooks(
    'ensure after() ran',
    /** @param {import('../uvb/internal').State<HooksContext>} context */
    (context) => {
      assert.equal(pickHookStats(context), {
        before: 1,
        beforeEach: 2,
        afterEach: 2,
        after: 1,
      });
    }
  );

  hooks.run();
}

suiteRuns.push(hooksRunAndAfterHookTest);

// ---

/**
 * @typedef {{
 *   beforeEach: number;
 *   done: number;
 * }} SkipsContext
 */

/** @type {SkipsContext} */
const skipsContext = {
  beforeEach: 0,
  done: 0,
};

const skips = suite('suite.skip()', skipsContext);

skips.before.each(
  /** @param {import('../uvb/internal').State<SkipsContext>} context */
  (context) => {
    context.beforeEach += 1;
  }
);

skips.after(
  /** @param {import('../uvb/internal').State<SkipsContext>} context */
  (context) => {
    assert.is(context.done, 2, "Two tests were expected to run but didn't!");
  }
);

skips(
  'normal #1: I should run',
  /** @param {import('../uvb/internal').State<SkipsContext>} context */
  (context) => {
    assert.is(context.beforeEach, 1);
    context.done += 1;
  }
);

skips.skip(
  'literal',
  /** @param {import('../uvb/internal').State<SkipsContext>} _context */
  (_context) => {
    assert.unreachable('I should not run');
  }
);

skips(
  'normal #2: But I should',
  /** @param {import('../uvb/internal').State<SkipsContext>} context */
  (context) => {
    assert.is(context.beforeEach, 2);
    context.done += 1;
  }
);

suiteRuns.push(skips.run);

// ---

/**
 * @typedef {{
 *   beforeEach: number;
 *   done: number;
 * }} OnlyContext
 */

/** @type {OnlyContext} */
const onlyContext = {
  beforeEach: 0,
  done: 0,
};

const only = suite('suite.only()', onlyContext);

only.before.each(
  /** @param {import('../uvb/internal').State<OnlyContext>} context */
  (context) => {
    context.beforeEach += 1;
  }
);

only.after(
  /** @param {import('../uvb/internal').State<OnlyContext>} context */
  (context) => {
    assert.is(context.done, 2, "Two tests were expected to run but didn't!");
  }
);

only(
  'normal',
  /** @param {import('../uvb/internal').State<OnlyContext>} _context */
  (_context) => {
    assert.unreachable('I should not run');
  }
);

only.skip(
  'modifier: skip',
  /** @param {import('../uvb/internal').State<OnlyContext>} _context */
  (_context) => {
    assert.unreachable("I shouldn't not run either");
  }
);

only.only(
  'modifier only #1: I should run',
  /** @param {import('../uvb/internal').State<OnlyContext>} context */
  (context) => {
    assert.is(context.beforeEach, 1, 'did not run normal or skipped tests');
    context.done += 1;
  }
);

only.only(
  'modifier only #2: I should also run',
  /** @param {import('../uvb/internal').State<OnlyContext>} context */
  (context) => {
    assert.is(context.beforeEach, 2, 'did not run normal or skipped tests');
    context.done += 1;
  }
);

suiteRuns.push(only.run);

// ---

/**
 * @typedef {{
 *   before: number;
 *   beforeEach: number;
 *   afterEach: number;
 *   after: number;
 * }} Stats
 */

/**
 * @typedef {{
 *   stats: Stats | undefined;
 * }} Context1Context
 */

/** @type {Context1Context} */
const context1Context = {
  stats: undefined,
};

const context1 = suite('context #1', context1Context);

context1.before(
  /** @param {import('../uvb/internal').State<Context1Context>} context */
  (context) => {
    assert.is(context.stats, undefined);
    context.stats = {
      before: 1,
      beforeEach: 0,
      afterEach: 0,
      after: 0,
    };
  }
);

context1.before.each(
  /** @param {import('../uvb/internal').State<Context1Context>} context */
  (context) => {
    // TypeScript needs the blatant conditional branch
    if (context.stats === undefined) {
      assert.is.not(context.stats, undefined);
      return;
    }

    const expected = {
      before: 1,
      beforeEach: context.stats.afterEach,
      afterEach: context.stats.beforeEach,
      after: 0,
    };
    assert.equal(context.stats, expected);

    context.stats.beforeEach += 1;
  }
);

context1.after.each(
  /** @param {import('../uvb/internal').State<Context1Context>} context */
  (context) => {
    if (context.stats === undefined) {
      assert.is.not(context.stats, undefined);
      return;
    }

    const expected = {
      before: 1,
      beforeEach: context.stats.afterEach + 1,
      afterEach: context.stats.beforeEach - 1,
      after: 0,
    };
    assert.equal(context.stats, expected);

    context.stats.afterEach += 1;
  }
);

context1.after(
  /** @param {import('../uvb/internal').State<Context1Context>} context */
  (context) => {
    if (context.stats === undefined) {
      assert.is.not(context.stats, undefined);
      return;
    }

    const expected = {
      before: 1,
      beforeEach: 2,
      afterEach: 2,
      after: 0,
    };
    assert.equal(context.stats, expected);
    context.stats.after += 1;
  }
);

context1(
  'test #1',
  /** @param {import('../uvb/internal').State<Context1Context>} context */
  (context) => {
    if (context.stats === undefined) {
      assert.is.not(context.stats, undefined);
      return;
    }

    const expected = {
      before: 1,
      beforeEach: 1,
      afterEach: 0,
      after: 0,
    };
    assert.equal(context.stats, expected);
  }
);

context1(
  'test #2',
  /** @param {import('../uvb/internal').State<Context1Context>} context */
  (context) => {
    if (context.stats === undefined) {
      assert.is.not(context.stats, undefined);
      return;
    }

    const expected = {
      before: 1,
      beforeEach: 2,
      afterEach: 1,
      after: 0,
    };
    assert.equal(context.stats, expected);
  }
);

function context1RunAndAfterHookTest() {
  context1.run();

  // Note: By design run() clears all registrations!
  // So by the time the next test is registered and run
  // all the other hooks and tests are gone.
  //
  // However the context/state persists
  // across runs

  context1(
    'ensure after() ran',
    /** @param {import('../uvb/internal').State<Context1Context>} context */
    (context) => {
      if (context.stats === undefined) {
        assert.is.not(context.stats, undefined);
        return;
      }

      const expected = {
        before: 1,
        beforeEach: 2,
        afterEach: 2,
        after: 1,
      };
      assert.equal(context.stats, expected);
    }
  );

  context1.run();
}

suiteRuns.push(context1RunAndAfterHookTest);

// ---

/**
 * @typedef {{
 *   before: number;
 *   beforeEach: number;
 *   afterEach: number;
 *   after: number;
 * }} Context2Context
 */

/** @type {Context2Context} */
const context2Context = {
  before: 0,
  beforeEach: 0,
  afterEach: 0,
  after: 0,
};

const context2 = suite('context #2', context2Context);

/**
 * @param {import('../uvb/internal').State<Context2Context>} suiteState
 * @returns {Context2Context}
 */
function pickContext2Stats(suiteState) {
  const { before, beforeEach, afterEach, after } = suiteState;
  return { before, beforeEach, afterEach, after };
}

context2.before(
  /** @param {import('../uvb/internal').State<Context2Context>} context */
  (context) => {
    const actual = pickContext2Stats(context);
    const expected = {
      before: 0,
      beforeEach: 0,
      afterEach: 0,
      after: 0,
    };
    assert.equal(actual, expected);
    context.before += 1;
  }
);

context2.before.each(
  /** @param {import('../uvb/internal').State<Context2Context>} context */
  (context) => {
    const actual = pickContext2Stats(context);
    const expected = {
      before: 1,
      beforeEach: actual.afterEach,
      afterEach: actual.beforeEach,
      after: 0,
    };
    assert.equal(actual, expected);
    context.beforeEach += 1;
  }
);

context2.after.each(
  /** @param {import('../uvb/internal').State<Context2Context>} context */
  (context) => {
    const actual = pickContext2Stats(context);
    const expected = {
      before: 1,
      beforeEach: actual.afterEach + 1,
      afterEach: actual.beforeEach - 1,
      after: 0,
    };
    assert.equal(actual, expected);
    context.afterEach += 1;
  }
);

context2.after(
  /** @param {import('../uvb/internal').State<Context2Context>} context */
  (context) => {
    assert.equal(pickContext2Stats(context), {
      before: 1,
      beforeEach: 2,
      afterEach: 2,
      after: 0,
    });

    context.after += 1;
  }
);

context2(
  'test #1',
  /** @param {import('../uvb/internal').State<Context2Context>} context */
  (context) => {
    assert.equal(pickContext2Stats(context), {
      before: 1,
      beforeEach: 1,
      afterEach: 0,
      after: 0,
    });
  }
);

context2(
  'test #2',
  /** @param {import('../uvb/internal').State<Context2Context>} context */
  (context) => {
    assert.equal(pickContext2Stats(context), {
      before: 1,
      beforeEach: 2,
      afterEach: 1,
      after: 0,
    });
  }
);

function context2RunAndAfterHookTest() {
  context2.run();

  // Note: By design run() clears all registrations!
  // So by the time the next test is registered and run
  // all the other hooks and tests are gone.
  //
  // However the context/state persists
  // across runs

  context2(
    'ensure after() ran',
    /** @param {import('../uvb/internal').State<Context2Context>} context */
    (context) => {
      assert.equal(pickContext2Stats(context), {
        before: 1,
        beforeEach: 2,
        afterEach: 2,
        after: 1,
      });
    }
  );

  context2.run();
}

suiteRuns.push(context2RunAndAfterHookTest);

// ---

/**
 * @typedef {{
 *   a: number;
 *   b: number[];
 *   c: { foo: number, bar?: number };
 *   set: Set<number>;
 *   date: Date;
 *   map: Map<number,number>;
 * }} Context3Context
 */

/** @type {Context3Context} */
const context3Context = {
  a: 1,
  b: [2, 3, 4],
  c: { foo: 5 },
  set: new Set([1, 2]),
  date: new Date(),
  map: new Map(),
};

const context3 = suite('context #3', context3Context);

context3(
  'should allow context modifications',
  /** @param {import('../uvb/internal').State<Context3Context>} context */
  (context) => {
    context.a += 1;
    assert.is(context.a, 2);
    assert.is(context3Context.a, 2);

    context.b.push(999);
    const expectedB = [2, 3, 4, 999];
    assert.equal(context.b, expectedB);
    assert.equal(context3Context.b, expectedB);

    context.c.foo += 1;
    assert.is(context.c.foo, 6);
    assert.is(context3Context.c.foo, 6);

    context.c.bar = 6;
    const expectedC = { foo: 6, bar: 6 };
    assert.equal(context.c, expectedC);
    assert.equal(context3Context.c, expectedC);
  }
);

context3(
  'should allow self-referencing instance(s) within context',
  /** @param {import('../uvb/internal').State<Context3Context>} context */
  (context) => {
    const { date, set, map } = context;

    assert.type(date.getTime(), 'number');
    assert.equal([...set.values()], [1, 2]);
    assert.equal([...map.entries()], []);
  }
);

suiteRuns.push(context3.run);

// ---

/**
 * @typedef {{
 *   ordinal: number;
 * }} BreadcrumbsContext
 */

/** @type {BreadcrumbsContext} */
const breadcrumbsContext = {
  ordinal: 1,
};

const breadcrumbs = suite('breadcrumbs', breadcrumbsContext);

breadcrumbs.before(
  /** @param {import('../uvb/internal').State<BreadcrumbsContext>} context */
  (context) => {
    assert.is(context.__suite__, 'breadcrumbs');
    assert.is(context.__test__, '');
  }
);

breadcrumbs.before.each(
  /** @param {import('../uvb/internal').State<BreadcrumbsContext>} context */
  (context) => {
    assert.is(context.__suite__, 'breadcrumbs');
    assert.is(context.__test__, `test #${context.ordinal}`);
  }
);

breadcrumbs.after.each(
  /** @param {import('../uvb/internal').State<BreadcrumbsContext>} context */
  (context) => {
    assert.is(context.__suite__, 'breadcrumbs');
    assert.is(context.__test__, `test #${context.ordinal}`);

    context.ordinal += 1;
  }
);

breadcrumbs.after(
  /** @param {import('../uvb/internal').State<BreadcrumbsContext>} context */
  (context) => {
    assert.is(context.__suite__, 'breadcrumbs');
    assert.is(context.__test__, '');
  }
);

breadcrumbs(
  'test #1',
  /** @param {import('../uvb/internal').State<BreadcrumbsContext>} context */
  (context) => {
    assert.is(context.__suite__, 'breadcrumbs');
    assert.is(context.__test__, 'test #1');
  }
);

breadcrumbs(
  'test #2',
  /** @param {import('../uvb/internal').State<BreadcrumbsContext>} context */
  (context) => {
    assert.is(context.__suite__, 'breadcrumbs');
    assert.is(context.__test__, 'test #2');
  }
);

suiteRuns.push(breadcrumbs.run);

// ---

function all() {
  return suiteRuns.slice();
}

export { hooks, all };
