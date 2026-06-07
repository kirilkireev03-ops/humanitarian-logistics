import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { GridToolbar } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'

import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import RowActions from '../components/RowActions'
import DataGridCard from '../components/DataGridCard'
import KpiStrip from '../components/KpiStrip'
import { Item, Stagger } from '../components/Reveal'
import { createUser, deleteUser, listUsers, updateUser } from '../api'
import { getGridFieldValue, nvl } from '../utils/format'
import { downloadCsv } from '../utils/exportCsv'

const ROLES = ['ADMIN', 'COORDINATOR', 'OPERATOR', 'VIEWER']

const empty = { username: '', password: '', fullName: '', email: '', role: 'OPERATOR' }

export default function Users() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [selection, setSelection] = useState([])

  const q = useQuery({ queryKey: ['users'], queryFn: listUsers })

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      enqueueSnackbar('Користувача створено', { variant: 'success' })
      q.refetch()
      setOpen(false)
      setForm(empty)
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.error || e.message, { variant: 'error' })
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => updateUser(id, body),
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
    mutationFn: deleteUser,
    onSuccess: () => {
      enqueueSnackbar('Користувача видалено', { variant: 'success' })
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
    return rows.filter((r) => [r.username, r.fullName, r.email, r.role].filter(Boolean).join(' ').toLowerCase().includes(s))
  }, [rows, search])
  const kpis = useMemo(() => {
    const activeRoles = ROLES.filter((r) => rows.some((u) => u.role === r)).length
    return [
      { label: 'Користувачів', value: rows.length, tone: 'info' },
      { label: 'Адміністраторів', value: rows.filter((u) => u.role === 'ADMIN').length, tone: 'warning', hint: 'Підвищений доступ' },
      { label: 'Операторів', value: rows.filter((u) => u.role === 'OPERATOR').length, tone: 'success' },
      { label: 'Активних ролей', value: activeRoles, badge: `${Math.round((activeRoles / ROLES.length) * 100)}%` }
    ]
  }, [rows])

  const exportUsers = () => {
    downloadCsv(
      'users_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Логін', get: (r) => r.username },
        { label: 'Імʼя', get: (r) => r.fullName || '' },
        { label: 'Ел. пошта', get: (r) => r.email || '' },
        { label: 'Роль', get: (r) => r.role }
      ],
      filteredRows
    )
  }
  const exportSelectedUsers = () => {
    const selectedSet = new Set(selection.map(String))
    const selectedRows = filteredRows.filter((r) => selectedSet.has(String(r.id)))
    if (!selectedRows.length) {
      enqueueSnackbar('Немає вибраних рядків для експорту', { variant: 'info' })
      return
    }
    downloadCsv(
      'users_selected_export.csv',
      [
        { label: 'ID', get: (r) => r.id },
        { label: 'Логін', get: (r) => r.username },
        { label: 'Імʼя', get: (r) => r.fullName || '' },
        { label: 'Ел. пошта', get: (r) => r.email || '' },
        { label: 'Роль', get: (r) => r.role }
      ],
      selectedRows
    )
  }

  const resetGridView = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('hl-grid-users')
    enqueueSnackbar('Налаштування таблиці скинуто. Оновіть сторінку для повного reset.', { variant: 'info' })
  }

  const columns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'username', headerName: 'Логін', flex: 1, minWidth: 160 },
      { field: 'fullName', headerName: 'Імʼя', flex: 1, minWidth: 180, valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'fullName')) },
      { field: 'email', headerName: 'Ел. пошта', flex: 1, minWidth: 200, valueGetter: (value, row) => nvl(getGridFieldValue(value, row, 'email')) },
      { field: 'role', headerName: 'Роль', width: 150 },
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
                  const u = params.row
                  setEditingId(u.id)
                  setForm({
                    username: u.username || '',
                    password: '',
                    fullName: u.fullName || '',
                    email: u.email || '',
                    role: u.role || 'OPERATOR'
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
      username: form.username.trim(),
      password: form.password?.trim() ? form.password.trim() : null,
      fullName: form.fullName?.trim() ? form.fullName.trim() : null,
      email: form.email?.trim() ? form.email.trim() : null,
      role: form.role
    }
    if (!editingId && !body.password) {
      enqueueSnackbar('Пароль обовʼязковий для нового користувача', { variant: 'warning' })
      return
    }
    if (editingId) updateMut.mutate({ id: editingId, body })
    else createMut.mutate(body)
  }

  const onBulkDelete = async () => {
    const ids = [...selection]
    if (!ids.length) return
    const results = await Promise.allSettled(ids.map((id) => deleteUser(id)))
    const ok = results.filter((r) => r.status === 'fulfilled').length
    const fail = results.length - ok
    enqueueSnackbar(`Масове видалення користувачів: успішно ${ok}, помилок ${fail}`, { variant: fail ? 'warning' : 'success' })
    setBulkConfirmOpen(false)
    setSelection([])
    q.refetch()
  }

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Користувачі"
            subtitle="Управління користувачами та ролями (доступно лише ADMIN)."
            actions={[
              {
                key: 'bulk-delete',
                label: `Видалити вибраних (${selection.length})`,
                color: 'error',
                variant: 'outlined',
                disabled: selection.length === 0,
                onClick: () => setBulkConfirmOpen(true)
              },
              {
                key: 'export',
                label: 'Експорт CSV',
                variant: 'outlined',
                onClick: exportUsers
              },
              {
                key: 'export-selected',
                label: `Експорт вибраних (${selection.length})`,
                variant: 'outlined',
                disabled: selection.length === 0,
                onClick: exportSelectedUsers
              },
              {
                key: 'reset-view',
                label: 'Скинути вигляд таблиці',
                variant: 'text',
                onClick: resetGridView
              },
              {
                key: 'add',
                label: 'Додати користувача',
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
          <TextField label="Пошук користувача" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth sx={{ mb: 1 }} />
        </Item>

        <Item>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
            {ROLES.map((r) => {
              const count = rows.filter((u) => u.role === r).length
              return <Chip key={r} size="small" label={`${r}: ${count}`} variant="outlined" />
            })}
          </Stack>
        </Item>

        <Item>
          <DataGridCard
            height={620}
            rows={filteredRows}
            columns={columns}
            loading={q.isLoading}
            checkboxSelection
            rowSelectionModel={selection}
            onRowSelectionModelChange={(m) => setSelection(Array.isArray(m) ? m : [])}
            storageKey="hl-grid-users"
            slots={{ toolbar: GridToolbar }}
          />
        </Item>
      </Stagger>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? 'Редагування користувача' : 'Новий користувач'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Логін *"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              fullWidth
            />
            <TextField
              label={editingId ? 'Пароль (залиште порожнім, щоб не змінювати)' : 'Пароль *'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="Повне імʼя"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Ел. пошта"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            <TextField select label="Роль" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!form.username.trim()}>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Видалити вибраних користувачів?"
        description={`Буде видалено користувачів: ${selection.length}.`}
        confirmText="Видалити вибраних"
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={onBulkDelete}
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Видалити користувача?"
        description="Дія незворотна."
        confirmText="Видалити"
        onClose={() => setConfirmId(null)}
        onConfirm={() => deleteMut.mutate(confirmId)}
      />
    </Box>
  )
}
