import type { ReactNode } from "react";

type PrismThemeMode = "light" | "dark";

export function PrismTheme({
  children,
  theme = "light",
  className = "",
}: {
  children: ReactNode;
  theme?: PrismThemeMode;
  className?: string;
}) {
  return (
    <div className={`prism-theme ${className}`.trim()} data-theme={theme}>
      {children}
    </div>
  );
}
