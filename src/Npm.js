import Promise from 'bluebird';
import path from 'path';
import fs from 'fs-extra';
import writeJsonFile from 'write-json-file';
import childProcess from 'child_process';
import log from 'color-logger';
import readPackage from 'read-pkg-up';

export default class Npm {
  constructor(config) {
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
    const directory = dir || __dirname;
    let packageObj = null;

    try {
      const packageFilePath = path.join(directory, 'package.json');

      log.i(`Find package in ${packageFilePath}`);

      const json = fs.readFileSync(packageFilePath, { encode: 'utf8' });

      packageObj = JSON.parse(json);
    } catch (error) {
      log.e('findPackage()', error.message);
    }

    return packageObj;
  }

  /**
   * Generates a plugin list.
   *
   * @returns {Object} generated config
   */
  async generateConfig() {
    log.i('generateConfig()');

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

      const modules = await Npm.getModules();

      log.d(modules);

      await Promise.mapSeries(modules, async (dir) => {
        try {
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
        } catch (error) {
          log.e('process modules', error.message);
        }
      });

      await writeJsonFile('.plugged-in.json', configObj, { indent: 2 });

      return configObj;
    } catch (error) {
      log.e('generateConfig()', error.message);
    }

    return null;
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
    const bufferSize = 1024 * 500;

    const execAsync = Promise.promisify(childProcess.exec);

    try {
      let result;

      try {
        result = await execAsync('npm ls --parseable', { maxBuffer: bufferSize });
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
        result = await execAsync('npm ls -g --parseable', { maxBuffer: bufferSize });
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
    } catch (error) {
      log.e(error);
    }

    return modules;
  }
}
