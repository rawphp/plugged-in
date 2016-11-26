/**
 * Retrieves the body.
 *
 * @param {Event} event the event
 *
 * @returns {undefined}
 */
export default async function getBody(event) {
  const app = event.context;

  app.body = 'This is the real body. See []';
}
