const UVB_REPORT_READY = 'uvb-report:ready';

/**
 * @typedef {import('./internal').Reporter} Reporter
 */

/**
 * @implements {Reporter}
 */
class UvbReporter {
  /** @type {UvbReport | undefined} */
  #report;
  /** @type {(() => void) | undefined} */
  #notify;

  /** @param {UvbReport} report */
  constructor(report) {
    this.#report = report;
    this.#notify = undefined;
  }

  isAttached() {
    return this.#report !== undefined;
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
    console.log('result', endResult);
  }

  detach() {
    if (this.#notify) this.#notify();
    this.#notify = undefined;
    this.#report = undefined;
  }

  /** @param {() => void} handler */
  onDetach(handler) {
    this.#notify = handler;
  }
}

class UvbReport extends HTMLElement {
  /** @type {UvbReporter | undefined} */
  #reporter;

  constructor() {
    super();
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
}

export { UVB_REPORT_READY, UvbReport };
