import { useTranslation } from "react-i18next";
import { useEffect } from "react";

/**
 * A helper hook for changing the language of the app within the i18n context.
 */
export function useChangeLanguage(locale: string) {
    const { i18n } = useTranslation();
    useEffect(() => {
      i18n.changeLanguage(locale);
    }, [locale, i18n]);
}