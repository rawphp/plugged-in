import chai, { expect } from 'chai';
import Event from './../src/Event';

chai.use(require('dirty-chai'));

describe('Event', () => {
  it('created successfully', () => {
    const name = 'my-event';
    const data = 'my data';

    const event = new Event({ name, data });

    expect(event.name).to.equal(name);
    expect(event.data).to.equal(data);
  });
});
