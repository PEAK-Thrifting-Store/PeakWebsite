import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Plus, Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useToast } from './AdminApp'
import type { Rail } from '@/types'

export default function AdminRails() {
  const [rails, setRails] = useState<Rail[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = async () => {
    setLoading(true)
    try {
      setRails(await adminApi.getRails())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const r = await adminApi.createRail(newName.trim())
      setRails((prev) => [...prev, r])
      setNewName('')
      toast('Rail created')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = rails.findIndex((r) => r.id === active.id)
    const newIdx = rails.findIndex((r) => r.id === over.id)
    const reordered = arrayMove(rails, oldIdx, newIdx)
    setRails(reordered)
    try {
      await adminApi.reorderRails(reordered.map((r) => r.id))
    } catch {
      toast('Reorder failed', 'error')
      load()
    }
  }

  const moveUp = async (i: number) => {
    if (i === 0) return
    const reordered = arrayMove(rails, i, i - 1)
    setRails(reordered)
    await adminApi.reorderRails(reordered.map((r) => r.id))
  }
  const moveDown = async (i: number) => {
    if (i === rails.length - 1) return
    const reordered = arrayMove(rails, i, i + 1)
    setRails(reordered)
    await adminApi.reorderRails(reordered.map((r) => r.id))
  }

  const deleteRail = async (id: number, name: string) => {
    if (!confirm(`Delete rail "${name}"? Posts in it will become unassigned.`)) return
    try {
      await adminApi.deleteRail(id)
      setRails((prev) => prev.filter((r) => r.id !== id))
      toast('Rail deleted')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-[var(--text)]">Rails</h1>

      {/* Create */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="New rail name…"
          maxLength={100}
          className="flex-1 px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        <button
          onClick={create}
          disabled={creating || !newName.trim()}
          className="btn-primary py-2 px-4 text-sm"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : rails.length === 0 ? (
        <p className="text-sm opacity-50 text-center py-12">No rails yet. Create one above.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rails.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rails.map((rail, i) => (
                <SortableRail
                  key={rail.id}
                  rail={rail}
                  index={i}
                  total={rails.length}
                  onRename={(r) => setRails((prev) => prev.map((x) => (x.id === r.id ? r : x)))}
                  onDelete={() => deleteRail(rail.id, rail.name)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                  toast={toast}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

function SortableRail({
  rail,
  index,
  total,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  toast,
}: {
  rail: Rail
  index: number
  total: number
  onRename: (r: Rail) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rail.id,
  })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(rail.name)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim() || name === rail.name) { setEditing(false); return }
    setSaving(true)
    try {
      const updated = await adminApi.renameRail(rail.id, name.trim())
      onRename(updated)
      toast('Rail renamed')
      setEditing(false)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="admin-card flex items-center gap-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[var(--text)] opacity-30 hover:opacity-60 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      {editing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 px-3 py-1 rounded border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]"
            maxLength={100}
          />
          <button onClick={save} disabled={saving} className="text-green-400 hover:text-green-300" aria-label="Save">
            <Check size={16} />
          </button>
          <button onClick={() => { setEditing(false); setName(rail.name) }} className="text-[var(--text)] opacity-50 hover:opacity-80" aria-label="Cancel">
            <X size={16} />
          </button>
        </div>
      ) : (
        <span className="flex-1 font-medium text-sm text-[var(--text)]">{rail.name}</span>
      )}

      <div className="flex items-center gap-1">
        {/* Mobile up/down */}
        <button onClick={onMoveUp} disabled={index === 0} className="p-1 text-[var(--text)] opacity-40 hover:opacity-70 disabled:opacity-10 md:hidden" aria-label="Move up">
          <ChevronUp size={16} />
        </button>
        <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 text-[var(--text)] opacity-40 hover:opacity-70 disabled:opacity-10 md:hidden" aria-label="Move down">
          <ChevronDown size={16} />
        </button>
        <button
          onClick={() => { setEditing(true); setName(rail.name) }}
          className="p-1.5 rounded hover:bg-[var(--surface2)] text-[var(--text)] opacity-50 hover:opacity-80 transition"
          aria-label="Rename"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-900/30 text-red-400 opacity-60 hover:opacity-100 transition"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
