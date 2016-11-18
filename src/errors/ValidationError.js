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

    this._message = message;
  }

  /**
   * Get the message.
   *
   * @returns {String} error message
   */
  get message() {
    return this._message;
  }

  /**
   * Set the message.
   *
   * @param {String} message the message body
   *
   * @return {ValidationError} this instance
   */
  set message(message) {
    this._message = message;

    return this;
  }

  /**
   * Get error name.
   *
   * @returns {String} the error name
   */
  get name() {
    return this.name;
  }
}
