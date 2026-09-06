import type { FormEvent, ReactNode } from "react";

interface SearchFormProps {
  children: ReactNode;
  className: string;
  onSearchSubmit: () => void;
}

export const SearchForm = ({ children, className, onSearchSubmit }: SearchFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit();
  };
  return (
    <form
      role="search"
      className={className}
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
};
