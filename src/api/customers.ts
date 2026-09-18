import { apiFetch } from './client';
import { Customer } from '../types';

interface ApiCollection<T> {
  data: T[];
}

/** Cari pelanggan/member berdasarkan nama atau nomor telepon (maks. 5 hasil). */
export async function searchCustomers(search: string): Promise<Customer[]> {
  const query = new URLSearchParams({ search });
  const result = await apiFetch<ApiCollection<Customer>>(`/customers?${query.toString()}`);

  return result.data;
}
