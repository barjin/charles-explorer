const APP_NAME = 'Charles Explorer';

/**
 * Returns the meta title for the page
 * @param title The title of the page. If not given, only the app name will be returned.
 * @returns The meta title for the page
 */
export function createMetaTitle(title?: string) {
  return title ? `${title} | ${APP_NAME}` : APP_NAME;
}