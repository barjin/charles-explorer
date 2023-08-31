import React, { createContext, useContext } from "react";

export type LangContextType = {
  lang: string;
  setLang: (value: string) => void;
  localize: (value: string | any[]) => string;
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  localize: () => "",
});

export const useLocalize = () => useContext(LangContext);

type LangProviderProps = LangContextType & {
    children: React.ReactNode;
};

export const LangProvider = ({
  lang,
  setLang,
  localize,
  children
}: LangProviderProps) => {
  return (
    <LangContext.Provider value={{ lang, setLang, localize }}>
      {children}
    </LangContext.Provider>
  );
};