import type { ExampleConfig } from '../types'

import { allFeaturesExample } from './all-features'
import { basicExample } from './basic'
import { bigDataExample } from './big-data'
import { customCellsExample } from './custom-cells'
import { emptyLoadingExample } from './empty-loading'
import { filtersExample } from './filters'
import { paginationExample } from './pagination'
import { rowSelectionExample } from './row-selection'
import { sortingExample } from './sorting'
import { toolbarExample } from './toolbar'

/**
 * Tab 顺序在这里排。每个示例都是独立文件，添加新示例只需：
 *   1. 新建 examples/xxx.tsx，导出 ExampleConfig
 *   2. 在这里 import 并 push 到数组
 */
export const EXAMPLES: ExampleConfig[] = [
  basicExample,
  sortingExample,
  paginationExample,
  rowSelectionExample,
  toolbarExample,
  filtersExample,
  customCellsExample,
  bigDataExample,
  emptyLoadingExample,
  allFeaturesExample,
]
