export default function MutualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mutual-theme flex min-h-dvh justify-center">
      <div className="flex h-dvh w-full max-w-lg flex-col">{children}</div>
    </div>
  );
}
