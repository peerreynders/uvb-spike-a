import { Assertion } from '../../assert/src/index.js';
const UVUB_REPORT_READY = 'uvub-report:ready';

/**
 * @typedef {import('../../src').Reporter} Reporter
 */

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
 * @param {string} id
 * @returns {HTMLTemplateElement}
 */
function getTemplateById(id) {
  const template = document.getElementById(id);
  if (!(template instanceof HTMLTemplateElement))
    throw new Error('${id} template not found');

  return template;
}

/**
 * @param {HTMLTemplateElement} template
 * @returns {Node | undefined}
 */
const cloneTemplateRoot = (template) =>
  template.content.firstElementChild?.cloneNode(true);

const TEMPLATE_SUITE_ID = 'uvub-report-suite';

/** @type {undefined | HTMLTemplateElement} */
let suiteTemplate;

/** @returns {HTMLTableRowElement} */
function cloneSuiteTemplate() {
  const root = cloneTemplateRoot(
    suiteTemplate
      ? suiteTemplate
      : (suiteTemplate = getTemplateById(TEMPLATE_SUITE_ID))
  );

  if (!(root instanceof HTMLTableRowElement))
    throw new Error('cloneSuiteTemplate: Incorrect root type');

  return root;
}

const TEMPLATE_FAIL_ID = 'uvub-report-failure';

/** @type {undefined | HTMLTemplateElement} */
let failureTemplate;

/** @returns {HTMLTableSectionElement} */
function cloneFailureTemplate() {
  const root = cloneTemplateRoot(
    failureTemplate
      ? failureTemplate
      : (failureTemplate = getTemplateById(TEMPLATE_FAIL_ID))
  );

  if (!(root instanceof HTMLTableSectionElement))
    throw new Error('cloneFailureTemplate: Incorrect root type');

  return root;
}

const TEMPLATE_ERROR_ID = 'uvub-report-error';

/** @type {undefined | HTMLTemplateElement} */
let errorTemplate;

/** @returns {HTMLTableRowElement} */
function cloneErrorTemplate() {
  const root = cloneTemplateRoot(
    errorTemplate
      ? errorTemplate
      : (errorTemplate = getTemplateById(TEMPLATE_ERROR_ID))
  );

  if (!(root instanceof HTMLTableRowElement))
    throw new Error('cloneErrorTemplate: Incorrect root type');

  return root;
}

const TEMPLATE_SUMMARY_ID = 'uvub-report-summary';

/** @type {undefined | HTMLTemplateElement} */
let summaryTemplate;

/** @returns {HTMLTableElement} */
function cloneSummaryTemplate() {
  const root = cloneTemplateRoot(
    summaryTemplate
      ? summaryTemplate
      : (summaryTemplate = getTemplateById(TEMPLATE_SUMMARY_ID))
  );

  if (!(root instanceof HTMLTableElement))
    throw new Error('cloneSummaryTemplate: Incorrect root type');

  return root;
}

/**
 * @implements {Reporter}
 */
class UvubReporter {
  /** @type {UvubReport | undefined} */
  #report;
  /** @type {import('./internal').ReportEntry[]} */
  #entries;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #renderId;
  /** @type {(() => void) | undefined} */
  #notify;

  /** @param {UvubReport} report */
  constructor(report) {
    this.#report = report;
    this.#entries = [];
    this.#renderId = undefined;
    this.#notify = undefined;
  }

  /** @param {string} name */
  suiteStart(name) {
    if (this.#report === undefined) return;

    this.#entries.push({ kind: 'suite-start', name });

    this.scheduleRender();
  }

  /**
   * @param {import('../../src').SuiteErrors} errors
   * @param {number} selected
   * @param {number} done
   * @param {number} skipped
   */
  suiteResult(errors, selected, done, skipped) {
    console.log('suiteResult', errors, selected, done, skipped);
    if (this.#report === undefined) return;

    this.#entries.push({
      kind: 'suite-result',
      selected,
      passed: done,
      skipped,
      errors,
    });

    this.scheduleRender();
  }

  testPass() {
    if (this.#report === undefined) return;

    this.#entries.push({ kind: 'suite-test', passed: true });

    this.scheduleRender();
  }

  testFail() {
    if (this.#report === undefined) return;

    this.#entries.push({ kind: 'suite-test', passed: false });

    this.scheduleRender();
  }

  /** @param {import('../../src').EndResult} endResult */
  result(endResult) {
    if (this.#report === undefined) return;

    this.#entries.push({ kind: 'end-result', endResult });

    this.scheduleRender();
  }

  isAttached() {
    return this.#report !== undefined;
  }

  detach() {
    if (this.#renderId) clearTimeout(this.#renderId);
    this.#renderId = undefined;
    this.#entries.length = 0;

    this.#report = undefined;

    if (this.#notify) this.#notify();
    this.#notify = undefined;
  }

  /** @param {() => void} handler */
  onDetach(handler) {
    this.#notify = handler;
  }

  scheduleRender() {
    if (!this.#renderId) this.#renderId = setTimeout(this.render);
  }

  render = () => {
    if (this.#report === undefined) return;

    for (const entry of this.#entries) {
      switch (entry.kind) {
        case 'suite-start':
          this.#report.renderSuiteStart(entry.name);
          break;

        case 'suite-test':
          this.#report.renderSuiteTest(entry.passed);
          break;

        case 'suite-result':
          this.#report.renderSuiteResult(
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

          this.#report.renderSummary({
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
    this.#renderId = undefined;
    this.#entries.length = 0;
  };
}

/**
 * @param {string} name
 * @param {number} suiteNo
 * @returns {[HTMLTableRowElement, import('./internal').SuiteRefs]}
 */
function prepareSuite(name, suiteNo) {
  const root = cloneSuiteTemplate();
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

  return [
    root,
    {
      header,
      count,
      indicators,
      id,
      outcomes: [],
    },
  ];
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

/**
 * @param {string} name
 * @param {number} suiteNo
 * @param {number} failNo
 * @param {string} message
 * @param {string} operator
 * @returns {Element[]}
 */
function renderTestFailure(name, suiteNo, failNo, message, operator) {
  const root = cloneFailureTemplate();
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

/**
 * @param {number} suiteNo
 * @param {number} failNo
 * @param {string} stack
 * @returns {HTMLTableRowElement}
 */
function renderErrorStack(suiteNo, failNo, stack) {
  const root = cloneErrorTemplate();
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

/**
 * @returns {[HTMLTableElement, import('./internal').SummaryRefs]}
 */
function prepareSummary() {
  const root = cloneSummaryTemplate();
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

  return [
    root,
    {
      total,
      passedRow,
      passed,
      skipped,
      duration,
      tbody,
    },
  ];
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

class UvubReportReadyEvent extends CustomEvent {
  /** @param {UvubReport} report */
  constructor(report) {
    super(UVUB_REPORT_READY, { bubbles: true, detail: report });
  }

  get reporter() {
    /** @type {UvubReport} */
    const report = this.detail;
    return report.reporter;
  }
}

class UvubReport extends HTMLElement {
  /** @type { boolean } */
  #complete;
  #suiteNo;
  #failNo;

  /** @type {import('./internal').SummaryRefs} */
  #summary;
  /** @type {import('./internal').SuiteRefs | undefined} */
  #suite;

  /** @type {UvubReporter | undefined} */
  #reporter;

  constructor() {
    super();

    this.#complete = false;
    this.#suiteNo = 0;
    this.#failNo = 0;
    const [node, summary] = prepareSummary();
    this.replaceChildren(node);
    this.#summary = summary;
  }

  connectedCallback() {
    if (this.isConnected) {
      this.dispatchEvent(new UvubReportReadyEvent(this));
    }
  }

  disconnectedCallback() {
    this.detach();
  }

  detach() {
    if (this.#reporter) {
      this.#reporter.detach();
      this.#reporter = undefined;
    }
  }

  get reporter() {
    this.detach();
    this.#reporter = new UvubReporter(this);
    return this.#reporter;
  }

  resetSummary() {
    this.#complete = false;
    this.#suiteNo = 0;
    // this.#failNo = 0;
    const [node, summary] = prepareSummary();
    this.replaceChildren(node);
    this.#summary = summary;
  }

  /** @param {string} name */
  renderSuiteStart(name) {
    if (this.#complete) this.resetSummary();

    const [node, suite] = prepareSuite(name, this.#suiteNo);
    this.#summary.tbody.append(node);
    this.#suite = suite;

    this.#suiteNo += 1;
  }

  /** @param {boolean} passed */
  renderSuiteTest(passed) {
    if (this.#suite === undefined)
      throw new Error('renderSuiteTest: expected suite');

    updateSuiteTest(this.#suite, passed);
  }

  /**
   * @param {number} selected
   * @param {number} passed
   * @param {number} skipped
   * @param {import('./internal').ReportError[]} errors
   */
  renderSuiteResult(selected, passed, skipped, errors) {
    if (this.#suite === undefined)
      throw new Error('renderSuiteTest: expected suite');

    updateSuiteResult(this.#suite, selected, passed, skipped, errors.length);

    for (const error of errors) {
      const rows = renderTestFailure(
        error.testName,
        this.#suiteNo,
        this.#failNo,
        error.message,
        error.operator
      );
      this.#summary.tbody.append(...rows);

      if (error.stack) {
        const stackRow = renderErrorStack(
          this.#suiteNo,
          this.#failNo,
          error.stack
        );
        this.#summary.tbody.append(stackRow);
      }

      this.#failNo += 1;
    }
  }

  /** @param {import('./internal').ReportSummary} entry */
  renderSummary(entry) {
    this.#complete = true;
    if (this.#summary === undefined) return;

    updateSummary(this.#summary, entry);
  }
}

export { UVUB_REPORT_READY, UvubReport, UvubReportReadyEvent };
