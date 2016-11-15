import chai, { expect } from 'chai';
import copy from './../../src/util/copy';

chai.use(require('dirty-chai'));

describe('copy', () => {
  it('copy object successfully', () => {
    const person = {
      name: 'Tim',
      age: 25,
      countries: ['Australia', 'US'],
      attr: {
        pinkie: 2,
      },
    };

    const newPerson = copy(person);

    expect(newPerson).to.deep.equal(person);
    expect(newPerson !== person).to.equal(true);
  });

  it('copy string', () => {
    const string = 'my wonderful string';

    const newString = copy(string);

    expect(newString).to.equal(string);
  });

  it('copy array', () => {
    const array = [1, 2, 3, 'ab'];

    const newArray = copy(array);

    expect(newArray).to.equal(newArray);
  });
});
