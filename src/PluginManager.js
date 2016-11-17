import Promise from 'bluebird';
import fs from 'fs';
import { EventEmitter } from 'events';
import log from 'color-logger';
import Npm from './Npm';
import Event from './Event';

const fileSystem = Promise.promisifyAll(fs);

export default class PluginManager extends EventEmitter {
  /**
   * Create instance.
   *
   * @param {Object}  [options]               options object
   * @param {Boolean} [options.debug]         debug flag
   * @param {String}  [options.context]       context name
   * @param {String}  [options.configFile]    set the config file path
   * @param {Boolean} [options.override=true] whether to override matching functions
   */
  constructor(options = {}) {
    log.i('new PluginManager()', options);

    super(options);

    this._debug = options.debug || false;
    this._override = options.override || true;
    this._configFile = options.configFile || '.plugged-in.json';
    this.context = options.context;

    log.debug = options.debug || false;
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
   * Initialize with plugin property.
   *
   * @param {Object} plugin local event handlers
   *
   * @returns {PluginManager} this plugin
   */
  async init(plugin = {}) {
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

        // find plugins
        const npm = new Npm({ debug: this._debug });

        data = await npm.generateConfig(this);
      }

      if (typeof this.context === 'undefined') {
        this.context = data.context;
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
   * Note: The `data` parameter should be an object
   *
   * @param {String} eventName the event name
   * @param {Object} obj       the data object
   *
   * @returns {Object} the modified data object
   */
  async dispatch(eventName, obj) {
    const event = new Event({ name: eventName, data: obj });

    this.emit(eventName, event);

    return obj;
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
    const listeners = this.listeners(event)
      .map((listener) => listener.name);

    if (typeof handler === 'function') {
      return listeners.indexOf(handler.name) !== -1;
    }

    return listeners.indexOf(handler) !== -1;
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

    return this.listeners(event).length > 0;
  }

  /**
   * Removes a handler for an event that matches the handler function name.
   *
   * @param {String}          event   the event name
   * @param {Function|String} handler the function or its name
   *
   * @returns {undefined}
   */
  removeHandler(event, handler) {
    let name = handler;

    if (typeof name === 'function') {
      name = handler.name;
    }

    this.listeners(event).forEach((listener) => {
      if (listener.name === name) {
        this.removeListener(event, listener);
      }
    });
  }

  /**
   * Add local plugins.
   *
   * @param {Object[]} plugins list of plugins
   *
   * @returns {undefined}
   */
  async addPlugins(plugins) {
    if (Array.isArray(plugins) === false) {
      throw new Error('Plugins must be an array');
    }

    await Promise.mapSeries(plugins, async (plugin) => this._processPlugin(plugin));
  }

  /**
   * Add plugin handlers.
   *
   * @param {Object} plugin the plugin
   *
   * @returns {undefined}
   *
   * @private
   */
  async _processPlugin(plugin) {
    try {
      if (typeof plugin.provides === 'undefined') {
        return;
      }

      const pluginEvents = Object.keys(plugin.provides);

      await Promise.mapSeries(pluginEvents,
        async (eventName) => this._processEvent(plugin, eventName));
    } catch (error) {
      log.e(error.message);
    }
  }

  /**
   * Add plugin event.
   *
   * @param {Object} plugin    the plugin
   * @param {String} eventName the event name
   *
   * @returns {undefined}
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
  }

  /**
   * Add plugin handler.
   *
   * @param {Object}   plugin    the plugin
   * @param {String}   eventName the event name
   * @param {Function} handler   the handler
   *
   * @returns {undefined}
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
        return;
      }

      this._consolidateHandlers(eventName, func);

      this.on(eventName, func);
    } catch (error) {
      log.e(error.message);
    }
  }

  /**
   * This removes existing matching handler for an event if necessary.
   *
   * @param {String}   eventName event name
   * @param {Function} handler   the handler
   *
   * @returns {undefined}
   *
   * @private
   */
  _consolidateHandlers(eventName, handler) {
    if (this.hasHandler(eventName, handler) === true && this._override === true) {
      this.removeHandler(eventName, handler);
    }
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
