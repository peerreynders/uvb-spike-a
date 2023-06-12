export const UVUB_REPORT_READY: string;

export class UvubReport extends HTMLElement {
  constructor();
  get reporter(): Reporter | undefined;
}

export class UvubReportReadyEvent extends CustomEvent {
  constructor(binder: unknown);
  get reporter(): Reporter;
}
