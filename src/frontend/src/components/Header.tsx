import { Button } from "@/components/ui/button";
import { Dna } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Dna className="w-6 h-6 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-foreground tracking-tight">
              Bio<span className="text-foreground">Size</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
              by Resilient Health Care Academy
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Home", "Calculators", "Methods", "Contact"].map((item) => (
            <button
              type="button"
              key={item}
              data-ocid={`nav.${item.toLowerCase()}.link`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <Button
          type="button"
          data-ocid="header.start_calculating.button"
          className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold"
          onClick={() =>
            document
              .getElementById("calculator")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Start Calculating
        </Button>
      </div>
    </header>
  );
}
