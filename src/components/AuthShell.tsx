import Image from "next/image";

export default function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md border border-line bg-white p-8 shadow-sm">
        <Image src="/logo-mark.png" alt="" width={48} height={90} className="mx-auto mb-4 h-16 w-auto" />
        <h1 className="mb-6 text-center font-serif text-3xl text-brand">{title}</h1>
        {children}
      </div>
    </div>
  );
}
