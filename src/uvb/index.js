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
  const tags = {
    __test__: '',
    __suite__: name,
  };

  if (userCtx === undefined || noEntries(userCtx)) {
    // prettier-ignore
    return /** @type {import('./internal').State<U>} */(tags);
  }

  /** type@ {unknown} */
  const suiteState = Object.assign(userCtx, tags);
  // prettier-ignore
  return /** @type {import('./internal').State<U>} */(suiteState);
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
let executeId;
/** @type {(() => Promise<boolean>) | undefined} */
let execute;
/**
 * @param {import('./internal').RunSuite} run
 * @param {string} name  Suite's name.
 */
function scheduleRunSuite(run, name) {
  queueRunSuite(run, name);

  if (execute == undefined || executeId !== undefined) return;

  clearTimeout(executeId);
  executeId = setTimeout(execute);
}

/**
 * Helper to push a `before`, `after`,
 * `bEach`, `aEach` hook
 * onto their respective collections.
 *
 * Note: The registration function cannot
 * bind directly to the array containing
 * the hook handlers as `runSuite` purges
 * all registrations and replaces the
 * the array holding them with an empty
 * one after the run so that the next
 * run can be set up with a clean slate.
 *
 * This makes it necessary to
 * maintain the indirection with `key`
 * over the `Context` into the *current*
 * array.
 *
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Context<U>} ctx
 * @param {keyof import('./internal').Context<U>} key
 * @returns{import('.').RegisterHook<U>}
 */
function makeRegisterHook(ctx, key) {
  return function registerHook(handler) {
    // prettier-ignore
    const collect = /** @type {import('./internal').Handler<U>[]} */(ctx[key]);
    collect.push(handler);
  };
}

/**
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Context<U>} ctx
 * @param {keyof import('./internal').Context<U>} topKey
 * @param {keyof import('./internal').Context<U>} eachKey
 * @returns{import('.').RegisterHookTop<U>}
 */
function makeRegisterHookTop(ctx, topKey, eachKey) {
  return Object.assign(makeRegisterHook(ctx, topKey), {
    each: makeRegisterHook(ctx, eachKey),
  });
}

/**
 * Helper to push `test` or `test.only`
 * onto their respective collections.
 *
 * Note: The registration function cannot
 * bind directly to the array containing
 * the test entries as `runSuite` purges
 * all registrations and replaces the
 * the array holding them with an empty
 * one after the run so that the next
 * run can be set up with a clean slate.
 *
 * This makes it necessary to
 * maintain the indirection with `key`
 * over the `Context` into the *current*
 * array.
 *
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Context<U>} ctx
 * @param {keyof import('./internal').Context<U>} key
 * @returns{import('.').RegisterTest<U>}
 */
function makeRegisterTest(ctx, key) {
  return function registerTest(name, handler) {
    // prettier-ignore
    const collect = /** @type {import('./internal').TestEntry<U>[]} */(ctx[key]);
    collect.push([name, handler]);
  };
}

/**
 * @template {object} [U = Record<string,never>]
 * @param {import('./internal').Context<U>} ctx
 * @param {string} name
 * @returns{import('.').Suite<U>}
 */
function setup(ctx, name) {
  const test = makeRegisterTest(ctx, 'tests');
  const only = makeRegisterTest(ctx, 'only');
  const before = makeRegisterHookTop(ctx, 'before', 'bEach');
  const after = makeRegisterHookTop(ctx, 'after', 'aEach');
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
    scheduleRunSuite(runSuite, name);
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

/** @type {import('.').Configuration | undefined } */
let config;

/**
 * @param {import('.').Configuration} [override]
 * @returns{import('.').Configuration}
 */
function selectConfig(override) {
  const selected = override ? override : config;
  if (!selected?.reporter)
    throw new Error('uvb.exec: Missing configuration (reporter)');
  return selected;
}

/**
 * @param {import('.').Configuration} [execConfig]
 * @returns{Promise<boolean>}
 */
async function exec(execConfig) {
  const { reporter, bail = false } = selectConfig(execConfig);

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

  executeId = undefined;
  return withErrors;
}

/**
 * @param {import('.').Configuration} configuration
 */
function configure(configuration) {
  config = configuration;
  execute = config?.autorun === true ? () => exec(configuration) : undefined;
}

/** @type {import('.').Suite<Record<string,never>>} */
const test = suite();

export { configure, exec, suite, test };
