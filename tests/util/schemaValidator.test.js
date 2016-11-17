import chai from 'chai';
import Ajv from 'ajv';
import validator from './../../src/util/schemaValidator';

const expect = chai.expect;

describe('schemaValidator', () => {
  const schema = 'http://plugged-in.x-c-o-d-e.com/schema/configuration+v2#';

  it('has Ajv instance as a property', () => {
    expect(validator.ajv instanceof Ajv).to.equal(true);
  });

  it('has all available schemas', () => {
    expect(Object.keys(validator.ajv._schemas).length).to.be.equal(3); // eslint-disable-line no-underscore-dangle, max-len
    expect(validator.ajv.getSchema('http://json-schema.org/draft-04/schema#')).not.to.be.equal(undefined);
    expect(validator.ajv.getSchema('http://plugged-in.x-c-o-d-e.com/schema/configuration+v1#')).not.to.be.equal(undefined);
    expect(validator.ajv.getSchema('http://plugged-in.x-c-o-d-e.com/schema/configuration+v2#')).not.to.be.equal(undefined);
  });

  it('successfully validates correct schema', async () => {
    const object = {
      schema,
      context: 'valid-context',
      provides: {
        init: 'onInit',
      },
    };

    await validator.validate(schema, object);
  });

  it('successfully validates invalid schema', async () => {
    try {
      const object = {
        schema,
        context: 'valid-context',
      };

      await validator.validate(schema, object);
    } catch (error) {
      expect(error.message).to.equal('data should have required property \'provides\'');
    }
  });
});
