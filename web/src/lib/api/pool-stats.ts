import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../api-client'

export interface PoolStats {
  datasource_id: string
  active: number
  idle: number
  wait_count: number
  wait_duration: string
  last_used_time: string
  is_connected: boolean
}

export const usePoolStats = (datasourceId: string) => {
  return useQuery({
    queryKey: ['pool-stats', datasourceId],
    queryFn: () => apiClient<PoolStats>(`/pool-stats/${datasourceId}`),
    enabled: !!datasourceId,
    refetchInterval: 30_000,
  })
}

export const useAllPoolStats = () => {
  return useQuery({
    queryKey: ['pool-stats-all'],
    queryFn: () => apiClient<PoolStats[]>('/pool-stats'),
    refetchInterval: 30_000,
  })
}
