import { configure, exec } from './uvb';
import { all as allUvb } from './tests/uvb';
import { all as allSuite } from './tests/suite';
import { all as allAssert } from './tests/assert';
import { all as allDiff } from './tests/diff';

import { UvbReport, UVB_REPORT_READY } from './uvb/uvb-report';

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
