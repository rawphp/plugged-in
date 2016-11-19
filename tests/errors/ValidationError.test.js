import chai, { expect } from 'chai';
import ValidationError from './../../src/errors/ValidationError';

chai.use(require('dirty-chai'));

describe('ValidationError', () => {
  it('created successfully', () => {
    const message = 'my error';

    const error = new ValidationError(message);

    expect(error.name).to.equal('ValidationError');
    expect(error.message).to.equal(message);
  });

  it('allows setting custom message', () => {
    const newMessage = 'new message';

    const error = new ValidationError('');

    expect(error.message).to.not.equal(newMessage);

    error.message = newMessage;

    expect(error.message).to.equal(newMessage);
  });
});
