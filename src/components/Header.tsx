import Link from "next/link";
import { getCategories, getPopularTerms, getSettings } from "@/lib/data";
import { getCustomer } from "@/lib/session";
import { normalizeSlugPathSegment } from "@/lib/slug";
import HeaderActions from "./HeaderActions";
import AnimatedLogo from "./AnimatedLogo";
import HeaderNav from "./HeaderNav";
import MobileMenu from "./MobileMenu";
import CompanySettingsLogo from "./CompanySettingsLogo";

export default async function Header() {
  const [cats, me, popular, settings] = await Promise.all([getCategories(), getCustomer(), getPopularTerms(), getSettings()]);
  const normCats = cats.map((c) => ({ ...c, slug: normalizeSlugPathSegment(c.slug) }));
  const top = normCats.filter((c) => !c.parent_id);
  const kids = (id: string) => normCats.filter((c) => c.parent_id === id);
  const topTree = top.map((c) => ({
    ...c,
    children: kids(c.id).map((k) => ({ ...k, children: kids(k.id) })),
  }));
  const brandName = settings?.brand_name?.trim() || settings?.company_name?.trim() || "Pineapple";
  const companyLogo = settings?.company_logo?.trim() || null;
  const supportPhone = settings?.support_phone?.trim() || settings?.phone?.trim() || "01777702000";

  return (
    <>
      <header className="w-full">
        {/* 2. Main Header Row */}
        <div className="border-b border-black/5 bg-white md:border-b-0">
          {/* Mobile: compact 3-column row (menu left, logo+tagline center, cart right) */}
          <div className="container-x grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 sm:gap-3 py-2 md:hidden">
            <div className="flex h-10 items-center justify-start self-start pt-1">
              <MobileMenu cats={topTree.map((c) => ({ id: c.id, name: c.name, slug: c.slug, children: c.children.map((k) => ({ name: k.name, slug: k.slug })) }))} />
            </div>
            <Link
              href="/"
              aria-label={brandName ? `${brandName} home` : "Home"}
              className="flex min-w-0 flex-col items-center justify-center justify-self-center px-1 text-center"
            >
              <span className="flex min-w-0 max-w-full items-center justify-center gap-2 sm:gap-3">
                <CompanySettingsLogo src={companyLogo} alt={brandName} className="h-10 sm:h-12 shrink-0" priority />
                <span className="min-w-0 shrink">
                  <AnimatedLogo variant="mobile" />
                </span>
              </span>
            </Link>
            <div className="flex h-10 items-center justify-end self-start pt-1 pl-1 sm:pl-2">
              <HeaderActions
                variant="mobileCart"
                name={me?.first_name ?? null}
                popular={popular}
                categories={top.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
                supportPhone={supportPhone}
              />
            </div>
          </div>

          {/* Desktop & Tablet */}
    
<div className="container-x relative hidden min-h-[72px] items-center justify-between gap-4 py-2 md:flex lg:min-h-[76px]">
  <Link
    href="/"
    aria-label={brandName ? `${brandName} home` : "Home"}
    className="hidden md:flex items-center shrink-0 gap-4 lg:gap-5 py-1"
  >
    <CompanySettingsLogo
      src={companyLogo}
      alt={brandName}
      className="h-14 lg:h-20"
      priority
    />

    <div className="flex flex-col items-center justify-center gap-1">
      <AnimatedLogo variant="desktop" />

      <span className="mt-0.5 max-w-[250px] text-center text-[10px] font-medium uppercase leading-tight  text-brand/80">
        Step Into The Festive Season With Pineapple
      </span>
    </div>
  </Link>

  {/* Center Search Pill & Right Actions */}
  <HeaderActions
    variant="desktop"
    name={me?.first_name ?? null}
    popular={popular}
    categories={top.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }))}
    supportPhone={supportPhone}
  />
</div>

        </div>
      </header>

      {/* 3. Category Nav bar: sticky on desktop, shown on mobile after scroll */}
      <HeaderNav brandName={brandName} top={topTree} />
    </>
  );
}
