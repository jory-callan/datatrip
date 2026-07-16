import { useEffect, useRef, useState } from 'react'

import { apiClient } from '@/lib/api-client'
import type { ProjectColumnsResponse } from '@/lib/api/sqlexec'
import type { CompletionTable, CompletionColumn } from '@/components/sql-editor'

/**
 * useCompletionTables — 后台批量拉取当前库所有表的列元数据，
 * 为 SQL 编辑器提供表名 + 列名的自动补全数据。
 *
 * 当 activeDbForTables 变化时，自动发起请求获取所有表的列信息。
 * 分批并发（每批 6 张表），逐批更新结果。
 * 数据通过状态返回，同时缓存到 ref 供 completion provider 同步读取。
 */
export function useCompletionTables(
  tables: { table: string; type?: string }[],
  activeDbForTables: { projectId: string; database: string } | null,
): CompletionTable[] {
  const [completionData, setCompletionData] = useState<CompletionTable[]>([])

  // 保存一份到 ref，供 SqlEditor 的 dataRef 同步引用（provider 回调中读取）
  const cacheRef = useRef<Map<string, CompletionColumn[]>>(new Map())

  useEffect(() => {
    // 清空
    if (!activeDbForTables || tables.length === 0) {
      cacheRef.current = new Map()
      setCompletionData([])
      return
    }

    const { projectId, database } = activeDbForTables
    const tableNames = tables.map((t) => t.table)
    const currentCache = new Map<string, CompletionColumn[]>()

    // 先放空占位（表名已有，列为空）
    setCompletionData(tableNames.map((name) => ({ name, columns: [] })))

    let cancelled = false

    const fetchAll = async () => {
      const BATCH_SIZE = 6

      for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
        const batch = tableNames.slice(i, i + BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map((tbl) =>
            apiClient<ProjectColumnsResponse>(
              `/projects/${projectId}/meta/columns`,
              { query: { database, table: tbl } },
            ),
          ),
        )

        if (cancelled) return

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.columns) {
            currentCache.set(
              batch[idx],
              result.value.columns.map(toCompletionColumn),
            )
          }
        })

        // 逐批更新
        cacheRef.current = new Map(currentCache)
        setCompletionData(
          tableNames.map((name) => ({
            name,
            columns: currentCache.get(name) ?? [],
          })),
        )
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [
    activeDbForTables?.projectId,
    activeDbForTables?.database,
    tables.length,
  ])

  return completionData
}

/** 将服务端 ColumnInfoData 转为前端 CompletionColumn */
function toCompletionColumn(
  col: import('@/lib/api/sqlexec').ColumnInfoData,
): CompletionColumn {
  // 组装类型串: "VARCHAR(255)  NOT NULL"
  let typeStr = col.database_type ?? ''
  if (col.length != null) {
    typeStr += `(${col.length})`
  } else if (col.precision != null) {
    typeStr += col.scale != null ? `(${col.precision},${col.scale})` : `(${col.precision})`
  }

  return {
    name: col.name,
    type: typeStr,
    nullable: col.nullable,
    comment: col.comment,
  }
}
