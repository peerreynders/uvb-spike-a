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
 * @returns {import('./internal').RunSuite}
 */
function prepareRunSuite(ctx, suiteName) {
  return function makeNext(reporter) {
    const { only, tests, before, after, bEach, aEach, state } = ctx;
    const entries = only.length ? only : tests;
    /** @type {import('./internal').SuiteErrors} */
    const errors = [];
    /** @type {(import('./internal').RunResult) | undefined} */
    let result = undefined;
    let done = 0;

    const teardown = async () => {
      try {
        for (const hook of after) await hook(state);
      } finally {
        const skipped = ctx.skipped + (only.length ? tests.length : 0);
        const selected = entries.length;
        reporter.suiteResult(errors, selected, done, skipped);
        result = [done, skipped, selected, errors.length > 0];
      }
    };

    /** @type {(() => Promise<void>) | undefined} */
    let setup = async () => {
      try {
        reporter.suiteStart(suiteName);
        for (const hook of before) await hook(state);
      } catch (error) {
        try {
          teardown();
        } catch (_ignore) {
          throw error;
        }
        throw error;
      } finally {
        setup = undefined;
      }
    };

    let index = 0;

    return async function next() {
      if (result) return result;

      if (setup) await setup();

      const [name, testHandler] = entries[index];
      state.__test__ = name;

      try {
        for (const hook of bEach) await hook(state);
        await testHandler(state);
        for (const hook of aEach) await hook(state);
        reporter.testPass();
        done += 1;
      } catch (error) {
        for (const hook of aEach) await hook(state);
        errors.push([error, name, suiteName]);
        reporter.testFail();
      }

      state.__test__ = '';
      index += 1;
      if (index >= entries.length) await teardown();

      return result === undefined ? true : result;
    };
  };
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
    const runSuite = prepareRunSuite(copy, name);

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
function exec(execConfig) {
  const endTrack = trackTime();
  const { reporter, interval: ci, bail = false } = selectConfig(execConfig);
  const interval = ci && ci >= 10 ? ci : Number.MAX_SAFE_INTEGER;

  const endResult = {
    withErrors: false,
    done: 0,
    skipped: 0,
    total: 0,
    duration: 0,
  };
  let settled = false;

  /** @param {boolean} [forceError] */
  const teardown = (forceError) => {
    endResult.withErrors = forceError ?? endResult.withErrors;
    endResult.duration = endTrack();
    reporter.result(endResult);

    executeId = undefined;
    settled = true;
    return endResult.withErrors;
  };

  const suiteQueued = [...suiteRuns.values()];
  let suiteIndex = -1;
  let queuedIndex = -1;

  // Find first vaild `next`
  // (So we don't have to constantly
  // deal with TS's concern about
  // `undefined`)
  //
  primeLoop: for (let i = 0; i < suiteQueued.length; i += 1) {
    if (suiteQueued[i].length < 1) continue;

    const q = suiteQueued[i];
    for (let j = 0; j < q.length; j += 1) {
      if (typeof q[j] === 'function') {
        suiteIndex = i;
        queuedIndex = j;
        break primeLoop;
      }
    }
  }

  if (suiteIndex < 0 || queuedIndex < 0) return Promise.resolve(teardown());

  let queued = suiteQueued[suiteIndex];
  let next = queued[queuedIndex](reporter);

  return new Promise((resolve, reject) => {
    async function continueExec() {
      if (settled) reject(new Error('continueExec() invoked after teardown!'));
      try {
        const tEntry = performance.now();

        for (;;) {
          for (;;) {
            const result = await next();
            if (result !== true) {
              // This particular suite run complete
              const [ran, skip, selected, errors] = result;
              endResult.total += selected;
              endResult.done += ran;
              endResult.skipped += skip;
              endResult.withErrors ||= errors;
              if (endResult.withErrors && bail) resolve(teardown());

              // Setup next run
              queuedIndex += 1;
              if (queuedIndex >= queued.length) break;
              next = queued[queuedIndex](reporter);
            }
            if (performance.now() - tEntry < interval) continue;

            setTimeout(continueExec);
            return;
          }
          suiteIndex += 1;
          if (suiteIndex >= suiteQueued.length) break;

          queued = suiteQueued[suiteIndex];
          queuedIndex = 0;
          next = queued[queuedIndex](reporter);
        }
      } catch (error) {
        teardown(true);
        reject(error);
      }

      resolve(teardown());
    }

    continueExec();
  });
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
