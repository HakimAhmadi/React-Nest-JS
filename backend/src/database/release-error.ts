export class DatabaseReleaseError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
