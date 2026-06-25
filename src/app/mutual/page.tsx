import type { Metadata } from "next";
import { MutualApp } from "./components/MutualApp";

export const metadata: Metadata = {
  title: "Mutual",
  description: "Coordinate plans with friends.",
};

export default function MutualPage() {
  return <MutualApp />;
}
