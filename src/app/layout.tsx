import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Learning Path Analyzer",
  description: "Track and visualize your learning progress",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
