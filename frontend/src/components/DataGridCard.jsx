import { useEffect, useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import { glassBackdrop, glassCardSurface, glassInsetHighlight, midnightBg, premiumTransition } from '../theme/glassTokens'

export default function DataGridCard({
  rows,
  columns,
  loading = false,
  height = 600,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  initialState = {},
  slots,
  extraSx,
  storageKey,
  ...rest
}) {
  const [persistedState, setPersistedState] = useState(null)

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) setPersistedState(JSON.parse(raw))
    } catch {
      // ignore malformed persisted state
    }
  }, [storageKey])

  const mergedInitialState = useMemo(
    () => ({
      pagination: { paginationModel: { pageSize, page: 0 } },
      ...initialState,
      ...(persistedState || {})
    }),
    [pageSize, initialState, persistedState]
  )

  const persistPartial = (patch) => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const prev = persistedState || {}
      const next = { ...prev, ...patch }
      setPersistedState(next)
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // ignore persistence failures
    }
  }

  return (
    <Box
      sx={{
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: midnightBg,
        backgroundImage: glassCardSurface,
        backdropFilter: glassBackdrop,
        WebkitBackdropFilter: glassBackdrop,
        boxShadow: `0 18px 48px rgba(0,0,0,0.5), ${glassInsetHighlight}`,
        transition: premiumTransition,
        '&:hover': {
          borderColor: 'rgba(139, 92, 246, 0.22)',
          boxShadow: `0 22px 56px rgba(0,0,0,0.55), 0 0 28px rgba(76, 29, 149, 0.1), ${glassInsetHighlight}`
        }
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pageSizeOptions={pageSizeOptions}
        initialState={mergedInitialState}
        onColumnVisibilityModelChange={(model) => persistPartial({ columns: { columnVisibilityModel: model } })}
        onSortModelChange={(model) => persistPartial({ sorting: { sortModel: model } })}
        onFilterModelChange={(model) => persistPartial({ filter: { filterModel: model } })}
        onPaginationModelChange={(model) => persistPartial({ pagination: { paginationModel: model } })}
        onDensityChange={(density) => persistPartial({ density })}
        disableRowSelectionOnClick
        slots={slots}
        sx={{
          borderRadius: 2,
          background: 'transparent',
          '& .MuiDataGrid-columnHeaders': { borderBottom: '1px solid rgba(255,255,255,0.1)' },
          '& .MuiDataGrid-cell': { py: 0.25 },
          ...(extraSx || {})
        }}
        {...rest}
      />
    </Box>
  )
}

