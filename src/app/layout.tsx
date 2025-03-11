import type { Metadata, Viewport } from 'next';
import './globals.css';

// לוג בסיסי בזמן טעינת הקובץ
console.log('layout.tsx file is being loaded');

export const metadata: Metadata = {
  title: 'עץ משפחה',
  description: 'אפליקציה לניהול ותצוגה של עץ משפחה',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0078D4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // לוג בזמן רינדור הקומפוננטה
  if (typeof window !== 'undefined') {
    console.log('RootLayout component is rendering on client');
  } else {
    console.log('RootLayout component is rendering on server');
  }
  
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
} 