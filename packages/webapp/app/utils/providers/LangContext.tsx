import React, { createContext, useContext } from "react";

export type LangContextType = {
  lang: string;
  localize: (value: string | any[]) => string;
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  localize: () => "",
});

/**
 * A hook to access the lang and localize function. 
 * This is used to localize the **data** in the app - for localization of the UI, use the `react-i18next` library.
 * @returns 
 */
export const useLocalize = () => useContext(LangContext);

type LangProviderProps = LangContextType & {
    children: React.ReactNode;
};

/**
 * Language context provider.
 */
export const LangProvider = ({
  lang,
  localize,
  children
}: LangProviderProps) => {
  return (
    <LangContext.Provider value={{ lang, localize }}>
      {children}
    </LangContext.Provider>
  );
};