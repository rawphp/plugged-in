import Promise from 'bluebird';
import Plugin from './Plugin';
import ActionEvent from './ActionEvent';
import FilterEvent from './FilterEvent';
import log from 'color-logger';

export default class Application extends Plugin {

  async onMapEvents() {
    log.d('Executing onMapEvents');

    const result1 = await super.exec('onMapEvents', 'my string');

    log.d('split result 1', result1);

    const event = new FilterEvent({ name: 'onMapEvents', data: 'my second string' });

    const result2 = await super.exec(event);

    log.d('split result 2', result2);

    return Promise.resolve();
  }

  async onGenerateEvents() {
    const event = new ActionEvent({ name: 'onGenerateEvents' });

    const result = await super.exec(event);

    log.d('split result', result);

    return Promise.resolve();
  }
}

const application = new Application({
  debug: true,
  pluginContext: 'pipeline-plugin',
});

application.init()
  // .then(() => application.onGenerateEvents)
  .then(() => application.onMapEvents)
  .catch((error) => {
    log.e('error', error);
  });
