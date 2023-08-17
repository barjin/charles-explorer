import { removeNullishLiterals } from './index';

const input = {
    id: 'X00030572',
    names: {
    create: [
        {
        lang: 'cs',
        value: 'Economic Principles'
        },
        {
        lang: 'en',
        value: 'Economic Principles'
        }
    ]
    },
    annotation: {
    create: []
    },
    syllabus: {
    create: [
        {
        lang: 'cs',
        value: null
        },
        {
        lang: 'en',
        value: null
        }
    ]
    },
    faculties: {
    connect: {
        id: null,
    }
    }
  };

console.log(JSON.stringify(removeNullishLiterals(input as any), null, 2));