import type { Handler, SuiteErrors, Reporter, EndResult } from './internal';

// suite
export import Handler = Handler;

export type RegisterHook<U extends object = Record<string, never>> = (
  handler: Handler<U>
) => void;
export type RegisterHookTop<U extends object = Record<string, never>> = {
  (handler: Handler<U>): void;
  each: RegisterHook<U>;
};
export type RegisterTest<U extends object = Record<string, never>> = (
  name: string,
  handler: Handler<U>
) => void;
export type RegisterSkip<U extends object = Record<string, never>> = (
  _name?: string,
  _handler?: Handler<U>
) => void;

export type Suite<U extends object = Record<string, never>> = {
  (name: string, handler: Handler<U>): void;
  only: RegisterTest<U>;
  skip: RegisterSkip<U>;
  before: RegisterHookTop<U>;
  after: RegisterHookTop<U>;
  run: () => void;
};

export import EndResult = EndResult;

export import SuiteErrors = SuiteErrors;

export import Reporter = Reporter;

export type Configuration = {
  reporter: Reporter;
  autorun?: boolean;
  bail?: boolean;
  interval?: number;
};

export function configure(config: Configuration): void;

export function suite<U extends object = Record<string, never>>(
  name?: string,
  userContext?: U
);

export async function exec(config?: Configuration): Promise<boolean>;

export const test: Suite<Record<string, never>>;
