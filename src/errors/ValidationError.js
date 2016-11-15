
export default class ValidationError extends Error {
  /**
   * Create a new instance.
   *
   * @param {String} message the error message
   */
  constructor(message) {
    super(message);

    this.message = message;
    this.name = 'ValidationError';
  }
}
