import kncLogo from "@/assets/knc-logo-gold.png";

export function PaperFooter({ createdAt }: { createdAt: string }) {
  return (
    <footer className="mt-12 border-t border-border pt-8 space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <img src={kncLogo} alt="Kings 'n Company" className="h-14 object-contain opacity-60" />
      </div>

      {/* Confidentiality notice */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mx-auto max-w-2xl">
        <p className="text-xs text-foreground/80 leading-relaxed">
          <span className="font-bold">⚠️ CONFIDENTIAL &amp; PROPRIETARY</span>{" "}
          This document is provided exclusively to verified members of Keys to the City. 
          Unauthorized distribution, reproduction, or sharing of this content is strictly prohibited. 
          This material is for informational purposes only and should be used in conjunction with 
          professional real estate, legal, and financial advice specific to your situation.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground/50 pt-2">
        <span>© {new Date().getFullYear()} Kings 'n Company | Keys to the City</span>
        <span>·</span>
        <span>For support: services@kingsncompany.com</span>
        <span>·</span>
        <span>Created: {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
      </div>
    </footer>
  );
}
