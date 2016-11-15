import chai from 'chai';
import validator from './../../src/util/schemaValidator';

const expect = chai.expect;

describe('schemaValidator', () => {
  it('has all available schemas', () => {
    expect(Object.keys(validator.ajv._schemas).length).to.be.equal(2); // eslint-disable-line no-underscore-dangle, max-len
    expect(validator.ajv.getSchema('http://plugged-in.x-c-o-d-e.com/schema/configuration+v1#')).not.to.be.equal(undefined);
  });
});
