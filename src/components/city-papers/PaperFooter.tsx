export function PaperFooter({ createdAt }: { createdAt: string }) {
  return (
    <footer className="mt-12 border-t border-border pt-8 space-y-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
        Confidential &amp; Proprietary
      </p>
      <p className="text-[10px] text-muted-foreground/50 max-w-xl mx-auto leading-relaxed">
        This document is provided exclusively to verified members of Keys to the City.
        Unauthorized distribution, reproduction, or sharing of this content is strictly prohibited.
        This material is for informational purposes only.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground/40 pt-2">
        <span>© {new Date().getFullYear()} Kings 'n Company</span>
        <span>·</span>
        <span>services@kingsncompany.com</span>
        <span>·</span>
        <span>Created: {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
      </div>
    </footer>
  );
}
