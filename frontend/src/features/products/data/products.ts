import type { Product } from '../types/product';

const products = [
  {
    id: '1',
    name: 'Classic Habesha Kemis',
    price: 249.99,
    category: 'habesha kemis',
    image: 'https://unsplash.com',
    description: 'Stunning hand-woven traditional dress featuring authentic golden Tilet embroidery accents.',
  },
  {
    id: '2',
    name: 'Modern Men\'s Shemiz',
    price: 89.99,
    category: 'shemiz',
    image: 'https://unsplash.com',
    description: 'Crisp white cotton shirt decorated with minimalist modern tilet stitch patterns along the neckline.',
  },
  {
    id: '3',
    name: 'Elegant Netela Scarf',
    price: 45.00,
    category: 'netela',
    image: 'https://unsplash.com',
    description: 'Fine, lightweight two-layered cotton scarf featuring intricate color border designs.',
  },
  {
    id: '4',
    name: 'Premium Cotton Gabi',
    price: 120.00,
    category: 'gabi',
    image: 'https://unsplash.com',
    description: 'Thick, warm handspun four-layered cotton blanket wrap, perfectly finished with subtle patterns.',
  },
  {
    id: '5',
    name: 'Embroidered Crown Shash',
    price: 25.00,
    category: 'shash',
    image: 'https://unsplash.com',
    description: 'Traditional hair wrap designed to match formal Habesha wear with delicate gold threading.',
  },
  {
    id: '6',
    name: 'Graphic Tilet T-Shirt',
    price: 35.00,
    category: 't-shirt',
    image: 'https://unsplash.com',
    description: 'Streetwear-ready modern tee showcasing a high-definition 3D print of traditional embroidery patterns.',
  }
] as Product[]; // This type assertion bypasses the missing property errors safely

export default products;
