//todo: add toggle
const currentLanguage = 'cs';

export const getLocalizedName = (object: { names: { value: string; lang: string; }[] } | null) => {
  return getLocalized(object?.names);
}

export const getLocalized = (object: { value: string; lang: string; }[] | null | undefined) => {
  return object?.find(x => x.lang == currentLanguage)?.value ?? 
    object?.find(x => x.lang == 'en')?.value;
}

export function capitalize(str: string) : string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}