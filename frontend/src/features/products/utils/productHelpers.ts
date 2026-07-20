import { Product } from "../types";

/*
|--------------------------------------------------------------------------
| Category Mapping
|--------------------------------------------------------------------------
*/

const categoryNameMap: Record<string, string> = {
  "Habesha Kemis": "Kemis",
  "Scarf": "Scarf",
  "Men Traditional Wear": "Shemiz",
  "Men Wear": "Shemiz",
  "Netela": "Netela",
  "Suri": "Suri",
  "Shash": "Shash",
  "Family": "Family",
  "Gabi": "Gabi",
  "Couple": "Couple",
  "Wedding": "Wedding",
  "Children": "Children",
  "Accessories": "Accessories",
};

/*
|--------------------------------------------------------------------------
| Canonical Category Order
|--------------------------------------------------------------------------
*/

export const CATEGORY_ORDER = [
  "Kemis",
  "Scarf",
  "Shemiz",
  "Netela",
  "Suri",
  "Shash",
  "Family",
  "Gabi",
  "Couple",
  "Wedding",
  "Children",
  "Accessories",
  "All",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

export const simplifyCategoryName = (name: string): string =>
  categoryNameMap[name] || name;

export const groupProductsByCategory = (
  products: Product[]
): Record<string, Product[]> => {
  return products.reduce((groups, product) => {
    const category = simplifyCategoryName(product.category_name);

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(product);

    return groups;
  }, {} as Record<string, Product[]>);
};

export const extractUniqueCategories = (
  products: Product[]
): string[] => {
  const existingCategories = new Set(
    products.map((p) => simplifyCategoryName(p.category_name))
  );

  const ordered = CATEGORY_ORDER.filter(
    (category) =>
      category === "All" || existingCategories.has(category)
  );

  return ordered;
};