import Promise from 'bluebird';
import fs from 'fs';
import { EventEmitter } from 'events';
import log from 'color-logger';
import copy from './util/copy';
import Npm from './Npm';
import Event from './Event';

const fileSystem = Promise.promisifyAll(fs);

export default class PluginManager extends EventEmitter {
  /**
   * Create instance.
   *
   * @param {Object} options       options object
   * @param {Object} loadedModules loaded local modules
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
      this.addPlugins([plugin]);

      const exists = fileSystem.existsSync(this._configFile);

      if (exists === true) {
        data = await fileSystem.readFileAsync(this._configFile);

        data = JSON.parse(data);

        this.addPlugins(data.plugins);
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

    this.emit('postInit', new Event({ name: 'postInit', data: this }));

    return this;
  }

  /**
   * Add local plugins.
   *
   * @param {Object[]} plugins list of plugins
   *
   * @returns {undefined}
   */
  addPlugins(plugins) {
    if (Array.isArray(plugins) === false) {
      throw new Error('Plugins must be an array');
    }

    plugins.forEach((plugin) => {
      if (typeof plugin.provides === 'undefined') {
        return;
      }

      const pluginEvents = Object.keys(plugin.provides);

      pluginEvents.forEach(async (key) => {
        let handlers = [];

        let handler = plugin.provides[key];

        if (typeof handler === 'string') {
          handler = await this._getCallback(plugin, key);
        }

        if (Array.isArray(handler)) {
          handlers = handler;
        } else {
          handlers.push(handler);
        }

        handlers.forEach((func) => {
          this.on(key, func);
        });
      });
    });
  }

  /**
   * Get callback for plugin service.
   *
   * @param {Object} plugin the plugin
   * @param {String} eventName the name of the event
   *
   * @returns {Function} the handler
   */
  async _getCallback(plugin, eventName) {
    try {
      log.d(`Checking plugin: ${plugin.name}`);

      let funcName = plugin.provides[eventName];

      if (typeof funcName === 'object') {
        funcName = funcName.function;
      }

      log.d(`Function Name: ${funcName}`);

      if (funcName === 'undefined') {
        return null;
      }

      const pg = require(`${plugin.name}`); // eslint-disable-line global-require

      const handler = pg[funcName];

      if (typeof handler !== 'function') {
        return null;
      }

      return handler;
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
