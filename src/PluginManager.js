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
   * @param {Object}  [options]            options object
   * @param {Boolean} [options.debug]      debug flag
   * @param {String}  [options.context]    context name
   * @param {String}  [options.configFile] set the config file path
   */
  constructor(options = {}) {
    log.i('new PluginManager()', options);

    super(options);

    this._debug = options.debug;
    this._configFile = options.configFile || '.plugged-in.json';

    log.debug = options.debug || false;

    this.context = options.context;
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
   * @param {Object} data      the data object
   *
   * @returns {Object} the modified data object
   */
  async dispatch(eventName, data) {
    const event = new Event({ name: eventName, data });

    this.emit(eventName, event);

    return data;
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

    await Promise.mapSeries(plugins, async (plugin) => {
      if (typeof plugin.provides === 'undefined') {
        return null;
      }

      const pluginEvents = Object.keys(plugin.provides);

      await Promise.mapSeries(pluginEvents, async (key) => {
        let funcs = plugin.provides[key];

        if (Array.isArray(funcs) !== true) {
          funcs = [funcs];
        }

        await Promise.mapSeries(funcs, async (func) => {
          if (typeof func === 'function') {
            if (this.hasHandler(key, func) === false) {
              this.on(key, func);
            }
          } else if (typeof func === 'string') {
            const handles = await this._getCallback(plugin, key); // TODO add support

            handles.forEach((handle) => {
              if (this.hasHandler(key, handle) === false) {
                this.on(key, handle);
              }
            });
          } else {
            throw new Error('Unsupported event handler', func);
          }

          return null;
        });

        return null;
      });

      return null;
    });
  }

  /**
   * Determines if a handler exists for an event.
   *
   * @param {String}   event   the event name
   * @param {Function} handler the function
   *
   * @returns {Boolean} true if exists, otherwise false
   */
  hasHandler(event, handler) {
    const listeners = this.listeners(event);

    return listeners.indexOf(handler) !== -1;
  }

  /**
   * Get callback for plugin service.
   *
   * @param {Object} plugin the plugin
   * @param {String} eventName the name of the event
   *
   * @returns {Function[]} the handler
   */
  async _getCallback(plugin, eventName) {
    try {
      const funcs = [];

      log.d(`Checking plugin: ${plugin.name}`);

      let funcNames = plugin.provides[eventName];

      if (Array.isArray(funcNames) !== true) {
        funcNames = [funcNames];
      }

      funcNames.forEach((funcName) => {
        log.d(`Function Name: ${funcName}`);

        if (funcName === 'undefined') {
          return null;
        }

        const pg = require(`${plugin.name}`); // eslint-disable-line global-require

        const handler = pg[funcName];

        if (typeof handler === 'function') {
          funcs.push(handler);
        }

        return null;
      });

      return funcs;
    } catch (error) {
      if (plugin.provides[eventName].match(/^[.\/]/)) {
        log.e(`Unsupported action '${eventName}'`, error);
      } else {
        log.d(`Unsupported action '${eventName}'`, error);
      }
    }

    return null;
  }
}
