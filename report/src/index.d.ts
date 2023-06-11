export const UVB_REPORT_READY: string;

export class UvbReport extends HTMLElement {
  get reporter(): UvbReporter | undefined;
}
