import Moment from 'moment';
import chai, { expect } from 'chai';
import PluginManager from './../src/PluginManager';

chai.use(require('dirty-chai'));

describe('PluginManager', () => {
  let manager;

  const options = {
    context: 'test-context',
    debug: true,
  };

  beforeEach(() => {
    manager = new PluginManager(options);
  });

  it('gets created successfully', () => {
    expect(manager instanceof PluginManager).to.equal(true);
    expect(manager.context).to.equal(options.context);
  });

  it('gets initialised successfully', async () => {
    try {
      const result = await manager.init();

      expect(result).to.deep.equal(manager);
      expect(typeof result._events.error).to.equal('function');
    } catch (error) {
      console.log('error', error);
    }
  }).timeout(10000);

  it('init with local event handlers', async () => {
    try {
      const onGenerateConfig = (event) => {
        event.data.createdAt = new Moment();
      };

      const onAddInitialisedAt = (event) => {
        event.data.initialisedAt = new Moment();
      };

      const plugin = {
        provides: {
          generateConfig: onGenerateConfig,
          postInit: onAddInitialisedAt,
        },
      };

      const result = await manager.init(plugin);

      expect(result).to.deep.equal(manager);
      expect(typeof result._events.error).to.equal('function');
      expect(typeof result._events.generateConfig).to.equal('function');
      expect(typeof result._events.postInit).to.equal('function');
    } catch (error) {
      console.log('error', error);
    }
  });
});
