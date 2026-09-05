import './globals.css';

export const metadata = {
  title: 'Rural Ferry Staging & Boarding Tool',
  description: 'Weight-Balanced Boarding and Safety Control Surface for Ferry Masters',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
