import { apiFetch } from './client';
import { Category, Product } from '../types';

// Laravel API Resource selalu membungkus hasilnya di dalam { "data": [...] },
// baik untuk list biasa maupun yang dipaginate. Type ini merepresentasikan
// bentuk pembungkus itu.
interface ApiCollection<T> {
  data: T[];
}

export async function getCategories(): Promise<Category[]> {
  const result = await apiFetch<ApiCollection<Category>>('/categories');
  return result.data;
}

interface GetProductsParams {
  search?: string;
  categoryId?: number | null;
}

export async function getProducts(params: GetProductsParams = {}): Promise<Product[]> {
  // URLSearchParams membantu menyusun query string ("?search=...&category_id=...")
  // dengan escaping karakter spesial yang benar (spasi, simbol, dll).
  const query = new URLSearchParams();

  if (params.search) {
    query.set('search', params.search);
  }
  if (params.categoryId) {
    query.set('category_id', String(params.categoryId));
  }

  const queryString = query.toString();
  const path = queryString ? `/products?${queryString}` : '/products';

  const result = await apiFetch<ApiCollection<Product>>(path);
  return result.data;
}
