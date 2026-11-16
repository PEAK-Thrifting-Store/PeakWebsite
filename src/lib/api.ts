import type { Post, Rail, Message } from '@/types'

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, options)
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const json = await res.json()
      msg = json.error || msg
    } catch {}
    throw Object.assign(new Error(msg), { status: res.status })
  }
  return res.json() as Promise<T>
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const publicApi = {
  getCloset: () => request<Rail[]>('/api/closet'),
  sendMessage: (body: { name: string; contact: string; message: string; website?: string }) =>
    request<{ ok: boolean }>('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  me: () => request<{ authenticated: boolean }>('/api/admin/me'),
  login: (username: string, password: string) =>
    request<{ ok: boolean }>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    request<{ ok: boolean }>('/api/admin/logout', { method: 'POST' }),

  // Rails
  getRails: () => request<Rail[]>('/api/admin/rails'),
  createRail: (name: string) =>
    request<Rail>('/api/admin/rails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ name }),
    }),
  renameRail: (id: number, name: string) =>
    request<Rail>(`/api/admin/rails/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ name }),
    }),
  deleteRail: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/rails/${id}`, {
      method: 'DELETE',
      headers: { Origin: window.location.origin },
    }),
  reorderRails: (ids: number[]) =>
    request<{ ok: boolean }>('/api/admin/rails/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ ids }),
    }),

  // Posts
  getPosts: (railId?: number | 'unassigned') =>
    request<Post[]>(
      `/api/admin/posts${railId !== undefined ? `?rail_id=${railId}` : ''}`,
    ),
  createPost: (formData: FormData) =>
    request<Post>('/api/admin/posts', {
      method: 'POST',
      headers: { Origin: window.location.origin },
      body: formData,
    }),
  updatePost: (id: number, formData: FormData) =>
    request<Post>(`/api/admin/posts/${id}`, {
      method: 'PUT',
      headers: { Origin: window.location.origin },
      body: formData,
    }),
  deletePost: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/posts/${id}`, {
      method: 'DELETE',
      headers: { Origin: window.location.origin },
    }),
  toggleVisibility: (id: number, isVisible: boolean) =>
    request<{ id: number; is_visible: boolean }>(`/api/admin/posts/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ is_visible: isVisible }),
    }),
  movePost: (id: number, railId: number | null) =>
    request<{ id: number; rail_id: number | null }>(`/api/admin/posts/${id}/rail`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ rail_id: railId }),
    }),
  reorderPosts: (ids: number[]) =>
    request<{ ok: boolean }>('/api/admin/posts/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ ids }),
    }),

  // Messages
  getMessages: () => request<Message[]>('/api/admin/messages'),
  markRead: (id: number) =>
    request<{ id: number; is_read: boolean }>(`/api/admin/messages/${id}/read`, {
      method: 'PATCH',
      headers: { Origin: window.location.origin },
    }),
  deleteMessage: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: { Origin: window.location.origin },
    }),
}
