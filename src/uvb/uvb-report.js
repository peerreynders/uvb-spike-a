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
    console.log('suiteStart', name);
  }

  /**
   * @param {import('./internal').SuiteErrors} errors
   * @param {number} selected
   * @param {number} done
   * @param {number} skipped
   */
  suiteResult(errors, selected, done, skipped) {
    console.log('suiteResult', errors, selected, done, skipped);
  }

  testPass() {
    console.log('testPass');
  }

  testFail() {
    console.error('testFail');
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

const summaryContent = (() => {
  const template = document.createElement('template');
  template.innerHTML = `<table>
  <tbody>
    <tr>
      <th scope="row">Total</th>
      <td class="js-uvb-report-total"></td>
    </tr>
    <tr>
      <th scope="row">Passed</th>
      <td class="js-uvb-report-passed"></td>
    </tr>
    <tr>
      <th scope="row">Skipped</th>
      <td class="js-uvb-report-skipped"></td>
    </tr>
    <tr>
      <th scope="row">Duration</th>
      <td class="js-uvb-report-duration"></td>
    </tr>
  </tbody>
</table>`;

  return template.content;
})();

/**
 * @returns {[HTMLElement, import('./internal').SummaryRefs]}
 */
function makeSummary() {
  // prettier-ignore
  const root = /** @type {HTMLElement} */(summaryContent.cloneNode(true));

  // Extraneous ?? to silence TS
  const total = root.querySelector('.js-uvb-report-total') ?? root;
  const passed = root.querySelector('.js-uvb-report-passed') ?? root;
  const passedRow = passed.parentElement ?? root;
  const skipped = root.querySelector('.js-uvb-report-skipped') ?? root;
  const duration = root.querySelector('.js-uvb-report-duration') ?? root;

  return [
    root,
    {
      total,
      passedRow,
      passed,
      skipped,
      duration,
    },
  ];
}

class UvbReport extends HTMLElement {
  /** @type { boolean } */
  #complete;

  /** @type {import('./internal').SummaryRefs} */
  #summary;

  /** @type {UvbReporter | undefined} */
  #reporter;

  constructor() {
    super();

    this.#complete = false;
    const [node, summary] = makeSummary();
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
    const [node, summary] = makeSummary();
    this.replaceChildren(node);
    this.#summary = summary;
  }

  renderSuiteStart() {
    if (this.#complete) this.resetSummary();
  }

  /** @param {import('./internal').ReportSummary} entry */
  renderSummary(entry) {
    this.#complete = true;
    if (this.#summary === undefined) return;

    const { total, passed, passedRow, skipped, duration } = this.#summary;
    total.textContent = entry.total;

    passed.textContent = entry.passed;
    const passedClass = passedRow.classList;
    if (entry.withErrors) {
      passedClass.remove('uvb-report--pass');
      passedClass.add('uvb-report--fail');
    } else {
      passedClass.remove('uvb-report--fail');
      passedClass.add('uvb-report--pass');
    }

    skipped.textContent = entry.skipped;
    const skippedClass = skipped.classList;
    if (entry.withSkips) {
      skippedClass.add('uvb-report--skip');
    } else {
      skippedClass.remove('uvb-report--skip');
    }

    duration.textContent = entry.duration;
  }
}

export { UVB_REPORT_READY, UvbReport };
