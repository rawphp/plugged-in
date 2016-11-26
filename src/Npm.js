import Promise from 'bluebird';
import path from 'path';
import fs from 'fs-extra';
import fsp from 'fs-promise';
import childProcess from 'child_process';
import log from 'color-logger';
import validator from './util/schemaValidator';

const readFileAsync = Promise.promisify(fs.readFile);

/**
 * Utility class used by the PluginManager to discover and load plugins.
 */
export default class Npm {
  /**
   * Create a new instance.
   *
   * @param {Object} config config object
   */
  constructor(config) {
    this._debug = config.debug || false;

    log.debug = this._debug;
  }

  /**
   * Generates a plugin list.
   *
   * @param {String} manager  event context
   * @param {String} filePath path to new file
   *
   * @returns {Object} generated config
   */
  async generateConfig(manager, filePath) {
    log.i('generateConfig()');

    const configPath = filePath || '.plugged-in.json';

    try {
      const obj = await fsp.readJson(`${__dirname}/../package.json`);

      if (typeof obj['plugged-in'] === 'undefined') {
        throw new Error('package.json must have a `plugged-in` section definining the context');
      }

      const sysConfig = obj['plugged-in'];

      const configObj = {
        context: sysConfig.context,
        plugins: [],
      };

      const modules = await this.getModules();

      await Promise.mapSeries(modules, async (dir) => {
        try {
          const plugPkg = await Npm.findPackage(dir);

          if (plugPkg === null) {
            return;
          }

          const config = plugPkg['plugged-in'];

          if (typeof config !== 'undefined') {
            if (config.context === sysConfig.context) {
              const name = plugPkg.name;

              if (name === obj.name) {
                return;
              }

              await validator.validate(
                'http://plugged-in.x-c-o-d-e.com/schema/configuration+v1#',
                config
              );

              let plugin = { name };

              delete config.context;

              plugin = Object.assign(plugin, config);

              // check if we already have this plugin
              if (this._hasPlugin(plugin, configObj.plugins) === false) {
                configObj.plugins.push(plugin);
              }
            }
          }
        } catch (error) {
          log.e('process modules', error.message, dir);
        }
      });

      await manager.addPlugins(configObj.plugins);

      // dispatch event
      await manager.dispatch('generateConfig', configObj);

      // write configuration file
      await fsp.writeJson(configPath, configObj);

      return configObj;
    } catch (error) {
      log.e('generateConfig()', error.message);
    }

    return null;
  }

  /**
   * Find package.json file.
   *
   * @param {String} [dir] optional directory to search
   *
   * @returns {Object} package
   */
  static async findPackage(dir) {
    const directory = dir || __dirname;
    let packageObj = null;

    try {
      const packageFilePath = path.join(directory, 'package.json');

      const exists = fs.existsSync(packageFilePath);

      if (exists === false) {
        return packageObj;
      }

      const json = await readFileAsync(packageFilePath, { encode: 'utf8' });

      packageObj = JSON.parse(json);
    } catch (error) {
      log.w('findPackage()', error.message);
    }

    return packageObj;
  }

  /**
   * Execute shell command.
   *
   * @param {String} command command line command
   *
   * @returns {String} output
   */
  executeShell(command) {
    const bufferSize = 1024 * 500;

    return new Promise((resolve, reject) => {
      try {
        childProcess.exec(command, (error, stdout) =>
          resolve(stdout), { maxBuffer: bufferSize });
      } catch (error) {
        log.e(
          error.message
            .replace('Command failed: npm ls --parseable', '')
            .replace('npm ERR! ', '')
        );

        return reject(error);
      }

      return Promise.resolve();
    });
  }

  /**
   * Get installed modules.
   *
   * @returns {String[]} list of all module directories
   *
   * @private
   */
  async getModules() {
    let modules = [];

    try {
      let result = await this.executeShell('npm ls --parseable');

      modules = this._prepareModuleList(result);

      result = await this.executeShell('npm ls -g --parseable');

      modules = modules.concat(this._prepareModuleList(result));
    } catch (error) {
      log.e({ message: error.message });
    }

    return modules;
  }

  /**
   * Prepares module list from shell output.
   *
   * @param {String} data shell output
   *
   * @returns {String[]} list of modules
   *
   * @private
   */
  _prepareModuleList(data) {
    const modules = [];

    data
      .split('\n')
      .forEach((dir) => {
        if (dir.trim() !== '') {
          modules.push(dir);
        }
      });

    return modules;
  }

  /**
   * Determine if plugin already exists.
   *
   * @param {Object}   plugin  new plugin
   * @param {Object[]} plugins list of existing plugins
   *
   * @returns {Boolean} true or false
   *
   * @private
   */
  _hasPlugin(plugin, plugins) {
    let exists = false;

    plugins.forEach((plug) => {
      if (plug.name === plugin.name) {
        exists = true;
      }
    });

    return exists;
  }
}
