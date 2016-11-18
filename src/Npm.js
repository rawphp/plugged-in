import Promise from 'bluebird';
import path from 'path';
import fs from 'fs-extra';
import writeJsonFile from 'write-json-file';
import childProcess from 'child_process';
import log from 'color-logger';
import readPackage from 'read-pkg-up';
import Event from './Event';
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
      const obj = await readPackage();

      if (typeof obj.pkg['plugged-in'] === 'undefined') {
        throw new Error('package.json must have a `plugged-in` section definining the context');
      }

      const sysConfig = obj.pkg['plugged-in'];

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

              if (name === obj.pkg.name) {
                return;
              }

              await validator.validate(
                'http://plugged-in.x-c-o-d-e.com/schema/configuration+v1#',
                config
              );

              let plugin = { name };

              delete config.context;

              plugin = Object.assign(plugin, config);

              configObj.plugins.push(plugin);
            }
          }
        } catch (error) {
          log.e('process modules', error.message, dir);
        }
      });

      manager.addPlugins(configObj.plugins);

      const event = new Event({ name: 'generateConfig', context: configObj });

      manager.emit(event.name, event);

      await writeJsonFile(configPath, event.context, { indent: 2 });

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
  async executeShell(command) {
    const bufferSize = 1024 * 500;

    const execAsync = Promise.promisify(childProcess.exec);

    try {
      return await execAsync(command, { maxBuffer: bufferSize });
    } catch (error) {
      log.e(
        error.message
          .replace('Command failed: npm ls --parseable', '')
          .replace('npm ERR! ', '')
      );

      return null;
    }
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
      log.e(error);
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
}
