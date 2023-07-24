//todo: add toggle
const currentLanguage = 'cs';

export const getLocalizedName = (object: { names: { value: string; lang: string; }[] } | null) => {
  return object?.names.find(x => x.lang == currentLanguage)?.value ?? 
    object?.names.find(x => x.lang == 'en')?.value;
}

export function capitalize(str: string) : string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}