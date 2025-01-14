'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
import { Providers } from './providers';

const ClientWalletProvider = dynamic(
  () => import('./components/ClientWalletProvider').then(mod => mod.ClientWalletProvider),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('📦 Root layout rendering');
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}>
        <ClientWalletProvider>
          <Providers>
            {children}
          </Providers>
        </ClientWalletProvider>
      </body>
    </html>
  );
}