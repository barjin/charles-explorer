import React, { createContext, useContext } from "react";
import { type entityTypes } from "~/utils/entityTypes";

export type SearchResultsContextType = {
  searchResults: any[];
  query: string;
  category: entityTypes;
  setContext: (value: {searchResults: any[], query: string, category: entityTypes}) => void;
};

const SearchResultsContext = createContext<SearchResultsContextType>({
  searchResults: [],
  query: "",
  category: "person",
  setContext: () => {},
});

export const useSearchResults = () => useContext(SearchResultsContext);

type SearchResultsProviderProps = SearchResultsContextType & {
    children: React.ReactNode;
};

export const SearchResultsProvider = ({
  searchResults,
  query,
  category,
  setContext,
  children
}: SearchResultsProviderProps) => {
  return (
    <SearchResultsContext.Provider value={{ searchResults, query, category, setContext }}>
      {children}
    </SearchResultsContext.Provider>
  );
};