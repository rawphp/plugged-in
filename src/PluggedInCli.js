#!/usr/bin/env node

import minimist from 'minimist';
import fs from 'fs';
import Npm from './util/Npm';
import addCreatedAt from './plugins/addCreatedAt';

export default class PluggedInCli {
  constructor(argv, loadedModules = {}) {
    /** @type {PluggedInCliArgv} */
    this._argv = minimist(argv.splice(2));

    this.npm = new Npm({ debug: this._argv.verbose }, loadedModules);

    if (this._argv.h || this._argv.help) { // eslint-disable-line id-length
      this._showHelp();

      process.exit(0);
    }

    if (this._argv.v || this._argv.version) { // eslint-disable-line id-length
      this._showVersion();

      process.exit(0);
    }
  }

  /**
   * Execute the cli.
   *
   * @returns {Integer} 0 on success, other on failure
   */
  async exec() {
    return await this.npm.generateConfig();
  }

  /**
   * Show help for Pluggedin.
   *
   * @returns {undefined}
   *
   * @private
   */
  _showHelp() {
    console.log('Usage: pluggedin [ -c plugged-in.json ]');
    console.log('');
    console.log('Options');
    console.log('  --verbose', 'run in debug mode');
    console.log('  -h', 'output usage information');
    console.log('  -v', 'output the version number');
    console.log('');
  }

  /**
   * Show version of PluggedIn.
   *
   * @private
   *
   * @returns {undefined}
   */
  _showVersion() {
    const packageObj = Npm.findPackage();

    if (packageObj) {
      console.log(packageObj.version);
    } else {
      console.log('0.0.0');
    }
  }
}

const executedFilePath = fs.realpathSync(process.argv[1]);

if (executedFilePath === __filename) {
  const cli = new PluggedInCli(process.argv, { addCreatedAt });

  cli.exec();
}
