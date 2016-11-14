import Promise from 'bluebird';
import copy from './util/copy';
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
   * @param {Object} options       options object
   * @param {Object} loadedModules loaded local modules
   */
  constructor(options = {}, loadedModules = {}) {
    super(options);

    this._debug = options.debug;

    log.debug = options.debug || false;

    log.d('new PluginManager()', options);

    this._plugins = options.plugins || [];
    this._context = options.context || 'default';
    this._loadedModules = loadedModules;
  }

  /**
   * Get plugin context.
   *
   * @returns {String} the context
   */
  get context() {
    return this._context;
  }

  /**
   * Get plugins.
   *
   * @returns {Object[]} list of plugins
   */
  get plugins() {
    return this._plugins;
  }

  /**
   * Setter for plugins.
   *
   * @param {PluginManager[]} plugins plugins array
   *
   * @returns {undefined}
   */
  set plugins(plugins) {
    this._plugins = this._plugins.concat(plugins);

    this.emit('setPlugins', this.plugins);
  }

  /**
   * Initialize with plugin property.
   *
   * @param {Object[]} plugins expect plugins property.
   *
   * @returns {PluginManager} this plugin
   */
  async init(plugins = []) {
    log.i('PluginManager.init()');
    log.d('plugins', plugins);

    this._plugins = copy(plugins);

    try {
      const exists = fileSystem.existsSync('.plugged-in.json');

      log.d('exists', exists);

      if (exists === true) {
        let data = await fileSystem.readFileAsync('.plugged-in.json');

        log.d('data', data.toString());

        data = JSON.parse(data);

        log.d('.plugged-in.json', data);

        this._context = data.context;
        this._plugins = this._plugins.concat(data.plugins);
      } else {
        log.d('.plugged-in.json does not exists');

        // find plugins
        const util = new Npm({ debug: this._debug });

        await util.generateConfig();
      }
    } catch (error) {
      log.e('PluginManager.init()', error.message);
    }

    this.emit('init');

    log.d(this);

    return this;
  }

  /**
   * Exec an event.
   *
   * @param {Event} event the event to execute
   *
   * @returns {PluginManager} this plugin
   */
  async exec(event) {
    log.i('PluginManager.exec()');

    const providers = (await this.getProviders(event.name))
      .filter((provider) => provider !== null)
      .sort((providerA, providerB) => {
        if (providerA.order > providerB.order) {
          return 1;
        }

        if (providerA.order < providerB.order) {
          return -1;
        }

        // providerA must be equal to providerA
        return 0;
      });

    log.i('exec count:', providers.length);

    if (event instanceof Event) {
      await Promise.mapSeries(providers, async (handler) => {
        const func = handler.handler;

        await func(event);
      });
    }

    this.emit('exec');

    return this;
  }

  /**
   * Get list of providers.
   *
   * @param {String} service service name
   *
   * @returns {Object[]} list of providers
   */
  async getProviders(service) {
    log.i('Plugins:', this._plugins.length);

    return await Promise.all(this._plugins.map(async (plugin) => {
      log.d(plugin);

      const provider = {
        handler: null,
        order: 1,
      };

      try {
        log.d(`Checking plugin: ${plugin.name}`);

        let funcName = plugin.provides[service];

        if (typeof funcName === 'object') {
          provider.order = funcName.order;
          funcName = funcName.function;
        }

        log.d(`Function Name: ${funcName}`);

        if (funcName === 'undefined') {
          return null;
        }

        if (typeof this._loadedModules[funcName] === 'function') {
          log.d('Local plugin');

          provider.handler = this._loadedModules[funcName];
        } else {
          log.d('External plugin');

          const pg = require(`${plugin.name}`); // eslint-disable-line global-require

          log.d('Package', pg);

          provider.handler = pg[funcName];
        }

        if (typeof provider.handler !== 'function') {
          return null;
        }

        return provider;
      } catch (error) {
        if (plugin.provides[service].match(/^[.\/]/)) {
          log.e(`Unsupported action '${service}'`, error);
        } else {
          log.d(`Unsupported action '${service}'`, error);
        }
      }

      return null;
    }));
  }
}
