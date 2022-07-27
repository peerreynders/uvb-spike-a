const UVB_REPORT_READY = 'uvb-report:ready';

/**
 * @typedef {import('./internal').Reporter} Reporter
 */

const formatMs = new Intl.NumberFormat([], {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'unit',
  unit: 'millisecond',
  unitDisplay: 'short',
});

/**
 * @implements {Reporter}
 */
class UvbReporter {
  /** @type {UvbReport | undefined} */
  #report;
  /** @type {import('./internal').ReportEntry[]} */
  #entries;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #renderId;
  /** @type {(() => void) | undefined} */
  #notify;

  /** @param {UvbReport} report */
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
   * @param {import('./internal').SuiteErrors} errors
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

  /** @param {import('./internal').EndResult} endResult */
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
            entry.errors.length
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
  const id = `suite${suiteNo}`;
  const template = document.createElement('template');
  template.innerHTML = `<tr>
      <th id="${id}">${name}</th>
      <td class="js-uvb-report-test-count" headers="${id}" >( / )</td>
      <td class="js-uvb-report-test-indicator" headers="${id}" ></td>
    </tr>`;

  const root = template.content.firstChild;
  if (!(root instanceof HTMLTableRowElement))
    throw new Error('prepareSuite: Incorrect root type');

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

const summaryContent = (() => {
  const template = document.createElement('template');
  template.innerHTML = `<table>
  <tbody>
    <tr>
      <th id="total">Total</th>
      <td class="js-uvb-report-total" headers"total"></td>
    </tr>
    <tr>
      <th id="passed">Passed</th>
      <td class="js-uvb-report-passed" headers="passed"></td>
    </tr>
    <tr>
      <th id="skipped">Skipped</th>
      <td class="js-uvb-report-skipped" headers="skipped"></td>
    </tr>
    <tr>
      <th id="duration">Duration</th>
      <td class="js-uvb-report-duration" headers="duration"></td>
    </tr>
  </tbody>
</table>`;

  return template.content;
})();

/**
 * @returns {[HTMLTableElement, import('./internal').SummaryRefs]}
 */
function prepareSummary() {
  const root = summaryContent.cloneNode(true).firstChild;
  if (!(root instanceof HTMLTableElement))
    throw new Error('prepareSummary: Incorrect root type');

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

class UvbReport extends HTMLElement {
  /** @type { boolean } */
  #complete;
  #suiteNo;
  // #failNo;

  /** @type {import('./internal').SummaryRefs} */
  #summary;
  /** @type {import('./internal').SuiteRefs | undefined} */
  #suite;

  /** @type {UvbReporter | undefined} */
  #reporter;

  constructor() {
    super();

    this.#complete = false;
    this.#suiteNo = 0;
    // this.#failNo = 0;
    const [node, summary] = prepareSummary();
    this.replaceChildren(node);
    this.#summary = summary;
  }

  connectedCallback() {
    if (this.isConnected) {
      this.dispatchEvent(new CustomEvent(UVB_REPORT_READY, { bubbles: true }));
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
    this.#reporter = new UvbReporter(this);
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
   * @param {number} errors
   */
  renderSuiteResult(selected, passed, skipped, errors) {
    if (this.#suite === undefined)
      throw new Error('renderSuiteTest: expected suite');
    updateSuiteResult(this.#suite, selected, passed, skipped, errors);
  }

  /** @param {import('./internal').ReportSummary} entry */
  renderSummary(entry) {
    this.#complete = true;
    if (this.#summary === undefined) return;

    updateSummary(this.#summary, entry);
  }
}

export { UVB_REPORT_READY, UvbReport };
