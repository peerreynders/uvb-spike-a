function emptyObject(obj) {
  for (const key in obj) return false;
  return true;
}

// Make the user context
// Not to be confused with the suite `ctx`
// which holds the user context as
// `ctx.state = context`
function userContext(init) {
  const context = {
    ['__test__']: '',
    ['__suite__']: name,
  };

  return init == undefined || emptyObject(init)
    ? context
    : Object.assign(context, init);
}

// Factory the core structure for a suite
// Confusingly `state` is the user context passed to the test
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

async function runner(ctx, name, reporter) {
  const { only, tests, before, after, bEach, aEach, state } = ctx;
  const arr = only.length ? only : tests;
  let done = 0,
    errors = [];

  try {
    reporter.groupStart(name);
    for (const hook of before) await hook(state);

    for (const test of arr) {
      state.__test__ = test.name;
      try {
        for (const hook of bEach) await hook(state);
        await test.handler(state);
        for (const hook of aEach) await hook(state);
        reporter.testPass();
        done += 1;
      } catch (err) {
        for (const hook of bEach) await hook(state);
        errors.push([err, test.name, name]);
        reporter.testFail();
      }
    }
  } finally {
    state.__test__ = '';
    for (const hook of after) await hook(state);

    const skipped = ctx.skipped + (only.length ? tests.length : 0);
    const selected = arr.length;
    reporter.groupResult(errors, selected, done, skipped);
    return [done, skipped, selected, errors.length > 0];
  }
}

const suiteRuns = new Map();

function queueTestRun(run, name) {
  let testRuns = suiteRuns.get(name);
  if (testRuns === undefined) {
    testRuns = [];
    suiteRuns.set(name, testRuns);
  }
  testRuns.push(run);
}

let execId;
let exec;

function defer() {
  if (exec == undefined || execId !== undefined) return;

  clearTimeout(execId);
  execId = setTimeout(exec);
}

// Helper to push `test` or `test.only`
// onto their respective collections
function makePushTest(tests) {
  return function pushTest(name, handler) {
    tests.push({ name, handler });
  };
}

// Helper to push a `before`, `after`,
// `bEach`, `aEach` hook
// onto their respective collections
function makePushHook(hooks) {
  return function pushHook(handler) {
    hooks.push(handler);
  };
}

function makeEachPushHook(top, each) {
  return Object.assign(makePushHook(top), { each: makePushHook(each) });
}

function setup(ctx, name = '') {
  const test = makePushTest(ctx.tests);
  const only = makePushTest(ctx.only);
  const before = makeEachPushHook(ctx.before, ctx.bEach);
  const after = makeEachPushHook(ctx.after, ctx.aEach);
  const skip = () => {
    ctx.skipped += 1;
  };
  const run = () => {
    // transfer suite context to test run
    const copy = { ...ctx };
    const runTest = runner.bind(undefined, copy, name);

    // Clean out suite context while sharing user context
    Object.assign(ctx, context(copy.state));
    queueTestRun(runTest, name);
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

// factory function for suite
function suite(name = '', init) {
  return setup(context(userContext(init)), name);
}

function trackTime(t0 = performance.now()) {
  return function stopTrack() {
    const t1 = performance.now();
    return t1 - t0;
  };
}

async function execute(reporter, bail) {
  const endTrack = trackTime();
  let done = 0,
    total = 0,
    skipped = 0,
    withErrors = false;

  for (const [name, group] of suiteRuns) {
    for (const runGroup of group) {
      const [ran, skip, selected, errors] = await runGroup(reporter);

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

function configure(reporter, options) {
  exec = () => execute(reporter, options?.bail);
}

export { configure, suite };
