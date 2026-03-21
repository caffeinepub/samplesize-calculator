export function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <button
            type="button"
            className="hover:text-foreground transition-colors"
          >
            Site Map
          </button>
          <button
            type="button"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </button>
          <button
            type="button"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </button>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Developed by{" "}
          <span className="text-base font-semibold text-foreground">
            Resilient Health Care Academy
          </span>{" "}
          &nbsp;&middot;&nbsp; &copy; {year}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
