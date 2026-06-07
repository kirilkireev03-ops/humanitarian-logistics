import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
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
  TextField
} from '@mui/material'
import { GridToolbar } from '@mui/x-data-grid'

import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import DataGridCard from '../components/DataGridCard'
import KpiStrip from '../components/KpiStrip'
import { Item, Stagger } from '../components/Reveal'
import { formatDateTimeSafe, getGridFieldValue, nvl } from '../utils/format'
import {
  approveAidRequest,
  createAidRequest,
  deleteAidRequest,
  fulfillAidRequest,
  rejectAidRequest,
  listAidRequests,
  listCargo,
  listWarehouses,
  updateAidRequest
} from '../api'
import { downloadCsv } from '../utils/exportCsv'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED']

const empty = {
  warehouseId: '',
  cargoId: '',
  quantityRequested: '',
  status: 'PENDING',
  notes: ''
}

function StatusChip({ value }) {
  const map = {
    PENDING: { label: 'PENDING', color: 'warning' },
    APPROVED: { label: 'APPROVED', color: 'info' },
    REJECTED: { label: 'REJECTED', color: 'error' },
    FULFILLED: { label: 'FULFILLED', color: 'success' }
  }
  const s = map[value] || { label: value, color: 'default' }
  return <Chip size="small" label={s.label} color={s.color} variant="outlined" />
}

export default function Requests() {
  const FILTERS_KEY = 'hl-filters-requests'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [confirm, setConfirm] = useState({ type: null, id: null })
  const [statusFilter, setStatusFilter] = useState('ALL')
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(FILTERS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.statusFilter) setStatusFilter(parsed.statusFilter)
    } catch {
      // ignore malformed state
    }
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify({ statusFilter }))
  }, [statusFilter])

  const rq = useQuery({ queryKey: ['requests'], queryFn: listAidRequests })
  const wq = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses })
  const cq = useQuery({ queryKey: ['cargo'], queryFn: listCargo })

  const createMut = useMutation({
    mutationFn: createAidRequest,
    onSuccess: () => {
      enqueueSnackbar('Заявку створено', { variant: 'success' })
      rq.refetch()
      setOpen(false)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => updateAidRequest(id, body),
    onSuccess: () => {
      enqueueSnackbar('Зміни збережено', { variant: 'success' })
      rq.refetch()
      setOpen(false)
      setEditingId(null)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const fulfillMut = useMutation({
    mutationFn: fulfillAidRequest,
    onSuccess: () => {
      enqueueSnackbar('Заявку виконано (OUTBOUND створено)', { variant: 'success' })
      rq.refetch()
      setConfirm({ type: null, id: null })
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const approveMut = useMutation({
    mutationFn: approveAidRequest,
    onSuccess: () => {
      enqueueSnackbar('Заявку схвалено (APPROVED)', { variant: 'success' })
      rq.refetch()
      setConfirm({ type: null, id: null })
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || e.response?.data?.error || e.message, { variant: 'error' })
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => rejectAidRequest(id, reason),
    onSuccess: () => {
      enqueueSnackbar('Заявку відхилено (REJECTED)', { variant: 'success' })
      rq.refetch()
      setConfirm({ type: null, id: null })
      setRejectReason('')
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || e.response?.data?.error || e.message, { variant: 'error' })
  })

  const deleteMut = useMutation({
    mutationFn: deleteAidRequest,
    onSuccess: () => {
      enqueueSnackbar('Заявку видалено', { variant: 'success' })
      rq.refetch()
      setConfirm({ type: null, id: null })
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const rows = rq.data || []
  const filteredRows = useMemo(() => {
    if (statusFilter === 'ALL') return rows
    return rows.filter((r) => r.status === statusFilter)
  }, [rows, statusFilter])
  const kpis = useMemo(
    () => [
      { label: 'Всього заявок', value: rows.length },
      { label: 'Очікує', value: rows.filter((r) => r.status === 'PENDING').length, tone: 'warning' },
      { label: 'Схвалено', value: rows.filter((r) => r.status === 'APPROVED').length, tone: 'info' },
      { label: 'Виконано', value: rows.filter((r) => r.status === 'FULFILLED').length, tone: 'success' }
    ],
    [rows]
  )
  const warehouses = wq.data || []
  const cargo = cq.data || []
  const [rejectReason, setRejectReason] = useState('')

  const columns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'warehouseName', headerName: 'Склад', flex: 1, minWidth: 180 },
      { field: 'cargoName', headerName: 'Вантаж', flex: 1, minWidth: 160 },
      { field: 'quantityRequested', headerName: 'К-сть', width: 110 },
      {
        field: 'status',
        headerName: 'Статус',
        width: 140,
        renderCell: (p) => <StatusChip value={p.value} />
      },
      {
        field: 'createdAt',
        headerName: 'Створено',
        width: 190,
        valueGetter: (value, row) => formatDateTimeSafe(getGridFieldValue(value, row, 'createdAt'))
      },
      {
        field: 'actions',
        headerName: '',
        sortable: false,
        filterable: false,
        width: 220,
        renderCell: (params) => {
          const r = params.row
          const canApprove = r.status === 'PENDING'
          const canReject = r.status !== 'FULFILLED'
          const canFulfill = r.status === 'APPROVED'
          return (
            <Stack direction="row" spacing={0.5} sx={{ py: 0.5 }}>
              <span>
                <IconButton
                  size="small"
                  title="Змінити"
                  aria-label="Змінити"
                  onClick={() => {
                    setEditingId(r.id)
                    setForm({
                      warehouseId: String(r.warehouseId),
                      cargoId: String(r.cargoId),
                      quantityRequested: String(r.quantityRequested),
                      status: r.status,
                      notes: r.notes || ''
                    })
                    setOpen(true)
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>

              <span>
                <IconButton
                  size="small"
                  title="Схвалити (APPROVED)"
                  aria-label="Схвалити"
                  disabled={!canApprove}
                  onClick={() => setConfirm({ type: 'approve', id: r.id })}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </span>

              <span>
                <IconButton
                  size="small"
                  title="Відхилити (REJECTED)"
                  aria-label="Відхилити"
                  disabled={!canReject}
                  onClick={() => {
                    setRejectReason('')
                    setConfirm({ type: 'reject', id: r.id })
                  }}
                  color="warning"
                >
                  <ThumbDownIcon fontSize="small" />
                </IconButton>
              </span>

              <span>
                <IconButton
                  size="small"
                  title="Виконати (FULFILLED)"
                  aria-label="Виконати"
                  disabled={!canFulfill}
                  onClick={() => setConfirm({ type: 'fulfill', id: r.id })}
                  color="success"
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </span>

              <span>
                <IconButton
                  size="small"
                  color="error"
                  title="Видалити"
                  aria-label="Видалити"
                  onClick={() => setConfirm({ type: 'delete', id: r.id })}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Stack>
          )
        }
      }
    ],
    []
  )

  const onSubmit = () => {
    const body = {
      warehouseId: Number(form.warehouseId),
      cargoId: Number(form.cargoId),
      quantityRequested: Number(form.quantityRequested),
      status: form.status,
      notes: form.notes?.trim() ? form.notes.trim() : null
    }
    if (editingId) updateMut.mutate({ id: editingId, body })
    else createMut.mutate(body)
  }

  const loading = rq.isLoading || wq.isLoading || cq.isLoading
  const exportRequests = () => {
    downloadCsv(
      'requests_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Склад', get: (r) => r.warehouseName },
        { label: 'Вантаж', get: (r) => r.cargoName },
        { label: 'Кількість', get: (r) => r.quantityRequested },
        { label: 'Статус', get: (r) => r.status },
        { label: 'Створено', get: (r) => formatDateTimeSafe(r.createdAt) }
      ],
      filteredRows
    )
  }
  const resetGridView = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('hl-grid-requests')
    enqueueSnackbar('Налаштування таблиці скинуто. Оновіть сторінку для повного reset.', { variant: 'info' })
  }

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Заявки"
            subtitle="Заявки на відпуск вантажу зі складу. Дія «Виконати» створює OUTBOUND та переводить заявку в FULFILLED."
            actions={[
              {
                key: 'add',
                label: 'Нова заявка',
                icon: <AddIcon />,
                variant: 'contained',
                onClick: () => {
                  setEditingId(null)
                  setForm(empty)
                  setOpen(true)
                }
              },
              {
                key: 'export',
                label: 'Експорт CSV',
                variant: 'outlined',
                onClick: exportRequests
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
            value={statusFilter}
            onChange={(_e, v) => v && setStatusFilter(v)}
            sx={{ mb: 1 }}
          >
            <ToggleButton value="ALL">Усі</ToggleButton>
            <ToggleButton value="PENDING">PENDING</ToggleButton>
            <ToggleButton value="APPROVED">APPROVED</ToggleButton>
            <ToggleButton value="REJECTED">REJECTED</ToggleButton>
            <ToggleButton value="FULFILLED">FULFILLED</ToggleButton>
          </ToggleButtonGroup>
        </Item>

        <Item>
          <DataGridCard
            height={600}
              rows={filteredRows}
              columns={columns}
              loading={loading}
              storageKey="hl-grid-requests"
              slots={{ toolbar: GridToolbar }}
            />
        </Item>
      </Stagger>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? 'Редагування заявки' : 'Нова заявка'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Склад *"
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Оберіть</MenuItem>
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
              value={form.quantityRequested}
              onChange={(e) => setForm({ ...form, quantityRequested: e.target.value })}
              fullWidth
            />

            <TextField select label="Статус" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Примітки"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!form.warehouseId || !form.cargoId || !Number(form.quantityRequested || 0)}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.type === 'fulfill'}
        title="Виконати заявку?"
        description="Буде створено OUTBOUND транзакцію та статус заявки стане FULFILLED."
        confirmText="Виконати"
        onClose={() => setConfirm({ type: null, id: null })}
        onConfirm={() => fulfillMut.mutate(confirm.id)}
      />

      <ConfirmDialog
        open={confirm.type === 'approve'}
        title="Схвалити заявку?"
        description="Статус заявки стане APPROVED. Після цього її можна виконати."
        confirmText="Схвалити"
        onClose={() => setConfirm({ type: null, id: null })}
        onConfirm={() => approveMut.mutate(confirm.id)}
      />

      <Dialog open={confirm.type === 'reject'} onClose={() => setConfirm({ type: null, id: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Відхилити заявку?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Причина (опційно)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ type: null, id: null })}>Скасувати</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => rejectMut.mutate({ id: confirm.id, reason: rejectReason })}
          >
            Відхилити
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.type === 'delete'}
        title="Видалити заявку?"
        description={nvl('Дія незворотна.')}
        confirmText="Видалити"
        onClose={() => setConfirm({ type: null, id: null })}
        onConfirm={() => deleteMut.mutate(confirm.id)}
      />
    </Box>
  )
}
