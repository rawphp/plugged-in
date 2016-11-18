/**
 * This class represents the event that gets dispatched by the
 * PluginManager.
 */
export default class Event {
  /**
   * Create a new instance.
   *
   * @param {EventConfig} config         event configuration
   * @param {String}      config.name    event name
   * @param {Object}      config.context event context
   */
  constructor(config) {
    this._name = config.name || 'event';
    this._context = config.context;
  }

  /**
   * Get event name.
   *
   * @returns {String} the event name
   */
  get name() {
    return this._name;
  }

  /**
   * Get event context.
   *
   * @returns {Object} the event context
   */
  get context() {
    return this._context;
  }

  /**
   * Set event context.
   *
   * @param {Object} context the event context
   *
   * @returns {Event} this instance
   */
  set context(context) {
    this._context = context;

    return this;
  }
}
