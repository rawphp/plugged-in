/**
 * The validation error class.
 *
 * Thrown by the SchemaValidator when an invalid object is passed into the `validate()` method.
 */
export default class ValidationError extends Error {
  /**
   * Create a new instance.
   *
   * @param {String} message the error message
   */
  constructor(message) {
    super(message);

    this.name = 'ValidationError';
  }

  /**
   * @returns {String} the error name
   */
  get name() {
    return this.name;
  }
}
