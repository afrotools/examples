import type { Product } from "@/types";

export const PRODUCTS: Product[] = [
  {
    id: "boubou-broude-peul",
    name: "Boubou Brodé Peul",
    nameFr: "Boubou Brodé Peul",
    description:
      "Traditional embroidered robe from the Fula (Peul) people of Guinea. Hand-stitched with intricate geometric patterns in rich earth tones.",
    descriptionFr:
      "Boubou traditionnel brodé du peuple Peul de Guinée. Cousu à la main avec des motifs géométriques complexes aux riches tons terreux.",
    price: 185_000,
    category: "Vêtements",
  },
  {
    id: "djembe-djoliba-artisan",
    name: "Djembé Djoliba Artisan",
    nameFr: "Djembé Djoliba Artisan",
    description:
      "Handcrafted djembe drum made by master artisans in Conakry. Carved from Dimba wood with a goat-skin head, tuned for deep bass and crisp slap.",
    descriptionFr:
      "Djembé artisanal fabriqué par des maîtres artisans à Conakry. Taillé en bois de Dimba avec une peau de chèvre, accordé pour une basse profonde et une gifle nette.",
    price: 420_000,
    category: "Musique",
  },
  {
    id: "plateau-the-fouta-djallon",
    name: "Plateau Thé Fouta Djallon",
    nameFr: "Plateau Thé Fouta Djallon",
    description:
      "Traditional tea ceremony set from the Fouta Djallon highlands. Hand-painted wooden tray, 3 decorative glasses, and a brass teapot.",
    descriptionFr:
      "Service à thé traditionnel des hauts plateaux du Fouta Djallon. Plateau en bois peint à la main, 3 verres décoratifs et une théière en laiton.",
    price: 1_000,
    category: "Art de Vivre",
  },
];
