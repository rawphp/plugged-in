import Ajv from 'ajv';
import ValidationError from './../errors/ValidationError';

const ajv = new Ajv({ allErrors: true });

/* eslint-disable max-len  */
const pluggedInSchema = require('../../resources/schema/schema+v1.json');

ajv.addSchema(pluggedInSchema);

export default {
  ajv,
  /**
   * Validate schema.
   *
   * @param {String} schema schema id
   * @param {Object} body   the object to validate
   *
   * @returns {Boolean} True on success and throws ValidationError on false
   *
   * @throws ValidationError
   */
  async validate(schema, body) {
    const result = await ajv.validate(schema, body);

    if (result !== true) {
      throw new ValidationError(ajv.errorsText());
    }

    return true;
  },
};
