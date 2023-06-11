import { configure, exec } from '../src';
import { all as allUvb } from './uvb';
import { all as allSuite } from './suite';
import { all as allAssert } from './assert';
import { all as allDiff } from './diff';

import { UvbReport, UVB_REPORT_READY } from '../report/src';

function reportReadyListener(event: Event): void {
  const reporter = (event.target as UvbReport).reporter;

  configure({
    reporter,
    interval: 20,
    bail: false,
    autorun: false,
  });

  // schedule test execution
  for (const run of allUvb()) run();
  for (const run of allSuite()) run();
  for (const run of allAssert()) run();
  for (const run of allDiff()) run();

  // execute all scheduled tests (automatic with `autorun: true`)
  exec().then((withErrors) =>
    console.log(`exec() finished withErrors: ${withErrors}`)
  );
}

document.addEventListener(UVB_REPORT_READY, reportReadyListener, {
  once: true,
});

if (window && 'customElements' in window) {
  customElements.define('uvb-report', UvbReport);
}
