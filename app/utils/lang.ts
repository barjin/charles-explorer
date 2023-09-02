export const getLocalized = (object: { value: string; lang: string }[] | null | undefined, options?: { lang?: string, fallback?: boolean }): string | undefined => {
  if ( !options?.fallback ) {
    options = { ...options, fallback: true };
  }
  return object?.find(x => x.lang == options?.lang)?.value ?? 
    (options?.fallback ? object?.[0]?.value : undefined);
}

export function capitalize(str: string) : string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const localizations = {
  cze: {
    'class': 'předmět',
    'person': 'osoba',
    'publication': 'publikace',
    'programme': 'studium',
    'syllabus': 'sylabus',
    'annotation': 'anotace',
    'abstract': 'abstrakt',
    'keywords': 'klíčová slova',
    'at': 'na',
  },
} as const;

const plurals = {
  eng: {
    'class': {
      2: 'classes',
    },
    'person': {
      2: 'people',
    },
    'publication': {
      2: 'publications',
    },
    'programme': {
      2: 'programmes',
    },
  },
  cze: {
    'class': {
      2: 'předměty',
      5: 'předmětů',
    },
    'person': {
      2: 'osoby',
      5: 'osob',
    },
    'publication': {
      2: 'publikace',
      5: 'publikací',
    },
    'programme': {
      2: 'studijní programy',
      5: 'studijních programů',
    },
  },
}

export function getPluralLang(entity: string, count: number, { lang }: { lang: string }) : string {
  if ( count === 1 ) {
    return entity;
  }

  if ( count < 3 ) {
    count = 2;
  } else {
    count = 5;
  }

  if(lang === 'eng') {
    return plurals[lang][entity]?.[2] ?? entity + 's';
  }

  return plurals[lang][entity]?.[count] ?? entity + 'ů';
}

export function localize(tokenOrTextObj: string | any[] | undefined, { lang }: { lang: string }) : string {
  if ( Array.isArray(tokenOrTextObj) ) {
    return getLocalized(tokenOrTextObj, { lang }) ?? tokenOrTextObj[0]?.value ?? '';
  }

  if(lang === 'eng') {
    return tokenOrTextObj ?? '';
  }
  return tokenOrTextObj ? localizations[lang]?.[tokenOrTextObj] ?? '' : '';
}