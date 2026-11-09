import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="font-serif text-7xl text-gold">404</p>
      <h1 className="section-title mt-2">Page not found</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn btn-primary mt-6">Back to home</Link>
    </div>
  );
}
