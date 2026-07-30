/** Thrown on any denied or missing resource. Generic on purpose (no existence leak). */
export class NotFoundError extends Error {
  constructor() {
    super('Not found');
    this.name = 'NotFoundError';
  }
}
