import { TrustBar } from './TrustBar';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  hideTrustBar?: boolean;
}

export function Layout({ children, hideTrustBar }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {!hideTrustBar && <TrustBar />}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
