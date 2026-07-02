import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slughub",
  description: "Slughub academic portal for managing results, students, and administrative workflows.",
  icons: {
    icon: "/slughub.jpeg",    shortcut: "/slughub.jpeg",
    apple: "/slughub.jpeg",  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
