import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GridToolbar } from '@mui/x-data-grid'
import { Box, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'

import PageHeader from '../components/PageHeader'
import DataGridCard from '../components/DataGridCard'
import KpiStrip from '../components/KpiStrip'
import { Item, Stagger } from '../components/Reveal'
import { listStock } from '../api'
import { getGridFieldValue, nvl } from '../utils/format'
import { downloadCsv } from '../utils/exportCsv'

export default function Stock() {
  const FILTERS_KEY = 'hl-filters-stock'
  const [warehouse, setWarehouse] = useState('')
  const [cargo, setCargo] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(FILTERS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (typeof parsed.warehouse === 'string') setWarehouse(parsed.warehouse)
      if (typeof parsed.cargo === 'string') setCargo(parsed.cargo)
      if (typeof parsed.onlyLow === 'boolean') setOnlyLow(parsed.onlyLow)
    } catch {
      // ignore malformed state
    }
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify({ warehouse, cargo, onlyLow }))
  }, [warehouse, cargo, onlyLow])

  const q = useQuery({ queryKey: ['stock'], queryFn: listStock })

  const rowsAll = q.data || []

  const warehouses = useMemo(() => {
    const map = new Map()
    for (const r of rowsAll) map.set(r.warehouseId, r.warehouseName)
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [rowsAll])

  const cargoList = useMemo(() => {
    const map = new Map()
    for (const r of rowsAll) map.set(r.cargoId, r.cargoName)
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [rowsAll])

  const rows = useMemo(() => {
    const threshold = rowsAll.length
      ? rowsAll.reduce((s, r) => s + Number(r.quantityOnHand || 0), 0) / rowsAll.length / 3
      : 0
    return rowsAll.filter((r) => {
      if (warehouse && String(r.warehouseId) !== String(warehouse)) return false
      if (cargo && String(r.cargoId) !== String(cargo)) return false
      if (onlyLow && Number(r.quantityOnHand || 0) > threshold) return false
      return true
    })
  }, [rowsAll, warehouse, cargo, onlyLow])
  const kpis = useMemo(() => {
    const totalUnits = rowsAll.reduce((s, r) => s + Number(r.quantityOnHand || 0), 0)
    const lowCount = rowsAll.length
      ? rowsAll.filter((r) => Number(r.quantityOnHand || 0) <= totalUnits / rowsAll.length / 3).length
      : 0
    return [
      { label: 'Позицій', value: rowsAll.length },
      { label: 'Одиниць всього', value: totalUnits.toLocaleString('uk-UA') },
      { label: 'Складів у зрізі', value: warehouses.length },
      { label: 'Низьких позицій', value: lowCount }
    ]
  }, [rowsAll, warehouses.length])
  const exportStock = () => {
    downloadCsv(
      'stock_export.csv',
      [
        { label: 'Склад', get: (r) => r.warehouseName },
        { label: 'Вантаж', get: (r) => r.cargoName },
        { label: 'Кількість', get: (r) => r.quantityOnHand }
      ],
      rows
    )
  }
  const resetGridView = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('hl-grid-stock')
    if (typeof window !== 'undefined') window.localStorage.removeItem(FILTERS_KEY)
  }

  const columns = useMemo(
    () => [
      { field: 'warehouseName', headerName: 'Склад', flex: 1, minWidth: 200 },
      { field: 'cargoName', headerName: 'Вантаж', flex: 1, minWidth: 200 },
      { field: 'quantityOnHand', headerName: 'Кількість', width: 140, valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'quantityOnHand'), 0) }
    ],
    []
  )

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Залишки"
            subtitle="Актуальні залишки по складах. Дані оновлюються після транзакцій та виконання заявок."
            actions={[
              { key: 'export', label: 'Експорт CSV', variant: 'outlined', onClick: exportStock },
              { key: 'reset-view', label: 'Скинути вигляд таблиці', variant: 'text', onClick: resetGridView }
            ]}
          />
        </Item>

        <Item>
          <KpiStrip items={kpis} />
        </Item>

        <Item>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              label="Склад"
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Усі</MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={String(w.id)}>
                  {w.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Вантаж"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Усі</MenuItem>
              {cargoList.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Тільки низькі
              </Typography>
              <Switch checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
            </Stack>
          </Stack>
        </Item>

        <Item>
          <DataGridCard
            height={620}
              rows={rows}
              columns={columns}
              loading={q.isLoading}
              storageKey="hl-grid-stock"
              initialState={{
                sorting: { sortModel: [{ field: 'quantityOnHand', sort: 'desc' }] }
              }}
              slots={{ toolbar: GridToolbar }}
            />
        </Item>
      </Stagger>
    </Box>
  )
}
