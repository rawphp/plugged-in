import chai, { expect } from 'chai';
import PluginManager from './../src/PluginManager';

chai.use(require('dirty-chai'));

describe('PluginManager', () => {
  const options = {
    context: 'test-context',
    debug: true,
  };

  it('gets created successfully', () => {
    const plugin = new PluginManager(options);

    expect(plugin instanceof PluginManager).to.equal(true);
    expect(plugin.context).to.equal(options.context);
    expect(plugin.plugins).to.deep.equal([]);
  });

  it('gets initialised successfully', async() => {
    const plugin = new PluginManager(options);

    const result = await plugin.init();

    expect(result).to.deep.equal(plugin);
  });
});
