/**
 * Removes links from the body.
 *
 * @param {Event} event the event
 *
 * @returns {undefined}
 */
export default async function removeLinks(event) {
  const app = event.data;

  const body = app.body.replace(/<a\b[^>]*>(.*?)<\/a>/i, '');

  app.body = body;
}
