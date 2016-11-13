import Moment from 'moment';
import log from 'color-logger';
import assert from 'assert';

/**
 * Adds createdAt to the config file.
 *
 * @param {FilterEvent} event the onGenerateConfig event
 *
 * @returns {undefined}
 */
export default function addCreatedAt(event) {
  log.i('addCreatedAt()');

  assert.ok(typeof event === 'object', 'event should be an object');

  const date = new Moment();

  let config = event.data;

  if (typeof config !== 'undefined' && typeof config.context !== 'undefined') {
    config = Object.assign(config, { createdAt: date });

    event.data = config;
  }
}
