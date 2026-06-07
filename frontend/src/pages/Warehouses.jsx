import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { GridToolbar } from '@mui/x-data-grid'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material'

import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import RowActions from '../components/RowActions'
import DataGridCard from '../components/DataGridCard'
import KpiStrip from '../components/KpiStrip'
import { Item, Stagger } from '../components/Reveal'
import { createWarehouse, deleteWarehouse, listWarehouses, updateWarehouse } from '../api'
import { getGridFieldValue, nvl } from '../utils/format'
import { downloadCsv } from '../utils/exportCsv'

const empty = { name: '', address: '', region: '', capacityUnits: '' }

export default function Warehouses() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [selection, setSelection] = useState([])

  const q = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses
  })

  const createMut = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      enqueueSnackbar('Склад створено', { variant: 'success' })
      q.refetch()
      setOpen(false)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => updateWarehouse(id, body),
    onSuccess: () => {
      enqueueSnackbar('Зміни збережено', { variant: 'success' })
      q.refetch()
      setOpen(false)
      setEditingId(null)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const deleteMut = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      enqueueSnackbar('Склад видалено', { variant: 'success' })
      q.refetch()
      setConfirmId(null)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const rows = q.data || []
  const [search, setSearch] = useState('')
  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => [r.name, r.region, r.address].filter(Boolean).join(' ').toLowerCase().includes(s))
  }, [rows, search])
  const kpis = useMemo(() => {
    const total = rows.length
    const withRegion = rows.filter((x) => x.region).length
    const avgCap = rows.filter((x) => Number.isFinite(x.capacityUnits)).reduce((s, x, _i, arr) => s + Number(x.capacityUnits || 0) / Math.max(arr.length, 1), 0)
    const maxCap = rows.reduce((m, x) => Math.max(m, Number(x.capacityUnits || 0)), 0)
    return [
      { label: 'Складів', value: total },
      { label: 'З регіоном', value: withRegion },
      { label: 'Сер. місткість', value: Math.round(avgCap) },
      { label: 'Макс. місткість', value: maxCap }
    ]
  }, [rows])

  const columns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'name', headerName: 'Назва', flex: 1, minWidth: 180 },
      {
        field: 'region',
        headerName: 'Регіон',
        flex: 0.7,
        minWidth: 140,
        valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'region'))
      },
      {
        field: 'address',
        headerName: 'Адреса',
        flex: 1,
        minWidth: 200,
        valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'address'))
      },
      {
        field: 'capacityUnits',
        headerName: 'Місткість',
        width: 140,
        valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'capacityUnits'))
      },
      {
        field: 'actions',
        headerName: '',
        sortable: false,
        filterable: false,
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => (
          <RowActions
            actions={[
              {
                key: 'edit',
                title: 'Змінити',
                icon: <EditIcon fontSize="small" />,
                onClick: () => {
                  const w = params.row
                  setEditingId(w.id)
                  setForm({
                    name: w.name || '',
                    address: w.address || '',
                    region: w.region || '',
                    capacityUnits: w.capacityUnits ?? ''
                  })
                  setOpen(true)
                }
              },
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

  const onSubmit = () => {
    const body = {
      name: form.name.trim(),
      address: form.address?.trim() ? form.address.trim() : null,
      region: form.region?.trim() ? form.region.trim() : null,
      capacityUnits: form.capacityUnits === '' ? null : Number(form.capacityUnits)
    }
    if (editingId) updateMut.mutate({ id: editingId, body })
    else createMut.mutate(body)
  }

  const onBulkDelete = async () => {
    const ids = [...selection]
    if (!ids.length) return
    const results = await Promise.allSettled(ids.map((id) => deleteWarehouse(id)))
    const ok = results.filter((r) => r.status === 'fulfilled').length
    const fail = results.length - ok
    enqueueSnackbar(`Масове видалення складів: успішно ${ok}, помилок ${fail}`, { variant: fail ? 'warning' : 'success' })
    setBulkConfirmOpen(false)
    setSelection([])
    q.refetch()
  }
  const exportWarehouses = () => {
    downloadCsv(
      'warehouses_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Назва', get: (r) => r.name },
        { label: 'Регіон', get: (r) => r.region || '' },
        { label: 'Адреса', get: (r) => r.address || '' },
        { label: 'Місткість', get: (r) => r.capacityUnits ?? '' }
      ],
      filteredRows
    )
  }
  const exportSelectedWarehouses = () => {
    const selectedSet = new Set(selection.map(String))
    const selectedRows = filteredRows.filter((r) => selectedSet.has(String(r.id)))
    if (!selectedRows.length) {
      enqueueSnackbar('Немає вибраних рядків для експорту', { variant: 'info' })
      return
    }
    downloadCsv(
      'warehouses_selected_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Назва', get: (r) => r.name },
        { label: 'Регіон', get: (r) => r.region || '' },
        { label: 'Адреса', get: (r) => r.address || '' },
        { label: 'Місткість', get: (r) => r.capacityUnits ?? '' }
      ],
      selectedRows
    )
  }
  const resetGridView = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('hl-grid-warehouses')
    enqueueSnackbar('Налаштування таблиці скинуто. Оновіть сторінку для повного reset.', { variant: 'info' })
  }

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Склади"
            subtitle="Довідник складів: адреси, регіони, місткість."
            actions={[
              {
                key: 'bulk-delete',
                label: `Видалити вибрані (${selection.length})`,
                color: 'error',
                variant: 'outlined',
                disabled: selection.length === 0,
                onClick: () => setBulkConfirmOpen(true)
              },
              { key: 'export', label: 'Експорт CSV', variant: 'outlined', onClick: exportWarehouses },
              {
                key: 'export-selected',
                label: `Експорт вибраних (${selection.length})`,
                variant: 'outlined',
                disabled: selection.length === 0,
                onClick: exportSelectedWarehouses
              },
              { key: 'reset-view', label: 'Скинути вигляд таблиці', variant: 'text', onClick: resetGridView },
              {
                key: 'add',
                label: 'Додати склад',
                icon: <AddIcon />,
                variant: 'contained',
                onClick: () => {
                  setEditingId(null)
                  setForm(empty)
                  setOpen(true)
                }
              }
            ]}
          />
        </Item>

        <Item>
          <KpiStrip items={kpis} />
        </Item>

        <Item>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1 }}>
            <TextField label="Пошук по назві / регіону / адресі" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
          </Stack>
        </Item>

        <Item>
          <DataGridCard
            height={560}
              rows={filteredRows}
              columns={columns}
              loading={q.isLoading}
              checkboxSelection
              rowSelectionModel={selection}
              onRowSelectionModelChange={(m) => setSelection(Array.isArray(m) ? m : [])}
              storageKey="hl-grid-warehouses"
              slots={{ toolbar: GridToolbar }}
            />
        </Item>
      </Stagger>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? 'Редагування складу' : 'Новий склад'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Назва *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Адреса"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth
            />
            <TextField
              label="Регіон"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              fullWidth
            />
            <TextField
              label="Місткість (од.)"
              type="number"
              inputProps={{ min: 0 }}
              value={form.capacityUnits}
              onChange={(e) => setForm({ ...form, capacityUnits: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!form.name.trim()}>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Видалити вибрані склади?"
        description={`Буде видалено записів: ${selection.length}. Якщо є пов’язані операції — частина записів може бути пропущена сервером.`}
        confirmText="Видалити вибрані"
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={onBulkDelete}
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Видалити склад?"
        description="Дія незворотна. Якщо є пов’язані транзакції/залишки — сервер заборонить видалення."
        confirmText="Видалити"
        onClose={() => setConfirmId(null)}
        onConfirm={() => deleteMut.mutate(confirmId)}
      />
    </Box>
  )
}
