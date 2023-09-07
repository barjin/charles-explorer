import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export function useChangeLanguage(locale: string) {
    let { i18n } = useTranslation();
    useEffect(() => {
      i18n.changeLanguage(locale);
    }, [locale, i18n]);
}