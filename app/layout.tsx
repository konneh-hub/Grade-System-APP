import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slughub",
  description: "Slughub academic portal for managing results, students, and administrative workflows.",
  icons: {
    icon: "/slughublogo.png",    shortcut: "/slughublogo.png",
    apple: "/slughublogo.png",  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
        {children}
      </body>
    </html>
  );
}
