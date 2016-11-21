import chai, { expect } from 'chai';
import Event from './../src/Event';

chai.use(require('dirty-chai'));

describe('Event', () => {
  it('created successfully', () => {
    const name = 'my-event';
    const context = 'my data';

    const event = new Event({ name, context });

    expect(event.name).to.equal(name);
    expect(event.context).to.equal(context);
  });

  it('allows to set context', () => {
    const event = new Event({ name: 'test' });

    event.context = 'my-context';

    expect(event.context).to.equal('my-context');
  });
});
