import chai, { expect } from 'chai';
import Plugin from './../src/Plugin';

chai.use(require('dirty-chai'));

describe('Plugin', () => {
  const options = {
    context: 'test-context',
    debug: true,
  };

  it('gets created successfully', () => {
    const plugin = new Plugin(options);

    expect(plugin instanceof Plugin).to.equal(true);
    expect(plugin.context).to.equal(options.context);
    expect(plugin.plugins).to.deep.equal([]);
  });

  it('gets initialised successfully', async() => {
    const plugin = new Plugin(options);

    const result = await plugin.init();

    expect(result).to.deep.equal(plugin);
  });
});
