import { Assertion } from '../../assert/src/index.js';
const UVUB_REPORT_READY = 'uvub-report:ready';

/**
 * @typedef {import('./internal').UvubReporter} UvubReporter
 * @typedef {import('./internal').ReportBinder} ReportBinder
 * @typedef {import('./internal').Binder} Binder
 */

// --- Report Data Collection ---

const formatMs = new Intl.NumberFormat([], {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'unit',
  unit: 'millisecond',
  unitDisplay: 'short',
});

/** @param {string} s */
const trim = (s) => s.trim();

/** @param {string} trace */
function transformTrace(trace) {
  const i = trace?.indexOf('\n') ?? -1;
  if (i < 0) return '';

  return trace.substring(i).split('\n').map(trim).join('\n');
}

/**
 * @param {import('../../src').SuiteErrors[number]} suiteError
 * @returns {import('./internal').ReportError}
 */
function transformSuiteError(suiteError) {
  const [error, testName, suiteName] = suiteError;
  let message = '';
  let operator = '';
  let stack = '';

  if (error instanceof Error) {
    if (error.name) message = error.name;
    if (error.message)
      message = message ? `${message}: ${error.message}` : error.message;
    if (error instanceof Assertion && error.operator) operator = error.operator;
    if (typeof error.stack === 'string') stack = transformTrace(error.stack);
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = String(error);
  }

  return {
    suiteName,
    testName,
    message,
    operator,
    stack,
  };
}

/**
 * @param {ReportBinder} binder
 * @returns {UvubReporter}
 */
function makeReporter(binder) {
  /** @type {ReportBinder | undefined} */
  let report = binder;
  /** @type {import('./internal').ReportEntry[]} */
  let entries = [];
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let renderId = undefined;
  /** @type {(() => void) | undefined} */
  let notify = undefined;

  const render = () => {
    if (report === undefined) return;

    for (const entry of entries) {
      switch (entry.kind) {
        case 'suite-start':
          report.renderSuiteStart(entry.name);
          break;

        case 'suite-test':
          report.renderSuiteTest(entry.passed);
          break;

        case 'suite-result':
          report.renderSuiteResult(
            entry.selected,
            entry.passed,
            entry.skipped,
            entry.errors.map(transformSuiteError)
          );
          break;

        case 'end-result': {
          const total = `${entry.endResult.total}`;
          const passed = `${entry.endResult.done}`;
          const skipped = `${entry.endResult.skipped}`;
          const duration = formatMs.format(entry.endResult.duration);

          report.renderSummary({
            withErrors: entry.endResult.withErrors,
            withSkips: entry.endResult.skipped > 0,
            total,
            passed,
            skipped,
            duration,
          });

          break;
        }
      }
    }
    renderId = undefined;
    entries.length = 0;
  };

  const scheduleRender = () => {
    if (!renderId) renderId = setTimeout(render);
  };

  /** @type {UvubReporter} */
  const reporter = {
    suiteStart(name) {
      if (report === undefined) return;

      entries.push({ kind: 'suite-start', name });
      scheduleRender();
    },

    suiteResult(errors, selected, done, skipped) {
      console.log('suiteResult', errors, selected, done, skipped);
      if (report === undefined) return;

      entries.push({
        kind: 'suite-result',
        selected,
        passed: done,
        skipped,
        errors,
      });

      scheduleRender();
    },

    testPass() {
      if (report === undefined) return;

      entries.push({ kind: 'suite-test', passed: true });

      scheduleRender();
    },

    testFail() {
      if (report === undefined) return;

      entries.push({ kind: 'suite-test', passed: false });

      scheduleRender();
    },

    result(endResult) {
      if (report === undefined) return;

      entries.push({ kind: 'end-result', endResult });

      scheduleRender();
    },

    isAttached() {
      return report !== undefined;
    },

    onDetach(handler) {
      notify = handler;
    },

    detach() {
      if (renderId) clearTimeout(renderId);
      renderId = undefined;
      entries.length = 0;

      report = undefined;

      if (notify) notify();
      notify = undefined;
    },
  };

  return reporter;
}

// --- Report DOM Rendering ---

/**
 * @param {string} id
 * @returns {HTMLTemplateElement}
 */
function getTemplateById(id) {
  const template = document.getElementById(id);
  if (!(template instanceof HTMLTemplateElement))
    throw new Error('${id} template not found');

  return template;
}

const TEMPLATE_SUITE_ID = 'uvub-report-suite';
/** @type {undefined | HTMLTableRowElement} */
let suiteTemplate;

/**
 * @param {string} name
 * @param {number} suiteNo
 * @returns {import('./internal').SuiteRefs}
 */
function prepareSuite(name, suiteNo) {
  if (!suiteTemplate) {
    const element =
      getTemplateById(TEMPLATE_SUITE_ID).content.firstElementChild;

    if (!(element instanceof HTMLTableRowElement))
      throw new Error('prepareSuite: Incorrect root type');

    suiteTemplate = element;
  }

  // prettier-ignore
  const root =
		/** @type{typeof suiteTemplate} */(suiteTemplate.cloneNode(true));
  const header = root.querySelector('th');
  const count = root.querySelector('.js-uvb-report-test-count');
  const indicators = root.querySelector('.js-uvb-report-test-indicator');

  if (
    !(
      header instanceof HTMLTableCellElement &&
      count instanceof HTMLTableCellElement &&
      indicators instanceof HTMLTableCellElement
    )
  ) {
    throw new Error('prepareSuite: Missing references');
  }

  const id = `suite${suiteNo}`;

  header.setAttribute('id', id);
  header.textContent = name;
  count.headers = id;
  indicators.headers = id;

  return {
    root,
    header,
    count,
    indicators,
    id,
    outcomes: [],
  };
}

/**
 * @param {import('./internal').SuiteRefs} suite
 * @param {boolean} passed
 */
function updateSuiteTest(suite, passed) {
  suite.outcomes.push(passed ? '•' : '✘');
  const indicators = suite.outcomes.join(' ');
  suite.indicators.innerHTML = indicators;
}

/**
 * @param {import('./internal').SuiteRefs} suite
 * @param {number} selected
 * @param {number} passed
 * @param {number} skipped
 * @param {number} errors
 */
function updateSuiteResult(suite, selected, passed, skipped, errors) {
  suite.count.textContent = `(${passed}/${selected})`;
  const indicator =
    errors > 0
      ? 'uvb-report--fail'
      : skipped > 0
      ? 'uvb-report--skip'
      : 'uvb-report--pass';
  suite.count.classList.add(indicator);
}

const TEMPLATE_FAIL_ID = 'uvub-report-failure';
/** @type {undefined | HTMLTableSectionElement} */
let failureTemplate;

/**
 * @param {string} name
 * @param {number} suiteNo
 * @param {number} failNo
 * @param {string} message
 * @param {string} operator
 * @returns {Element[]}
 */
function renderTestFailure(name, suiteNo, failNo, message, operator) {
  if (!failureTemplate) {
    const element = getTemplateById(TEMPLATE_FAIL_ID).content.firstElementChild;

    if (!(element instanceof HTMLTableSectionElement))
      throw new Error('renderTestFailure: Incorrect root type');

    failureTemplate = element;
  }
  // prettier-ignore
  const root =
		/** @type{typeof failureTemplate} */(failureTemplate.cloneNode(true));
  const header = root.querySelector('th');
  const data = root.querySelector('td');
  const span = root.querySelector('span');

  if (
    !(
      header instanceof HTMLTableCellElement &&
      data instanceof HTMLTableCellElement &&
      span instanceof HTMLSpanElement
    )
  ) {
    throw new Error('renderTestFailure: Missing references');
  }

  const id = `fail${failNo}`;

  header.textContent = name;
  header.setAttribute('id', id);
  data.headers = `suite${suiteNo} ${id}`;

  if (operator) {
    span.textContent = `(${operator})`;
    const text = document.createTextNode(`${message} `);
    span.parentNode?.insertBefore(text, span);
  } else {
    data.textContent = message;
  }

  return Array.from(root.children);
}

const TEMPLATE_ERROR_ID = 'uvub-report-error';
/** @type {undefined | HTMLTableRowElement} */
let errorTemplate;

/**
 * @param {number} suiteNo
 * @param {number} failNo
 * @param {string} stack
 * @returns {HTMLTableRowElement}
 */
function renderErrorStack(suiteNo, failNo, stack) {
  if (!errorTemplate) {
    const element =
      getTemplateById(TEMPLATE_ERROR_ID).content.firstElementChild;

    if (!(element instanceof HTMLTableRowElement))
      throw new Error('renderErrorStack: Incorrect root type');

    errorTemplate = element;
  }
  // prettier-ignore
  const root =
		/** @type{typeof errorTemplate} */(errorTemplate.cloneNode(true));
  const data = root.querySelector('td');
  const pre = root.querySelector('pre');
  if (
    !(data instanceof HTMLTableCellElement && pre instanceof HTMLPreElement)
  ) {
    throw new Error('renderErrorStack: Missing references');
  }

  data.headers = `suite${suiteNo} fail${failNo}`;
  pre.textContent = stack;
  return root;
}

const TEMPLATE_SUMMARY_ID = 'uvub-report-summary';
/** @type {undefined | HTMLTableElement} */
let summaryTemplate;

/** @returns {import('./internal').SummaryRefs} */
function prepareSummary() {
  if (!summaryTemplate) {
    const element =
      getTemplateById(TEMPLATE_SUMMARY_ID).content.firstElementChild;

    if (!(element instanceof HTMLTableElement))
      throw new Error('prepareSummary: Incorrect root type');

    summaryTemplate = element;
  }

  // prettier-ignore
  const root =
		/** @type {typeof summaryTemplate}> */(summaryTemplate.cloneNode(true));
  const total = root.querySelector('.js-uvb-report-total');
  const passed = root.querySelector('.js-uvb-report-passed');
  const skipped = root.querySelector('.js-uvb-report-skipped');
  const duration = root.querySelector('.js-uvb-report-duration');
  const tbody = root.querySelector('tbody');

  // To silence TS
  if (
    !(
      total instanceof HTMLTableCellElement &&
      passed instanceof HTMLTableCellElement &&
      skipped instanceof HTMLTableCellElement &&
      duration instanceof HTMLTableCellElement &&
      tbody instanceof HTMLTableSectionElement
    )
  )
    throw new Error('prepareSummary: Missing references');

  const passedRow = passed.parentElement;
  if (!(passedRow instanceof HTMLTableRowElement))
    throw new Error('prepareSummary: Missing references 2');

  return {
    root,
    total,
    passedRow,
    passed,
    skipped,
    duration,
    tbody,
  };
}

/**
 * @param {import('./internal').SummaryRefs} summary
 * @param {import('./internal').ReportSummary} data
 */
function updateSummary(summary, data) {
  const { total, passed, passedRow, skipped, duration } = summary;
  total.textContent = data.total;

  passed.textContent = data.passed;
  const passedClass = passedRow.classList;
  if (data.withErrors) {
    passedClass.remove('uvb-report--pass');
    passedClass.add('uvb-report--fail');
  } else {
    passedClass.remove('uvb-report--fail');
    passedClass.add('uvb-report--pass');
  }

  skipped.textContent = data.skipped;
  const skippedClass = skipped.classList;
  if (data.withSkips) {
    skippedClass.add('uvb-report--skip');
  } else {
    skippedClass.remove('uvb-report--skip');
  }

  duration.textContent = data.duration;
}

/**
 * @param {(child: Node) => void} replaceWith
 * @returns {Binder}
 */
function makeBinder(replaceWith) {
  let complete = false;
  let suiteNo = 0;
  let failNo = 0;
  /** @type {import('./internal').SuiteRefs | undefined} */
  let suite;
  let summary = prepareSummary();
  replaceWith(summary.root);

  /** @type {ReportBinder} */
  const reportBinder = {
    resetSummary() {
      complete = false;
      suiteNo = 0;
      // failNo = 0;
      summary = prepareSummary();
      replaceWith(summary.root);
    },

    renderSuiteStart(name) {
      if (complete) reportBinder.resetSummary();

      suite = prepareSuite(name, suiteNo);
      summary.tbody.append(suite.root);

      suiteNo += 1;
    },

    renderSuiteTest(passed) {
      if (suite === undefined)
        throw new Error('renderSuiteTest: expected suite');

      updateSuiteTest(suite, passed);
    },

    renderSuiteResult(selected, passed, skipped, errors) {
      if (suite === undefined)
        throw new Error('renderSuiteTest: expected suite');

      updateSuiteResult(suite, selected, passed, skipped, errors.length);

      for (const error of errors) {
        const rows = renderTestFailure(
          error.testName,
          suiteNo,
          failNo,
          error.message,
          error.operator
        );
        summary.tbody.append(...rows);

        if (error.stack) {
          const stackRow = renderErrorStack(suiteNo, failNo, error.stack);
          summary.tbody.append(stackRow);
        }

        failNo += 1;
      }
    },

    renderSummary(entry) {
      complete = true;
      if (summary === undefined) return;

      updateSummary(summary, entry);
    },
  };

  /** @type {UvubReporter | undefined} */
  let reporter;

  /** @type {Binder} */
  const binder = {
    detach() {
      if (reporter) {
        reporter.detach();
        reporter = undefined;
      }
    },

    get reporter() {
      binder.detach();
      reporter = makeReporter(reportBinder);
      return reporter;
    },
  };

  return binder;
}

class UvubReportReadyEvent extends CustomEvent {
  /** @param {Binder} binder */
  constructor(binder) {
    super(UVUB_REPORT_READY, { bubbles: true, detail: binder });
  }

  get reporter() {
    /** @type {Binder} */
    const binder = this.detail;
    return binder.reporter;
  }
}

class UvubReport extends HTMLElement {
  /** @type { Binder } */
  binder;

  constructor() {
    super();

    this.binder = makeBinder((node) => {
      this.replaceChildren(node);
    });
  }

  connectedCallback() {
    if (this.isConnected) {
      this.dispatchEvent(new UvubReportReadyEvent(this.binder));
    }
  }

  disconnectedCallback() {
    this.binder.detach();
  }
}

export { UVUB_REPORT_READY, UvubReport, UvubReportReadyEvent };
