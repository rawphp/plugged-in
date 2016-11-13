/**
 * Copy an object or array.
 *
 * @param {*} obj the object to copy
 *
 * @returns {*} copied object
 */
export default function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
