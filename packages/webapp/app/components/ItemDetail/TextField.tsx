import { Link, useLocation } from "@remix-run/react";
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { PiWarningFill } from 'react-icons/pi';
import { capitalize } from "~/utils/lang";
import { useCallback, useState } from "react";
import { getSearchUrl } from "~/utils/backend";
import { useLocalize } from "~/utils/providers/LangContext";
import { useTranslation } from "react-i18next";

/**
 * Strips HTML tags from a string
 * @param html The HTML string
 * @returns The string without HTML tags
 */
function stripHTML(html: string) {
    return html?.replaceAll(/<.*?>/gi, '');
  }

/**
 * Using some heuristics, determines if the text is a numbered list
 * @param text The text to check
 * @returns `true` if the text seems like a numbered list, `false` otherwise
 */
function isANumberedList(text: string) {
  const matches = Array.from(text?.matchAll(/\s?(\d+)(\.|\))\s/g)).map(x => x[1]);

  return matches.length > 3 && '123456789'.includes(matches.slice(0,5).join(''));
}
    
/**
 * Formats a text field to be displayed in the item detail page. Tries to trim the text and split it into paragraphs based on some heuristics.
 * @param text The text to format
 * @returns The formatted text
 */
function formatText(text: string | null | undefined) {
  text = stripHTML(text ?? ''); 

  if(isANumberedList(text ?? '')) {
    return text?.split(/\s(?=\d+[.)])/g)
    .map(x => x.trim().length > 0 ? x.trim() + ' \n' : x.trim())
    .filter(x => x.length > 0) ?? [];
  }

  const base = text?.split('______')
    .flatMap(x => x.split('\n'))
    .reduce((p, x) => {
      if (/\w/.test(x.trim()[0]) && x.trim()[0]?.toLowerCase() === x.trim()?.[0]) {
        p[p.length - 1] += x;
      } else {
        p.push(x);
      }
      return p;
    }, [''])
    .filter(x => x.trim().length > 0) ?? [];

  if (base.length < 2) {
    return text?.split(/\.\s(?=[A-Z])/g)
    .map((x, i, a) => x.trim().length > 0 && i !== (a.length - 1) ? x.trim() + '. ' : x.trim())
    .reduce((p, x, i) => {
      if (i % 2 === 1) {
        p[p.length - 1] += x;
      } else {
        p.push(x);
      }
      return p;
    }, [''])
    .filter(x => x.length > 0) ?? [];
  }

  return base;
}
  
/**
 * Given a field name and a data object, renders a text field in the item detail page
 * @param field The field name
 * @param data The data object. `data[field]` is the text to render.
 * @returns The rendered text field
 */
export default function TextField({field, data}: any) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { localize } = useLocalize();
  const { search } = useLocation();

  const { i18n, t } = useTranslation();

  const collapse = useCallback(() => {  
    setCollapsed(!collapsed);
  }, [collapsed]);

  return ((localize(data[field as keyof typeof data] as any))?.trim()?.length ?? -1) > 0 ?
      (<div key={field}>
        <h3 
          className="text-stone-800 font-sans font-semibold text-1xl py-2 hover:cursor-pointer select-none" 
          onClick={collapse}
          aria-label={`Toggle text field ${field}, currently ${collapsed ? 'collapsed' : 'expanded'}`}
          onKeyDown={(e) => {
            if(e.key === 'Enter') {
              collapse();
            }
          }} 
          tabIndex={0}
        >
          {
            !data[field].find(x => x.lang === i18n.language) && field !== 'keywords' ?
              <PiWarningFill style={{ display: 'inline', marginRight: '7px'}} size={18} color="orange" title={t('missingTranslation', { lang: data[field][0].lang })}/> : 
              null 
          }
          { capitalize(localize(field)) } { collapsed ? <FaChevronRight className="inline" /> : <FaChevronDown className="inline" /> }
        </h3>
        <div className={`text-stone-600 ${collapsed ? 'hidden' : ''} pt-2`}>
        { (() => {
            switch (field) {
              case 'keywords':
                return <div className="space-x-2">{
                    localize(data[field as keyof typeof data] as any)
                    ?.split(';')
                    .filter(x => x.trim().length > 0)
                    .map((x, i) => (
                      <Link 
                        key={i} 
                        to={getSearchUrl(data.category, x.trim(), new URLSearchParams(search))}
                        className={`
                          bg-orange-400
                          mb-2 
                          hover:cursor-pointer 
                          hover:bg-orange-300 
                          transition-colors select-none px-3 py-1 rounded-md inline-block  text-white w-fit`}
                        >
                          {x}
                      </Link>)
                    )
                  }</div>;
              default:
                return formatText(localize(data[field as keyof typeof data] as any))
                ?.map((x, i) => <p key={i} className="pb-2 px-3">{x}</p>)
            }
          })()
        }
        </div>
      </div>) : null
}