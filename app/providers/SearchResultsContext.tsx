import React, { createContext, useContext } from "react";

type SearchResultsContextType = {
  searchResults: any[];
};

const SearchResultsContext = createContext<SearchResultsContextType>({
  searchResults: [],
});

export const useSearchResults = () => useContext(SearchResultsContext);

type SearchResultsProviderProps = {
  searchResults: any[];
  children: React.ReactNode;
};

export const SearchResultsProvider = ({
  searchResults,
  children,
}: SearchResultsProviderProps) => {
  return (
    <SearchResultsContext.Provider value={{ searchResults }}>
      {children}
    </SearchResultsContext.Provider>
  );
};