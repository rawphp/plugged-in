import Moment from 'moment';
import chai, { expect } from 'chai';
import PluginManager from './../src/PluginManager';
import Event from './../src/Event';

chai.use(require('dirty-chai'));

describe('PluginManager', () => {
  let manager;

  const options = {
    context: 'test-context',
    debug: false,
  };

  beforeEach(() => {
    manager = new PluginManager(options);
  });

  it('gets created successfully', () => {
    expect(manager instanceof PluginManager).to.equal(true);
    expect(manager.context).to.equal(options.context);
    expect(manager.debug).to.equal(options.debug);
  });

  it('has logger', () => {
    expect(typeof manager.log._debug === 'boolean').to.equal(true);
  });

  describe('init', () => {
    it('gets initialised successfully', async () => {
      const result = await manager.init();

      expect(result).to.deep.equal(manager);
      expect(typeof result._events.error).to.equal('function');
      expect(typeof result._events.postInit[0]).to.equal('function');
      expect(typeof result._events.postInit[1]).to.equal('function');
    }).timeout(10000);

    it('init with local event handlers', async () => {
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
    });

    it('removes listeners on exit', async () => {
      const result = await manager.init();

      const event = new Event({ name: 'exit', data: manager });

      manager.emit('exit', event);

      expect(result).to.deep.equal(manager);
      expect(Object.keys(result._events).length).to.equal(0);
    });

    it('local event handler overrides external', async () => {
      const setDefaultMaxHandlers = (event) => {
        const mgr = event.data;

        if (mgr) {
          mgr.setMaxListeners(10);
        }
      };

      const plugin = {
        provides: {
          postInit: setDefaultMaxHandlers,
        },
      };

      await manager.init(plugin);

      const handlers = manager.listeners('postInit')
        .filter((handler) =>
          handler.name === 'setDefaultMaxHandlers');

      expect(handlers.length).to.equal(1);
      expect(manager._maxListeners).to.equal(10);
    });

    it('local event handler adds to external', async () => {
      const setDefaultMaxHandlers = (event) => {
        const mgr = event.data;

        if (mgr) {
          mgr.setMaxListeners(20);
        }
      };

      manager._override = false;

      const plugin = {
        provides: {
          postInit: setDefaultMaxHandlers,
        },
      };

      await manager.init(plugin);

      const handlers = manager.listeners('postInit')
        .filter((handler) =>
          handler.name === 'setDefaultMaxHandlers');

      expect(handlers.length).to.equal(2);
      expect(manager._maxListeners).to.equal(20);
    });
  });

  describe('hasHandlers', () => {
    it('returns true if it has at least one handler for an event', async () => {
      await manager.init();

      expect(manager.hasHandlers('postInit')).to.equal(true);
    });

    it('returns false if it does not have any handlers for an event', async () => {
      await manager.init();

      expect(manager.hasHandlers('preInit')).to.equal(false);
    });

    it('throw error if hasHandlers() not passed an event name', async () => {
      await manager.init();

      try {
        manager.hasHandlers();
      } catch (error) {
        expect(error.message).to.equal('Undefined event name');
      }
    });
  });

  describe('dispatch', () => {
    it('throws error if event name is not provided', async () => {
      try {
        await manager.init();

        await manager.dispatch();
      } catch (error) {
        expect(error.message).to.equal('Event name not provided');
      }
    });

    it('dispatch event without data object should work', async () => {
      const config = { debug: true, start: 0 };

      const getConfig = (event) => {
        event.data.config = config;
      };

      const plugin = {
        provides: {
          preExec: getConfig,
        },
      };

      await manager.init(plugin);

      const result = await manager.dispatch('preExec');

      expect(result.config).to.deep.equal(config);
    });
  });
});
