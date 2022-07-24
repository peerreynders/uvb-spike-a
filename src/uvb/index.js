/**
 * Is value empty object or nullish?
 * @param {unknown} maybeObject
 * @returns {boolean}
 */
function noEntries(maybeObject) {
  if (maybeObject == undefined) return true;
  if (typeof maybeObject !== 'object') return true;

  for (const _key in maybeObject) return false;
  return true;
}

/**
 * Create/merge the user context
 * with suite context state
 * @template {object} [U = Record<string,never>]
 * @param {string} name Suite name
 * @param {U} [userCtx]
 * @returns {import('./internal').State<U>}
 */
function state(name, userCtx) {
  if (noEntries(userCtx)) {
    // prettier-ignore
    return /** @type {import('./internal').State<U>} */({
      __test__: '',
      __suite__: name,
    });
  }

  return Object.assign(
    {
      __test__: '',
      __suite__: name,
    },
    userCtx
  );
}

/**
 * Factory for the core structure of a suite
 * Confusingly `state` is also the user context passed
 * to the test/hook
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').State<U>} state
 * @returns {import('./internal').Context<U>}
 */
function context(state) {
  return {
    tests: [],
    before: [],
    after: [],
    bEach: [],
    aEach: [],
    only: [],
    skipped: 0,
    state,
  };
}

/**
 * Runs a single suite run
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Context<U>} ctx
 * @param {string} suiteName
 * @param {import('./internal').Reporter} reporter
 * @returns {Promise<import('./internal').RunResult>}
 */
async function runner(ctx, suiteName, reporter) {
  const { only, tests, before, after, bEach, aEach, state } = ctx;
  const entries = only.length ? only : tests;
  /** @type {import('./internal').SuiteErrors} */
  const errors = [];
  let done = 0;

  try {
    reporter.suiteStart(suiteName);
    for (const hook of before) await hook(state);

    for (const [name, testHandler] of entries) {
      state.__test__ = name;
      try {
        for (const hook of bEach) await hook(state);
        await testHandler(state);
        for (const hook of aEach) await hook(state);
        reporter.testPass();
        done += 1;
      } catch (error) {
        for (const hook of bEach) await hook(state);
        errors.push([error, name, suiteName]);
        reporter.testFail();
      }
    }
  } finally {
    state.__test__ = '';
    for (const hook of after) await hook(state);
  }
  const skipped = ctx.skipped + (only.length ? tests.length : 0);
  const selected = entries.length;
  reporter.suiteResult(errors, selected, done, skipped);
  return [done, skipped, selected, errors.length > 0];
}

/** @type {Map<string, (import('./internal').RunSuite)[]>} */
const suiteRuns = new Map();

/**
 * Queues a suite's run under its name
 * for deferred execution.
 *
 * Suites Will run repeatedly if queued repeatedly,
 * in sequence queued, without interlacing the runs
 * of different(ly named) suites.
 * @param {import('./internal').RunSuite} run
 * @param {string} name  Suite's name.
 */
function queueRunSuite(run, name) {
  let queued = suiteRuns.get(name);
  if (queued === undefined) {
    queued = [];
    suiteRuns.set(name, queued);
  }
  queued.push(run);
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let execId;
/** @type {() => Promise<boolean> | undefined} */
let exec;

function defer() {
  if (exec == undefined || execId !== undefined) return;

  clearTimeout(execId);
  execId = setTimeout(exec);
}

// Helper to push a `before`, `after`,
// `bEach`, `aEach` hook
// onto their respective collections
/**
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Handler<U>[]} hooks
 * @returns{import('.').RegisterHook<U>}
 */
function makeRegisterHook(hooks) {
  return function registerHook(handler) {
    hooks.push(handler);
  };
}

/**
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Handler<U>[]} top
 * @param {import('./internal').Handler<U>[]} each
 * @returns{import('.').RegisterHookTop<U>}
 */
function makeRegisterHookTop(top, each) {
  return Object.assign(makeRegisterHook(top), { each: makeRegisterHook(each) });
}

// Helper to push `test` or `test.only`
// onto their respective collections
/**
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').TestEntry<U>[]} tests
 * @returns{import('.').RegisterTest<U>}
 */
function makeRegisterTest(tests) {
  return function registerTest(name, handler) {
    tests.push([name, handler]);
  };
}

/**
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Context<U>} ctx
 * @param {string} name
 * @returns{import('.').Suite<U>}
 */
function setup(ctx, name) {
  const test = makeRegisterTest(ctx.tests);
  const only = makeRegisterTest(ctx.only);
  const before = makeRegisterHookTop(ctx.before, ctx.bEach);
  const after = makeRegisterHookTop(ctx.after, ctx.aEach);
  const skip = () => {
    ctx.skipped += 1;
  };
  const run = () => {
    // transfer suite context to test run
    const copy = { ...ctx };
    /** @type {import('./internal').RunSuite} */
    const runSuite = (reporter) => runner(copy, name, reporter);

    // Clean out suite context while sharing user context
    Object.assign(ctx, context(copy.state));
    queueRunSuite(runSuite, name);
    defer();
  };

  return Object.assign(test, {
    before,
    after,
    only,
    skip,
    run,
  });
}

/**
 * Factory function for suite
 * @template {object} [U = Record<string,never>]
 * @param {string} [name]
 * @param {U} [userCtx]
 * @returns{import('.').Suite<U>}
 */
function suite(name = '', userCtx) {
  return setup(context(state(name, userCtx)), name);
}

/**
 * @param {number} [t0]
 * @returns{() => number}
 */
function trackTime(t0 = performance.now()) {
  return function stopTrack() {
    const t1 = performance.now();
    return t1 - t0;
  };
}

/**
 * @param {import('./internal').Reporter} reporter
 * @param {boolean} [bail]
 * @returns{Promise<boolean>}
 */
async function execute(reporter, bail = false) {
  const endTrack = trackTime();
  let done = 0,
    total = 0,
    skipped = 0,
    withErrors = false;

  for (const [, queued] of suiteRuns) {
    for (const runSuite of queued) {
      const [ran, skip, selected, errors] = await runSuite(reporter);

      total += selected;
      done += ran;
      skipped += skip;
      withErrors ||= errors;
      if (withErrors && bail) return withErrors;
    }
  }

  reporter.result({
    withErrors,
    done,
    skipped,
    total,
    duration: endTrack(),
  });

  execId = undefined;
  return withErrors;
}

/**
 * @param {import('.').Reporter} reporter
 * @param {import('.').ReporterOptions} [options]
 */
function configure(reporter, options) {
  exec = () => execute(reporter, options?.bail);
}

export { configure, suite };
