import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { GridToolbar } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import RowActions from '../components/RowActions'
import DataGridCard from '../components/DataGridCard'
import KpiStrip from '../components/KpiStrip'
import { Item, Stagger } from '../components/Reveal'
import { createCargo, deleteCargo, listCargo, updateCargo } from '../api'
import { getGridFieldValue, nvl } from '../utils/format'
import { downloadCsv } from '../utils/exportCsv'

const empty = { name: '', description: '', unit: 'ящ', category: '' }

export default function CargoPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [selection, setSelection] = useState([])

  const q = useQuery({
    queryKey: ['cargo'],
    queryFn: listCargo
  })

  const createMut = useMutation({
    mutationFn: createCargo,
    onSuccess: () => {
      enqueueSnackbar('Вантаж створено', { variant: 'success' })
      q.refetch()
      setOpen(false)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => updateCargo(id, body),
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
    mutationFn: deleteCargo,
    onSuccess: () => {
      enqueueSnackbar('Вантаж видалено', { variant: 'success' })
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
    return rows.filter((r) => [r.name, r.category, r.unit, r.description].filter(Boolean).join(' ').toLowerCase().includes(s))
  }, [rows, search])
  const kpis = useMemo(() => {
    const categories = new Set(rows.map((r) => r.category).filter(Boolean)).size
    const units = new Set(rows.map((r) => r.unit).filter(Boolean)).size
    return [
      { label: 'Типів вантажу', value: rows.length },
      { label: 'Категорій', value: categories },
      { label: 'Одиниць виміру', value: units },
      { label: 'З описом', value: rows.filter((r) => r.description).length }
    ]
  }, [rows])

  const columns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'name', headerName: 'Назва', flex: 1, minWidth: 180 },
      { field: 'category', headerName: 'Категорія', flex: 0.7, minWidth: 140, valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'category')) },
      { field: 'unit', headerName: 'Одиниця', width: 120 },
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
                  const c = params.row
                  setEditingId(c.id)
                  setForm({
                    name: c.name || '',
                    description: c.description || '',
                    unit: c.unit || '',
                    category: c.category || ''
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
      description: form.description?.trim() ? form.description.trim() : null,
      unit: form.unit.trim(),
      category: form.category?.trim() ? form.category.trim() : null
    }
    if (editingId) updateMut.mutate({ id: editingId, body })
    else createMut.mutate(body)
  }

  const onBulkDelete = async () => {
    const ids = [...selection]
    if (!ids.length) return
    const results = await Promise.allSettled(ids.map((id) => deleteCargo(id)))
    const ok = results.filter((r) => r.status === 'fulfilled').length
    const fail = results.length - ok
    enqueueSnackbar(`Масове видалення вантажів: успішно ${ok}, помилок ${fail}`, { variant: fail ? 'warning' : 'success' })
    setBulkConfirmOpen(false)
    setSelection([])
    q.refetch()
  }
  const exportCargo = () => {
    downloadCsv(
      'cargo_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Назва', get: (r) => r.name },
        { label: 'Категорія', get: (r) => r.category || '' },
        { label: 'Одиниця', get: (r) => r.unit || '' },
        { label: 'Опис', get: (r) => r.description || '' }
      ],
      filteredRows
    )
  }
  const exportSelectedCargo = () => {
    const selectedSet = new Set(selection.map(String))
    const selectedRows = filteredRows.filter((r) => selectedSet.has(String(r.id)))
    if (!selectedRows.length) {
      enqueueSnackbar('Немає вибраних рядків для експорту', { variant: 'info' })
      return
    }
    downloadCsv(
      'cargo_selected_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Назва', get: (r) => r.name },
        { label: 'Категорія', get: (r) => r.category || '' },
        { label: 'Одиниця', get: (r) => r.unit || '' },
        { label: 'Опис', get: (r) => r.description || '' }
      ],
      selectedRows
    )
  }
  const resetGridView = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('hl-grid-cargo')
    enqueueSnackbar('Налаштування таблиці скинуто. Оновіть сторінку для повного reset.', { variant: 'info' })
  }

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Вантажі"
            subtitle="Довідник типів вантажу: назва, категорія, одиниця виміру."
            actions={[
              {
                key: 'bulk-delete',
                label: `Видалити вибрані (${selection.length})`,
                color: 'error',
                variant: 'outlined',
                disabled: selection.length === 0,
                onClick: () => setBulkConfirmOpen(true)
              },
              { key: 'export', label: 'Експорт CSV', variant: 'outlined', onClick: exportCargo },
              {
                key: 'export-selected',
                label: `Експорт вибраних (${selection.length})`,
                variant: 'outlined',
                disabled: selection.length === 0,
                onClick: exportSelectedCargo
              },
              { key: 'reset-view', label: 'Скинути вигляд таблиці', variant: 'text', onClick: resetGridView },
              {
                key: 'add',
                label: 'Додати вантаж',
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
          <TextField label="Пошук вантажу" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth sx={{ mb: 1 }} />
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
              storageKey="hl-grid-cargo"
              slots={{ toolbar: GridToolbar }}
            />
        </Item>
      </Stagger>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? 'Редагування вантажу' : 'Новий вантаж'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Назва *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Опис"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Одиниця *"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              fullWidth
            />
            <TextField
              label="Категорія"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!form.name.trim() || !form.unit.trim()}>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Видалити вибрані типи вантажу?"
        description={`Буде видалено записів: ${selection.length}. Частина може бути відхилена через пов’язані транзакції.`}
        confirmText="Видалити вибрані"
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={onBulkDelete}
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Видалити вантаж?"
        description="Дія незворотна. Якщо є пов’язані транзакції/залишки — сервер заборонить видалення."
        confirmText="Видалити"
        onClose={() => setConfirmId(null)}
        onConfirm={() => deleteMut.mutate(confirmId)}
      />
    </Box>
  )
}
