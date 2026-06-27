declare module 'node:sqlite' {
  export interface StatementSync {
    run(...params: any[]): any;
    get(...params: any[]): any;
    all(...params: any[]): any;
  }

  export class DatabaseSync {
    constructor(filename: string, mode?: number);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
