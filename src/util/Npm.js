import Promise from 'bluebird';
import path from 'path';
import fs from 'fs-extra';
import writeJsonFile from 'write-json-file';
import childProcess from 'child_process';
import log from 'color-logger';
import Plugin from './../Plugin';
import Event from './../Event';

export default class Npm extends Plugin {
  constructor(config, loadedModules = {}) {
    super(config, loadedModules);

    log.debug = config.debug || false;
  }

  /**
   * Find package.json file.
   *
   * @param {String} [dir] optional directory to search
   *
   * @returns {Object} package
   */
  static findPackage(dir) {
    let packageObj = null;

    const directory = dir || `${__dirname}/../../`;

    try {
      const packageFilePath = path.resolve(directory, 'package.json');
      const json = fs.readFileSync(packageFilePath, { encode: 'utf8' });

      packageObj = JSON.parse(json);
    } catch (error) {
      const packageFilePath = path.resolve(directory, '../package.json');
      const json = fs.readFileSync(packageFilePath, { encode: 'utf8' });

      packageObj = JSON.parse(json);
    }

    return packageObj;
  }

  /**
   * Generates a plugin list.
   *
   * @returns {undefined}
   */
  async generateConfig() {
    log.i('generateConfig()');

    const sysPkg = Npm.findPackage();
    const sysConfig = sysPkg['plugged-in'];

    const configObj = {
      context: sysConfig.context,
      plugins: [],
    };

    const modules = await Npm.getModules();

    await Promise.mapSeries(modules, async (dir) => {
      const plugPkg = Npm.findPackage(dir);

      const config = plugPkg['plugged-in'];

      if (typeof config !== 'undefined') {
        log.i(`Plugin: ${dir}`);

        if (config.context === sysConfig.context) {
          const name = plugPkg.name;

          let plugin = { name };

          plugin = Object.assign(plugin, config);

          configObj.plugins.push(plugin);
        }
      }
    });

    this.plugins = configObj.plugins;

    const event = new Event({ name: 'onGenerateConfig', data: configObj });

    await this.exec(event);

    log.d(event);

    try {
      writeJsonFile('.plugged-in.json', event.data, { indent: 2 });
    } catch (error) {
      log.e('Writer Error', error);
    }
  }

  /**
   * Get installed modules.
   *
   * @returns {String[]} list of all module directories
   *
   * @private
   */
  static async getModules() {
    const modules = [];

    const execAsync = Promise.promisify(childProcess.exec);

    try {
      let result;

      try {
        result = await execAsync('npm ls --parseable', {});
      } catch (error) {
        log.e(
          error.message
            .replace('Command failed: npm ls --parseable', '')
            .replace('npm ERR! ', '')
        );
      }

      result
        .split('\n')
        .forEach((dir) => {
          if (dir.trim() !== '') {
            modules.push(dir);
          }
        });

      try {
        result = await execAsync('npm ls -g --parseable');
      } catch (error) {
        log.e(
          error.message
            .replace('Command failed: npm ls --parseable', '')
            .replace('npm ERR! ', '')
        );
      }

      result = await execAsync('npm ls -g --parseable');

      result
        .split('\n')
        .forEach((dir) => {
          if (dir.trim() !== '') {
            modules.push(dir);
          }
        });
    } catch (error) {
      log.e(error);
    }

    return modules;
  }
}
