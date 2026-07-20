import apiClient from '@/shared/api/apiClient';
import { 
  Product, 
  ToggleLikePayload, 
  AddCommentPayload, 
  ShareProductPayload,
  ProductCommentDTO,
} from '../types';

export const productApi = {
  // GET /api/products/
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products/');
    return response.data;
  },

  // GET /api/products/:id/ - for the detail page
  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}/`);
    return response.data;
  },

  // GET /api/products/:id/comments/ - fetch all comments for a product
  getComments: async (productId: string): Promise<ProductCommentDTO[]> => {
    const response = await apiClient.get<ProductCommentDTO[]>(`/products/${productId}/comments/`);
    return response.data;
  },

  // POST /api/products/like/
  toggleLike: async (payload: ToggleLikePayload) => {
    const response = await apiClient.post('/products/like/', payload);
    return response.data;
  },

  // POST /api/products/comment/
  addComment: async (payload: AddCommentPayload) => {
    const response = await apiClient.post('/products/comment/', payload);
    return response.data;
  },

  // POST /api/products/share/
  shareProduct: async (payload: ShareProductPayload) => {
    const response = await apiClient.post('/products/share/', payload);
    return response.data;
  }
};