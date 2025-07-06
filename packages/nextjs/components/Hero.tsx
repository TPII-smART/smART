import Link from "next/link";
import Button from "./Button";

export function Hero() {
  return (
    <div className="relative">
      <div
        className="absolute inset-0"
        style={{
          background: "var(--color-secondary)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-6xl"
            style={{ color: "var(--color-primary-content)" }}
          >
            Hire and be hired Securely on the Blockchain
          </h1>
          <p className="mt-6 text-lg leading-8" style={{ color: "var(--color-secondary-content)" }}>
            Discover high-quality professionals, find clients, and join a thriving community of freelance workers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/.">
              <Button variant={"primary"} onClick={() => (window.location.href = "/browse-jobs")}>
                Browse Jobs
              </Button>
            </Link>
            <Link href="/.">
              <Button variant={"primary"}>Offer your skills</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
