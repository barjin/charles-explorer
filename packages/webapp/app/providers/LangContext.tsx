import type React from "react";
import { createContext, useContext } from "react";

export type LangContextType = {
  lang: string;
  localize: (value: string | any[]) => string;
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  localize: () => "",
});

export const useLocalize = () => useContext(LangContext);

type LangProviderProps = LangContextType & {
    children: React.ReactNode;
};

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