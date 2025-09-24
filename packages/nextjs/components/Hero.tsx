import Link from "next/link";
import Button from "./Button/Button";

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-secondary w-full rounded-tl-2xl">
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            "url('https://cdn.pixabay.com/photo/2020/03/06/08/00/laptop-4906312_1280.jpg') no-repeat center center / cover",
          opacity: 0.3,
          zIndex: 0,
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
              <Button variant={"primary"} onClick={() => (window.location.href = "/browse?tab=job")}>
                Browse Talent
              </Button>
            </Link>
            <Link href="/.">
              <Button variant={"primary"} onClick={() => (window.location.href = "/browse?tab=gig")}>
                Browse Gigs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
