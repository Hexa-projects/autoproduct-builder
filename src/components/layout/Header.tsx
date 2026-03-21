import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CartDrawer } from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Search } from 'lucide-react';
import logo from '@/assets/logo.png';

const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Colecciones', to: '/colecciones' },
  { label: 'Contacto', to: '/contacto' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/colecciones?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4 sm:h-16">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logo} alt="Revolución Fit" className="h-7 sm:h-10" />
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden flex-1 md:flex md:max-w-md lg:max-w-lg mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="¿Qué estás buscando?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
            />
          </div>
        </form>

        <div className="flex items-center gap-1.5 ml-auto sm:gap-2">
          <CartDrawer />

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] max-w-[85vw] p-0">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="flex h-14 items-center border-b px-4">
                <img src={logo} alt="Revolución Fit" className="h-7" />
              </div>
              {/* Mobile search */}
              <form onSubmit={(e) => { handleSearch(e); setOpen(false); }} className="p-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <nav className="flex flex-col gap-1 p-4 pt-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom row: navigation links (desktop) */}
      <nav className="hidden border-t md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
