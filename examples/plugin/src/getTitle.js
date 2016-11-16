/**
 * Retrieves the title.
 *
 * @param {Event} event the event
 *
 * @returns {undefined}
 */
export default async function getTitle(event) {
  const app = event.data;

  app.title = 'My Real Title';
}
