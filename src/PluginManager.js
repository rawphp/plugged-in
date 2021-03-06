import Promise from 'bluebird';
import fs from 'fs';
import log from 'color-logger';
import Npm from './Npm';
import Event from './Event';

const fileSystem = Promise.promisifyAll(fs);

/**
 * This class is usually the main part of the application.
 */
export default class PluginManager {
  /**
   * Create a new instance.
   *
   * @param {Object}  [options]               options object
   * @param {Boolean} [options.debug]         debug flag
   * @param {String}  [options.context]       context name
   * @param {String}  [options.configFile]    set the config file path
   * @param {Boolean} [options.override=true] whether to override matching functions
   */
  constructor(options = {}) {
    log.i('new PluginManager()', options);

    this._events = {};
    this._debug = options.debug || false;
    this._override = options.override || true;
    this._configFile = options.configFile || '.plugged-in.json';
    this._defaultMaxHandlers = null;
    this._context = options.context;

    log.debug = options.debug || false;
  }

  /**
   * Get the current application context.
   *
   * @returns {String} the context name
   */
  get context() {
    return this._context;
  }

  /**
   * Determine if running in debug mode.
   *
   * @returns {Boolean} true or false
   */
  get debug() {
    return this._debug;
  }

  /**
   * Get logger.
   *
   * @returns {Object} the logger instance
   */
  get log() {
    return log;
  }

  /**
   * Initialize the application.
   *
   * Generates config file if it does not exist and loads plugins.
   *
   * @param {Object} plugin local event handlers
   * @param {Object} [npm]  optional Npm instance
   *
   * @returns {PluginManager} this plugin
   */
  async init(plugin = {}, npm = new Npm({ debug: this._debug })) {
    log.i('PluginManager.init()');

    let data;

    try {
      const exists = fileSystem.existsSync(this._configFile);

      if (exists === true) {
        data = await fileSystem.readFileAsync(this._configFile);

        data = JSON.parse(data);

        await this.addPlugins(data.plugins);
      } else {
        log.d('.plugged-in.json does not exists');

        data = await npm.generateConfig(this);
      }

      if (typeof this._context === 'undefined') {
        this._context = data.context;
      }
    } catch (error) {
      log.e('PluginManager.init()', error.message);
    }

    // Add local plugin last so that it can override externals if necessary
    await this.addPlugins([plugin]);

    this.dispatch('postInit', this);

    return this;
  }

  /**
   * Helper method to dispatch events.
   *
   * @param {String} eventName the event name
   * @param {Object} [context] optional event context object
   *
   * @returns {Object} the modified data object
   */
  async dispatch(eventName, context) {
    if (typeof eventName === 'undefined') {
      throw new Error('Event name not provided');
    }

    if (typeof context === 'undefined') {
      context = {};
    }

    const event = new Event({ name: eventName, context });

    log.i(`Dispatching ${event.name}...`);

    const handlers = this.handlers(event.name);

    await Promise.mapSeries(handlers, async (func) => {
      console.log('Executing', func.name);

      try {
        await func(event);
      } catch (error) {
        throw error;
      }
    });

    return context;
  }

  /**
   * Returns a list of supported events.
   *
   * @returns {String[]} list of event names
   */
  eventNames() {
    return Object.keys(this._events);
  }

  /**
   * Get list of handlers for an event.
   *
   * @param {String} eventName the event name
   *
   * @returns {Function[]} list of handlers
   */
  handlers(eventName) {
    const result = this._events[eventName];

    if (typeof result === 'undefined') {
      return [];
    }

    return result;
  }

  /**
   * Adds a new handler to the event list.
   *
   * @param {String}   eventName the event name
   * @param {Function} handler   the callback function
   *
   * @returns {Object} this instance
   */
  addHandler(eventName, handler) {
    log.i(`addHandler() ${handler.name} for ${eventName}`);

    const handlers = this.handlers(eventName);

    if (handlers.length === 0) {
      this._events[eventName] = [];
    }

    if (this._defaultMaxHandlers !== null
      && handlers.length + 1 > this._defaultMaxHandlers
    ) {
      throw new Error(`Exceeded maximum number of handlers for '${eventName}' event`);
    }

    this._events[eventName].push(handler);

    return this;
  }

  /**
   * Get max event handlers.
   *
   * @returns {Integer} max number of handlers
   */
  getMaxHandlers() {
    return this._defaultMaxHandlers;
  }

  /**
   * Set max number of event handlers.
   *
   * @param {Integer} count max number
   *
   * @returns {Object} this instance
   */
  setMaxHandlers(count) {
    if (Number.isNaN(count)) {
      throw new Error(`Count: '${count}' is not a number`);
    }

    this._defaultMaxHandlers = count;

    return this;
  }

  /**
   * Determines if a handler exists for an event.
   *
   * @param {String}          event   the event name
   * @param {Function|String} handler the function or its name
   *
   * @returns {Boolean} true if exists, otherwise false
   */
  hasHandler(event, handler) {
    const handlers = this.handlers(event)
      .map((handle) => handle.name);

    if (typeof handler === 'function') {
      return handlers.indexOf(handler.name) !== -1;
    }

    return handlers.indexOf(handler) !== -1;
  }

  /**
   * Determines if an event has any handlers.
   *
   * @param {String} event the event name
   *
   * @returns {Boolean} true or false
   */
  hasHandlers(event) {
    if (typeof event === 'undefined') {
      throw new Error('Undefined event name');
    }

    return this.handlers(event).length > 0;
  }

  /**
   * Removes a handler for an event that matches the handler function name.
   *
   * @param {String}          eventName the event name
   * @param {Function|String} handler   the function or its name
   *
   * @returns {PluginManager} this instance
   */
  removeHandler(eventName, handler) {
    let name = handler;

    if (typeof name === 'function') {
      name = handler.name;
    }

    let index = 0;

    this.handlers(eventName).forEach((handle) => {
      if (handle.name === name) {
        this._events[eventName].splice([index], 1);
      }

      index += 1;
    });

    return this;
  }

  /**
   * Deletes all handlers for an event.
   *
   * @param {String} eventName the event name to removes
   *
   * @returns {Object} this instance
   */
  removeAllHandlers(eventName) {
    this._events[eventName] = [];

    return this;
  }

  /**
   * Add local plugins.
   *
   * @param {Object[]} plugins          list of plugins
   * @param {Object}   plugins.provides the provides object
   *
   * @returns {PluginManager} this instance
   */
  async addPlugins(plugins) {
    if (Array.isArray(plugins) === false) {
      throw new Error('Plugins must be an array');
    }

    await Promise.mapSeries(plugins, async (plugin) => this._processPlugin(plugin));

    return this;
  }

  /**
   * Add plugin handlers.
   *
   * @param {Object} plugin          the plugin
   * @param {Object} plugin.provides the provides object
   *
   * @returns {PluginManager} this instance
   *
   * @private
   */
  async _processPlugin(plugin) {
    try {
      if (typeof plugin.provides === 'undefined') {
        return this;
      }

      const pluginEvents = Object.keys(plugin.provides);

      await Promise.mapSeries(pluginEvents,
        async (eventName) => this._processEvent(plugin, eventName));
    } catch (error) {
      log.e(error.message);
    }

    return this;
  }

  /**
   * Add plugin event.
   *
   * @param {Object} plugin    the plugin
   * @param {String} eventName the event name
   *
   * @returns {PluginManager} this instance
   *
   * @private
   */
  async _processEvent(plugin, eventName) {
    try {
      let funcs = plugin.provides[eventName];

      if (Array.isArray(funcs) !== true) {
        funcs = [funcs];
      }

      await Promise.mapSeries(funcs, async (func) =>
        this._processHandler(plugin, eventName, func));
    } catch (error) {
      log.e(error.message);
    }

    return this;
  }

  /**
   * Add plugin handler.
   *
   * @param {Object}   plugin    the plugin
   * @param {String}   eventName the event name
   * @param {Function} handler   the handler
   *
   * @returns {PluginManager} this instance
   *
   * @private
   */
  async _processHandler(plugin, eventName, handler) {
    try {
      let func = handler;

      if (typeof handler === 'string') {
        func = await this._getCallback(plugin.name, handler);
      }

      if (func === null) {
        return this;
      }

      this
        ._consolidateHandlers(eventName, func)
        .addHandler(eventName, func);
    } catch (error) {
      log.e(error.message);
    }

    return this;
  }

  /**
   * This removes existing matching handler for an event if necessary.
   *
   * @param {String}   eventName event name
   * @param {Function} handler   the handler
   *
   * @returns {PluginManager} this instance
   *
   * @private
   */
  _consolidateHandlers(eventName, handler) {
    if (this.hasHandler(eventName, handler) === true && this._override === true) {
      this.removeHandler(eventName, handler);
    }

    return this;
  }

  /**
   * Get callback for plugin service.
   *
   * @param {Object}   pluginName the plugin
   * @param {String}   funcName   the name of the event
   *
   * @returns {Function} the handler
   *
   * @private
   */
  async _getCallback(pluginName, funcName) {
    try {
      const pg = require(`${pluginName}`); // eslint-disable-line global-require

      return pg[funcName];
    } catch (error) {
      log.e(`Unsupported action '${funcName}'`, error);
    }

    return null;
  }
}
