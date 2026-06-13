export type Gender = 'male' | 'female' | 'unisex';

export type Category =
  | 'kemis'
  | 'suri'
  | 'shemiz'
  | 'shurab'
  | 'kumta'
  | 't-shirt'
  | 'shash'
  | 'sharb'
  | 'scurve'
  | 'dress';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  fabric?: string;
  image: string | undefined;
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice?: number;
  gender: Gender;
  category: Category;
  colors: ProductColor[];
  sizes: string[];
  images: string[];
  modelUrl?: string; // future 3D model
  badge?: string; // e.g. "New", "Limited"
  featured: boolean;
  tags: string[];
  material: string;
  origin: string;
}
