import Promise from 'bluebird';
import fs from 'fs-extra';
import chai, { expect } from 'chai';
import Npm from './../src/Npm';

chai.use(require('dirty-chai'));

const copyAsync = Promise.promisify(fs.copy);
const removeAsync = Promise.promisify(fs.remove);
const readJson = Promise.promisify(fs.readJson);

describe('Npm', () => {
  let npm;

  beforeEach(() => {
    npm = new Npm({ debug: true });
  });

  it('gets created successfully', () => {
    expect(npm instanceof Npm).to.equal(true);
    expect(npm._debug).to.equal(true);
  });

  describe('findPackage', () => {
    it('finds a package.json successfully', async () => {
      const pkg = await Npm.findPackage(`${__dirname}/../`);

      expect(pkg.name).to.equal('plugged-in');
    });

    it('returns null if package not found', async () => {
      const pkg = await Npm.findPackage(__dirname);

      expect(pkg).to.equal(null);
    });
  });

  describe('executeShell', () => {
    it('executes ls command successfully', async () => {
      const result = await npm.executeShell('ls');

      const files = [];

      result
        .split('\n')
        .forEach((dir) => {
          if (dir.trim() !== '') {
            files.push(dir);
          }
        });

      expect(files.indexOf('src')).to.not.equal(-1);
      expect(files.indexOf('tests')).to.not.equal(-1);
      expect(files.indexOf('node_modules')).to.not.equal(-1);
    });
  });

  describe('getModules', () => {
    const modulesSdkPath = `${__dirname}/../node_modules/aws-sdk`;

    afterEach(async () => {
      await removeAsync(modulesSdkPath);
    });

    it('returns empty list if `extraneous` modules are installed', async () => {
      const sdkpath = `${__dirname}/fixtures/packages/aws-sdk`;

      await copyAsync(sdkpath, modulesSdkPath);

      const modules = await npm.getModules();

      expect(modules.length).to.equal(0);
    }).timeout(10000);

    it('gets list of installed modules successfully', async () => {
      const modules = await npm.getModules();

      expect(modules.length > 0).to.equal(true);
      expect(typeof modules[0]).to.equal('string');
    }).timeout(10000);
  });

  describe('generateConfig', async () => {
    const configPath = `${__dirname}/out/config.json`;

    afterEach(async () => {
      await removeAsync(configPath);
    });

    it('generates a new .plugged-in.json file successfully', async () => {
      const manager = {
        addPlugins: () => manager,
        emit: () => manager,
      };

      await npm.generateConfig(manager, configPath);

      const conf = await readJson(configPath);

      expect(conf.context).to.equal('plugged-in');
      expect(conf.plugins.length).to.equal(1);
    }).timeout(20000);
  });
});
