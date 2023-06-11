export const UVUB_REPORT_READY: string;

export class UvubReport extends HTMLElement {
  constructor();
  get reporter(): UvubReporter | undefined;
}

export class UvubReportReadyEvent extends CustomEvent {
  constructor(element: UvuReport);
  get reporter(): UvubReporter;
}
