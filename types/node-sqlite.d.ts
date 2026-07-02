declare module 'node:sqlite' {
  export interface StatementSync {
    run(...params: readonly unknown[]): unknown;
    get(...params: readonly unknown[]): unknown;
    all(...params: readonly unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(filename: string, mode?: number);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
