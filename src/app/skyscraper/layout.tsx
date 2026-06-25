import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skyscraper — your AI super-connector",
  description:
    "Tell Skyscraper about your social life and it helps you meet the right people, revive weak ties, and deepen the relationships that matter.",
};

export default function SkyscraperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
