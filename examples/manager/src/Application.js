import { PluginManager } from 'plugged-in'; // eslint-disable-line import/no-unresolved

export default class Application extends PluginManager {
  constructor(config) {
    super(config);

    this.debug = config.debug || false;

    this._title = 'Default Title';
    this._body = 'Not Defined';
  }

  /**
   * Gets default title or one supplied by a plugin.
   *
   * @event {getTitle}
   *
   * @returns {String} the title
   */
  get title() {
    this.dispatch('getTitle', this);

    return this._title;
  }

  /**
   * Set title.
   *
   * @param {String} title the title
   *
   * @returns {undefined}
   */
  set title(title) {
    this._title = title;
  }

  /**
   * Gets default body or one supplied by a plugin.
   *
   * @event {getBody}
   *
   * @returns {String} the body
   */
  get body() {
    this.dispatch('getBody', this);

    return this._body;
  }

  /**
   * Set body.
   *
   * @param {String} body the body
   *
   * @returns {undefined}
   */
  set body(body) {
    this._body = body;
  }
}
