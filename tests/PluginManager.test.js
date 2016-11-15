import Moment from 'moment';
import chai, { expect } from 'chai';
import PluginManager from './../src/PluginManager';
import Event from './../src/Event';

chai.use(require('dirty-chai'));

describe.only('PluginManager', () => {
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
      expect(typeof result._events.postInit[0]).to.equal('function');
      expect(typeof result._events.postInit[1]).to.equal('function');
    } catch (error) {
      console.log('error', error);
    }
  }).timeout(10000);

  it('init with local event handlers', async () => {
    try {
      const onGenerateConfig = (event) => {
        event.data.createdAt = new Moment();
      };

      const plugin = {
        provides: {
          generateConfig: onGenerateConfig,
        },
      };

      const result = await manager.init(plugin);

      expect(result).to.deep.equal(manager);
      expect(typeof result._events.generateConfig).to.equal('function');
      expect(typeof result._events.error).to.equal('function');
      expect(typeof result._events.postInit[0]).to.equal('function');
      expect(typeof result._events.postInit[1]).to.equal('function');
      expect(typeof result._events.exit).to.equal('function');
    } catch (error) {
      console.log('error', error);
    }
  });

  it('removes listeners on exit', async () => {
    try {
      const result = await manager.init();

      const event = new Event({ name: 'exit', data: manager });

      manager.emit('exit', event);

      expect(result).to.deep.equal(manager);
      expect(Object.keys(result._events).length).to.equal(0);
    } catch (error) {
      console.log('error', error);
    }
  });
});
