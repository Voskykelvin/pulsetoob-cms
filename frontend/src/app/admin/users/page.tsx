'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { AxiosError } from 'axios'
import api from '@/lib/api'
import type { ApiResponse, CmsUser, UserRole } from '@/types/cms'

interface ApiError {
  error?: string
  message?: string
}

interface UserForm {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  isVerified: boolean
}

const DEFAULT_FORM: UserForm = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'contributor',
  isActive: true,
  isVerified: true,
}

const roleColors: Record<UserRole, { bg: string; color: string; border: string }> = {
  super_admin: { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' },
  admin: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  editor: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  author: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  contributor: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  subscriber: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  author: 'Author',
  contributor: 'Contributor',
  subscriber: 'Subscriber',
}

const roles: UserRole[] = ['super_admin', 'admin', 'editor', 'author', 'contributor', 'subscriber']

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<CmsUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<UserForm>(DEFAULT_FORM)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login')
      return
    }
    fetchUsers()
  }, [search, roleFilter, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: { search?: string; role?: UserRole } = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get<ApiResponse<CmsUser[]>>('/admin/users', { params })
      if (res.data.success) setUsers(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.post('/admin/users', form)
      setShowModal(false)
      setForm(DEFAULT_FORM)
      fetchUsers()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role })
      fetchUsers()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed')
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive })
      fetchUsers()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem' }}>PulseToob</a>
          <span style={{ color: '#9ca3af' }}>/</span>
          <span style={{ fontWeight: '600' }}>Users</span>
        </div>
        <button onClick={() => { setForm(DEFAULT_FORM); setShowModal(true) }} style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          + New User
        </button>
      </header>

      <div style={{ padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', flex: 1, minWidth: '200px', outline: 'none' }} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}>
            <option value="">All Roles</option>
            {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
          </select>
          <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: 'auto' }}>{users.length} users</span>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map((heading) => (
                  <th key={heading} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No users found.</td></tr>
              ) : users.map((user) => {
                const roleStyle = roleColors[user.role] || roleColors.subscriber
                const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#16a34a', fontSize: '0.875rem' }}>
                          {(user.firstName || user.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: '500', color: '#111827', fontSize: '0.9rem', margin: 0 }}>{displayName}</p>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${roleStyle.border}`, background: roleStyle.bg, color: roleStyle.color, fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}>
                        {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: user.isActive ? '#f0fdf4' : '#fef2f2', color: user.isActive ? '#16a34a' : '#dc2626', border: `1px solid ${user.isActive ? '#bbf7d0' : '#fecaca'}` }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => handleToggleActive(user.id, user.isActive)}
                        style={{ padding: '0.375rem 0.75rem', background: user.isActive ? '#fef2f2' : '#f0fdf4', color: user.isActive ? '#dc2626' : '#16a34a', border: `1px solid ${user.isActive ? '#fecaca' : '#bbf7d0'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '560px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Add Contributor</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>x</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  First name
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={fieldStyle} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Last name
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={fieldStyle} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Username
                  <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={fieldStyle} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Email
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={fieldStyle} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Temporary password
                  <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={fieldStyle} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Role
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} style={fieldStyle}>
                    {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', color: '#374151', fontSize: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} />
                  Verified
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.625rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const fieldStyle = {
  width: '100%',
  padding: '0.625rem',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.875rem',
  boxSizing: 'border-box' as const,
  outline: 'none',
}
