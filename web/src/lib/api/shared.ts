import { apiClient } from '../api-client'

export async function fetchAPI<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint)
}
