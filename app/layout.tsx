export const metadata = {
  title: "Agentic Video Styler",
  description: "Transform videos with cinematic styles in-browser",
};

import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
