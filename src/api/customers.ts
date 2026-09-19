import { apiFetch } from './client';
import { Customer } from '../types';

interface ApiCollection<T> {
  data: T[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
  };
}

export interface CustomerListPage {
  data: Customer[];
  currentPage: number;
  lastPage: number;
}

export interface CustomerPayload {
  name: string;
  phone: string;
  address?: string;
  /** Format `YYYY-MM-DD`. */
  birthdate?: string;
  notes?: string;
}

/** Cari pelanggan/member berdasarkan nama atau nomor telepon (maks. 5 hasil) - dipakai di keranjang kasir. */
export async function searchCustomers(search: string): Promise<Customer[]> {
  const query = new URLSearchParams({ search });
  const result = await apiFetch<ApiCollection<Customer>>(`/customers/search?${query.toString()}`);

  return result.data;
}

/** Daftar pelanggan (dipaginasi) untuk layar "Pelanggan" - meniru Livewire\Customers\Index. */
export async function listCustomers(
  params: { search?: string; page?: number } = {},
): Promise<CustomerListPage> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));

  const queryString = query.toString();
  const path = queryString ? `/customers?${queryString}` : '/customers';

  const result = await apiFetch<PaginatedResponse<Customer>>(path);

  return {
    data: result.data,
    currentPage: result.meta.current_page,
    lastPage: result.meta.last_page,
  };
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const result = await apiFetch<{ data: Customer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.data;
}

export async function updateCustomer(id: number, payload: CustomerPayload): Promise<Customer> {
  const result = await apiFetch<{ data: Customer }>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return result.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiFetch(`/customers/${id}`, { method: 'DELETE' });
}
