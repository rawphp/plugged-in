
export default class Event {
  constructor(config) {
    this._name = config.name || 'event';
    this._data = config.data;
  }

  get name() {
    return this._name;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = data;
  }
}
