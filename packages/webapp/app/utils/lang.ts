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

export function localize(tokenOrTextObj: string | any[] | undefined, { lang }: { lang: string }) : string {
  if ( Array.isArray(tokenOrTextObj) ) {
    return getLocalized(tokenOrTextObj, { lang }) ?? tokenOrTextObj[0]?.value ?? '';
  }

  if(lang === 'en') {
    return tokenOrTextObj ?? '';
  }
  return tokenOrTextObj ? localizations[lang]?.[tokenOrTextObj] ?? '' : '';
}