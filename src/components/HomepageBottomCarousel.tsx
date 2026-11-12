import HeroSlider from "@/components/HeroSlider";
import { getHomepageBottomCarousel } from "@/lib/data";

export default async function HomepageBottomCarousel() {
  const items = await getHomepageBottomCarousel();
  if (!items.length) return null;

  return (
    <HeroSlider
      ariaLabel="Homepage bottom carousel"
      banners={items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle || null,
        description: item.description || null,
        image_url: item.image_url || null,
        mobile_image_url: item.mobile_image_url || null,
        cta_text: item.button_text || null,
        cta_link: item.button_url || null,
      }))}
    />
  );
}