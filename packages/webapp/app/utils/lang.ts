/**
 * Given an object with localized values (see `Text` in the schema), return the value for the given language.
 * @param object Array of { value, lang } pairs
 * @param options Options with the language to use and whether to fallback to the first value if the language is not found
 * @returns The value for the given language, or the first value if the language is not found and fallback is enabled
 */
export const getLocalized = (object: { value: string; lang: string }[] | null | undefined, options?: { lang?: string, fallback?: boolean }): string | undefined => {
  if ( options?.fallback === undefined ) {
    options = { ...options, fallback: true };
  }
  return object?.find(x => x.lang == options?.lang)?.value ?? 
    (options?.fallback ? object?.[0]?.value : '');
}

export function capitalize(str: string) : string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Localize a token or a text object.
 * 
 * @deprecated Use `react-i18next` hooks instead.
 */
const localizations = {
  cs: {
    'class': 'předmět',
    'person': 'osoba',
    'publication': 'publikace',
    'programme': 'studijní program',
    'syllabus': 'sylabus',
    'annotation': 'anotace',
    'abstract': 'abstrakt',
    'profiles': 'Profil absolventa',
    'keywords': 'klíčová slova',
    'at': 'na',
  },
} as const;

/**
 * Localize a token or a text object. Implementation of the [`LangProvider's`](@link LangProvider) `localize` function.
 * @param tokenOrTextObj Text object or token to localize
 * @param param1 Options with the language to use
 * @returns The localized text or empty string if the token is not found
 */
export function localize(tokenOrTextObj: string | any[] | undefined, { lang }: { lang: string }) : string {
  if ( Array.isArray(tokenOrTextObj) ) {
    return getLocalized(tokenOrTextObj, { lang }) ?? tokenOrTextObj[0]?.value ?? '';
  }

  if(lang === 'en') {
    return tokenOrTextObj ?? '';
  }
  return tokenOrTextObj ? localizations[lang]?.[tokenOrTextObj] ?? '' : '';
}