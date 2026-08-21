import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "The Challenge", id: "challenge" },
  { label: "The KTTC Way", id: "kttc-way" },
  { label: "Platform", id: "platform" },
  { label: "About", id: "about" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="font-serif text-xl font-semibold text-foreground">
          Keys to the City
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={`#${l.id}`}
              onClick={(e) => goToSection(e, l.id)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/explore"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm" className="border-border text-foreground">
              Log In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Join Now
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-6 pb-6 pt-4 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={`#${l.id}`}
              className="block py-3 text-sm text-muted-foreground"
              onClick={(e) => goToSection(e, l.id)}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/explore"
            className="block py-3 text-sm text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Explore
          </Link>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/login">
              <Button variant="outline" className="w-full border-border">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full bg-primary text-primary-foreground">Join Now</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
