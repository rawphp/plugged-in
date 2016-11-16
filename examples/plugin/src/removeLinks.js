/**
 * Removes links from the body.
 *
 * @param {Event} event the event
 *
 * @returns {undefined}
 */
export default async function removeLinks(event) {
  const app = event.data;

  // @TODO implement this more fully
  const body = 'clean';

  app.body = body;
}
