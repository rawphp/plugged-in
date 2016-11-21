import Moment from 'moment';
import chai, { expect } from 'chai';
import PluginManager from './../src/PluginManager';

chai.use(require('dirty-chai'));

describe('PluginManager', () => {
  let manager;
  let npm;

  const options = {
    context: 'test-context',
    debug: true,
  };

  beforeEach(() => {
    function onError() { }
    function setInitialisedAt() { }
    function setDefaultMaxHandlers() { }
    function cleanUp(event) { event.context._events = {}; }

    manager = new PluginManager(options);
    npm = {
      generateConfig: (mgr) => {
        mgr._events = {
          error: [onError],
          postInit: [setDefaultMaxHandlers, setInitialisedAt],
          exit: [cleanUp],
        };

        return mgr;
      },
    };
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
      const result = await manager.init({}, npm);

      expect(result).to.deep.equal(manager);
      expect(typeof result._events.error[0]).to.equal('function');
      expect(typeof result._events.postInit[0]).to.equal('function');
      expect(typeof result._events.postInit[1]).to.equal('function');
    }).timeout(10000);

    it('with local event handlers', async () => {
      const onGenerateConfig = (event) => {
        event.context.createdAt = new Moment();
      };

      const plugin = {
        provides: {
          generateConfig: onGenerateConfig,
        },
      };

      const result = await manager.init(plugin, npm);

      expect(result).to.deep.equal(manager);
      expect(typeof result._events.generateConfig[0]).to.equal('function');
      expect(typeof result._events.error[0]).to.equal('function');
      expect(typeof result._events.postInit[0]).to.equal('function');
      expect(typeof result._events.postInit[1]).to.equal('function');
      expect(typeof result._events.exit[0]).to.equal('function');
    });

    it('removes handler on exit', async () => {
      const result = await manager.init({}, npm);

      await manager.dispatch('exit', manager);

      expect(result).to.deep.equal(manager);
      expect(Object.keys(result._events).length).to.equal(0);
    });

    it('local event handler overrides external', async () => {
      const setDefaultMaxHandlers = (event) => {
        const mgr = event.context;

        if (mgr) {
          mgr.setMaxHandlers(10);
        }
      };

      const plugin = {
        provides: {
          postInit: setDefaultMaxHandlers,
        },
      };

      await manager.init(plugin, npm);

      const handlers = manager.handlers('postInit')
        .filter((handler) =>
          handler.name === 'setDefaultMaxHandlers');

      expect(handlers.length).to.equal(1);
      expect(manager._defaultMaxHandlers).to.equal(10);
    });

    it('local event handler adds to external', async () => {
      const setDefaultMaxHandlers = (event) => {
        const mgr = event.context;

        if (mgr) {
          mgr.setMaxHandlers(20);
        }
      };

      manager._override = false;

      const plugin = {
        provides: {
          postInit: setDefaultMaxHandlers,
        },
      };

      await manager.init(plugin, npm);

      const handlers = manager.handlers('postInit')
        .filter((handler) =>
          handler.name === 'setDefaultMaxHandlers');

      expect(handlers.length).to.equal(2);
      expect(manager._defaultMaxHandlers).to.equal(20);
    });
  });

  describe('hasHandlers', () => {
    it('returns true if it has at least one handler for an event', async () => {
      await manager.init({}, npm);

      expect(manager.hasHandlers('postInit')).to.equal(true);
    });

    it('returns false if it does not have any handlers for an event', async () => {
      await manager.init({}, npm);

      expect(manager.hasHandlers('preInit')).to.equal(false);
    });

    it('throw error if hasHandlers() not passed an event name', async () => {
      await manager.init({}, npm);

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
        await manager.init({}, npm);

        await manager.dispatch();
      } catch (error) {
        expect(error.message).to.equal('Event name not provided');
      }
    });

    it('dispatch event without context object should work', async () => {
      const config = { debug: true, start: 0 };

      const getConfig = (event) => {
        event.context.config = config;
      };

      const plugin = {
        provides: {
          preExec: getConfig,
        },
      };

      await manager.init(plugin, npm);

      const result = await manager.dispatch('preExec');

      expect(result.config).to.deep.equal(config);
    });
  });

  describe('addHandler', () => {
    it('accepts a new function handler for event', () => {
      const handler = (event) => {
        const context = event.context;

        context.data = 'data';
      };

      let handlers = manager.handlers('getData');

      expect(handlers.length).to.equal(0);

      const man = manager.addHandler('getData', handler);

      handlers = man.handlers('getData');

      expect(handlers.length).to.equal(1);
    });

    it('throws error when too many handlers are added for event', () => {
      try {
        const handler = (event) => {
          const context = event.context;

          context.data = 'data';
        };

        manager._defaultMaxHandlers = 1;

        manager.addHandler('getData', handler);
        manager.addHandler('getData', handler);
      } catch (error) {
        expect(error.message).to.equal('Exceeded maximum number of handlers for \'getData\' event');
      }
    });
  });

  describe('removeAllHandlers', () => {
    it('removes all handlers for an event', async () => {
      await manager.init({}, npm);

      expect(manager.handlers('postInit').length).to.equal(2);

      manager.removeAllHandlers('postInit');

      expect(manager.handlers('postInit').length).to.equal(0);
    });
  });

  describe('_getCallback', () => {
    it('loads plugin functions', async () => {
      const plugin = 'plugged-in-extras-plugin';
      const handlerName = 'cleanUp';

      const handler = await manager._getCallback(plugin, handlerName);

      expect(typeof handler).to.equal('function');
      expect(handler.name).to.equal(handlerName);
    });
  });
});
