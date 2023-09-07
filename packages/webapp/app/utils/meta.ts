const APP_NAME = 'Charles Explorer';

export function createMetaTitle(title?: string) {
  return title ? `${title} | ${APP_NAME}` : APP_NAME;
}