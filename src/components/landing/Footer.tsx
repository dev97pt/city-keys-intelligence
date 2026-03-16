import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div>
          <p className="font-serif text-lg font-semibold text-foreground">Keys to the City</p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Your insider platform for building life abroad.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#platform" className="hover:text-foreground transition-colors">City Papers</a></li>
            <li><a href="#platform" className="hover:text-foreground transition-colors">Webinar Library</a></li>
            <li><a href="#platform" className="hover:text-foreground transition-colors">Partner Directory</a></li>
            <li><a href="#platform" className="hover:text-foreground transition-colors">Community</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experiences</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Explorer</a></li>
            <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Builder Retreat</a></li>
            <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Consultancy</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
            <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
            <li><a href="mailto:contact@keystothecity.com" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-border/30 pt-6">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 Keys to the City. A Kings & Company initiative.
        </p>
      </div>
    </footer>
  );
}
