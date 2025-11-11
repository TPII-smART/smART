"use client";

import Button from "~~/components/Button/Button";

// app/not-found.tsx

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-6">
      <h1 className="text-6xl font-bold text-primary-content">404</h1>
      <p className="text-xl text-primary-content">Oops! The page you’re looking for doesn’t exist.</p>
      <Button variant="primary" onClick={() => (window.location.href = "/")}>
        Go Home
      </Button>
    </div>
  );
}
