import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font for a clean look
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContentGuard', // Update title
  description: 'Filter the web, your way.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster */}
      </body>
    </html>
  );
}
