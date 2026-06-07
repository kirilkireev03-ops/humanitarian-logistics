import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { GridToolbar } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import RowActions from '../components/RowActions'
import DataGridCard from '../components/DataGridCard'
import KpiStrip from '../components/KpiStrip'
import { Item, Stagger } from '../components/Reveal'
import { formatDateTimeSafe, getGridFieldValue, nvl } from '../utils/format'
import { createTransaction, deleteTransaction, listCargo, listTransactions, listWarehouses } from '../api'
import { downloadCsv } from '../utils/exportCsv'

const TYPES = ['INBOUND', 'OUTBOUND', 'TRANSFER']

const empty = {
  type: 'INBOUND',
  fromWarehouseId: '',
  toWarehouseId: '',
  cargoId: '',
  quantity: '',
  notes: ''
}

function TypeChip({ value }) {
  const map = {
    INBOUND: { label: 'INBOUND', color: 'success' },
    OUTBOUND: { label: 'OUTBOUND', color: 'warning' },
    TRANSFER: { label: 'TRANSFER', color: 'info' }
  }
  const t = map[value] || { label: value, color: 'default' }
  return <Chip size="small" label={t.label} color={t.color} variant="outlined" />
}

export default function Transactions() {
  const FILTERS_KEY = 'hl-filters-transactions'
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(FILTERS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.typeFilter) setTypeFilter(parsed.typeFilter)
    } catch {
      // ignore malformed state
    }
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify({ typeFilter }))
  }, [typeFilter])

  const tq = useQuery({ queryKey: ['transactions'], queryFn: listTransactions })
  const wq = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses })
  const cq = useQuery({ queryKey: ['cargo'], queryFn: listCargo })

  const createMut = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      enqueueSnackbar('Транзакцію зафіксовано', { variant: 'success' })
      tq.refetch()
      qc.invalidateQueries({ queryKey: ['stock'] })
      setOpen(false)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const deleteMut = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      enqueueSnackbar('Транзакцію видалено (залишки скориговано)', { variant: 'success' })
      tq.refetch()
      qc.invalidateQueries({ queryKey: ['stock'] })
      setConfirmId(null)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const rows = tq.data || []
  const filteredRows = useMemo(() => {
    if (typeFilter === 'ALL') return rows
    return rows.filter((r) => r.type === typeFilter)
  }, [rows, typeFilter])
  const kpis = useMemo(
    () => [
      { label: 'Операцій', value: rows.length },
      { label: 'INBOUND', value: rows.filter((r) => r.type === 'INBOUND').length, tone: 'success' },
      { label: 'OUTBOUND', value: rows.filter((r) => r.type === 'OUTBOUND').length, tone: 'warning' },
      { label: 'TRANSFER', value: rows.filter((r) => r.type === 'TRANSFER').length, tone: 'info' }
    ],
    [rows]
  )
  const warehouses = wq.data || []
  const cargo = cq.data || []

  const columns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'type', headerName: 'Тип', width: 140, renderCell: (p) => <TypeChip value={p.value} /> },
      { field: 'fromWarehouseName', headerName: 'Від', flex: 1, minWidth: 160, valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'fromWarehouseName')) },
      { field: 'toWarehouseName', headerName: 'До', flex: 1, minWidth: 160, valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'toWarehouseName')) },
      { field: 'cargoName', headerName: 'Вантаж', flex: 1, minWidth: 170 },
      { field: 'quantity', headerName: 'К-сть', width: 110 },
      {
        field: 'occurredAt',
        headerName: 'Час',
        width: 190,
        valueGetter: (value, row) => formatDateTimeSafe(getGridFieldValue(value, row, 'occurredAt'))
      },
      {
        field: 'actions',
        headerName: '',
        sortable: false,
        filterable: false,
        width: 70,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => (
          <RowActions
            actions={[
              {
                key: 'delete',
                title: 'Видалити',
                color: 'error',
                icon: <DeleteIcon fontSize="small" />,
                onClick: () => setConfirmId(params.row.id)
              }
            ]}
          />
        )
      }
    ],
    []
  )

  const type = form.type
  const needFrom = type === 'OUTBOUND' || type === 'TRANSFER'
  const needTo = type === 'INBOUND' || type === 'TRANSFER'
  const invalidTransfer = type === 'TRANSFER' && form.fromWarehouseId && form.toWarehouseId && form.fromWarehouseId === form.toWarehouseId
  const valid =
    form.cargoId &&
    Number(form.quantity || 0) > 0 &&
    (!needFrom || form.fromWarehouseId) &&
    (!needTo || form.toWarehouseId) &&
    !invalidTransfer

  const onSubmit = () => {
    const body = {
      type: form.type,
      fromWarehouseId: form.fromWarehouseId === '' ? null : Number(form.fromWarehouseId),
      toWarehouseId: form.toWarehouseId === '' ? null : Number(form.toWarehouseId),
      cargoId: Number(form.cargoId),
      quantity: Number(form.quantity),
      notes: form.notes?.trim() ? form.notes.trim() : null,
      relatedRequestId: null
    }
    createMut.mutate(body)
  }

  const loading = tq.isLoading || wq.isLoading || cq.isLoading
  const exportTransactions = () => {
    downloadCsv(
      'transactions_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Тип', get: (r) => r.type },
        { label: 'Від', get: (r) => r.fromWarehouseName || '' },
        { label: 'До', get: (r) => r.toWarehouseName || '' },
        { label: 'Вантаж', get: (r) => r.cargoName || '' },
        { label: 'Кількість', get: (r) => r.quantity },
        { label: 'Час', get: (r) => formatDateTimeSafe(r.occurredAt) }
      ],
      filteredRows
    )
  }
  const resetGridView = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('hl-grid-transactions')
    enqueueSnackbar('Налаштування таблиці скинуто. Оновіть сторінку для повного reset.', { variant: 'info' })
  }

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Транзакції"
            subtitle="Надходження — прийом на склад (потрібен склад-отримувач). Відпуск — відвантаження зі складу (склад-відправник). Переміщення — передача між двома складами."
            actions={[
              {
                key: 'add',
                label: 'Нова транзакція',
                icon: <AddIcon />,
                variant: 'contained',
                onClick: () => {
                  setForm(empty)
                  setOpen(true)
                }
              },
              {
                key: 'export',
                label: 'Експорт CSV',
                variant: 'outlined',
                onClick: exportTransactions
              },
              {
                key: 'reset-view',
                label: 'Скинути вигляд таблиці',
                variant: 'text',
                onClick: resetGridView
              }
            ]}
          />
        </Item>

        <Item>
          <KpiStrip items={kpis} />
        </Item>

        <Item>
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={typeFilter}
            onChange={(_e, v) => v && setTypeFilter(v)}
            sx={{ mb: 1 }}
          >
            <ToggleButton value="ALL">Усі</ToggleButton>
            <ToggleButton value="INBOUND">INBOUND</ToggleButton>
            <ToggleButton value="OUTBOUND">OUTBOUND</ToggleButton>
            <ToggleButton value="TRANSFER">TRANSFER</ToggleButton>
          </ToggleButtonGroup>
        </Item>

        <Item>
          <DataGridCard
            height={620}
              rows={filteredRows}
              columns={columns}
              loading={loading}
              storageKey="hl-grid-transactions"
              initialState={{
                sorting: { sortModel: [{ field: 'id', sort: 'desc' }] }
              }}
              slots={{ toolbar: GridToolbar }}
            />
        </Item>
      </Stagger>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon /> Нова транзакція
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Тип *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} fullWidth>
              {TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Склад відправник"
              value={form.fromWarehouseId}
              onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
              fullWidth
              disabled={!needFrom}
              helperText={needFrom ? 'Обовʼязково для OUTBOUND/TRANSFER' : 'Не потрібно для INBOUND'}
            >
              <MenuItem value="">—</MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={String(w.id)}>
                  {w.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Склад отримувач"
              value={form.toWarehouseId}
              onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
              fullWidth
              disabled={!needTo}
              error={Boolean(invalidTransfer)}
              helperText={
                invalidTransfer
                  ? 'Для TRANSFER склади мають відрізнятися'
                  : needTo
                    ? 'Обовʼязково для INBOUND/TRANSFER'
                    : 'Не потрібно для OUTBOUND'
              }
            >
              <MenuItem value="">—</MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={String(w.id)}>
                  {w.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Вантаж *"
              value={form.cargoId}
              onChange={(e) => setForm({ ...form, cargoId: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Оберіть</MenuItem>
              {cargo.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Кількість *"
              type="number"
              inputProps={{ min: 1 }}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              fullWidth
            />

            <TextField
              label="Примітки"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />

            <Typography variant="caption" color="text.secondary">
              Порада: OUTBOUND перевіряє залишки складу. TRANSFER спишеться з “Від” і додасться до “До”.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!valid}>
            Зафіксувати
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="Видалити транзакцію?"
        description="Залишки буде скориговано зворотною операцією. Використовуйте лише якщо транзакцію внесено помилково."
        confirmText="Видалити"
        onClose={() => setConfirmId(null)}
        onConfirm={() => deleteMut.mutate(confirmId)}
      />
    </Box>
  )
}
