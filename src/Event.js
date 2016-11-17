
export default class Event {
  /**
   * Create a new instance.
   *
   * @param {EventConfig} config event configuration
   */
  constructor(config) {
    this._name = config.name || 'event';
    this._data = config.data;
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
   * Get event data.
   *
   * @returns {*} the event data
   */
  get data() {
    return this._data;
  }

  /**
   * Set event data.
   *
   * @param {*} data the event data
   *
   * @returns {undefined}
   */
  set data(data) {
    this._data = data;
  }
}
