import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Search, Trash2, X, MapPin, Globe, Layers,
  GraduationCap, RotateCcw, Check, ChevronRight, ChevronDown,
  AlertCircle, BookOpen, Filter, Eye, PencilLine, ExternalLink,
  Archive, FileText, LayoutGrid, List, Image as ImageIcon,
} from 'lucide-react'
import { SEED_PROGRAMS, DEFAULT_CATEGORIES } from './data.js'

/* ============================================================================
   Constants
============================================================================ */

const DEGREE_CATEGORIES = ['Doctorate', 'Masters', 'Bachelors', 'Certificate']

const DEGREE_ABBREV_SUGGESTIONS = {
  Doctorate:   ['Ed.D.', 'Ph.D.'],
  Masters:     ['M.A.', 'M.A.E.', 'M.Ed.', 'Ed.S.'],
  Bachelors:   ['B.A.', 'B.A.E.', 'B.S.', 'B.S.E.'],
  Certificate: ['Reading Endorsement', 'EdTech 4+1'],
}

const DELIVERY_MODES = [
  { value: 'on-campus', label: 'On Campus', Icon: MapPin },
  { value: 'online',    label: 'Online',    Icon: Globe },
  { value: 'hybrid',    label: 'Hybrid',    Icon: Layers },
]

const MODE_DOT = {
  'on-campus': 'bg-emerald-500',
  'online':    'bg-sky-500',
  'hybrid':    'bg-amber-500',
}
const MODE_TINT = {
  'on-campus': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'online':    'bg-sky-50 text-sky-800 border-sky-200',
  'hybrid':    'bg-amber-50 text-amber-900 border-amber-200',
}
const MODE_LABEL = { 'on-campus': 'On Campus', 'online': 'Online', 'hybrid': 'Hybrid' }

const STATUS_META = {
  draft:     { label: 'Draft',     dot: 'bg-amber-500',   tint: 'bg-amber-50 text-amber-800 border-amber-200',   Icon: FileText },
  published: { label: 'Published', dot: 'bg-emerald-500', tint: 'bg-emerald-50 text-emerald-800 border-emerald-200', Icon: Check },
  archived:  { label: 'Archived',  dot: 'bg-stone-400',   tint: 'bg-stone-100 text-stone-600 border-stone-200',  Icon: Archive },
}
const STATUS_OPTIONS = ['draft', 'published', 'archived']

const STORAGE_KEY = 'uf-coe-programs-v1'
const LAYOUT_KEY = 'uf-coe-layout-v1'
const genId = () => 'id_' + Math.random().toString(36).slice(2, 10)

/* ============================================================================
   App
============================================================================ */

export default function App() {
  const [view, setView] = useState('admin')
  const [programs, setPrograms] = useState(SEED_PROGRAMS)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [selectedId, setSelectedId] = useState(SEED_PROGRAMS[0]?.id ?? null)
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')

  // Hydrate from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.programs) && data.programs.length) {
          // Backwards-compat: convert legacy `published: bool` → `status: string`
          // and ensure every program has an image field
          const normalized = data.programs.map((p) => {
            const next = { image: '', ...p }
            if ('published' in next && !('status' in next)) {
              next.status = next.published ? 'published' : 'draft'
              delete next.published
            }
            if (!next.status) next.status = 'published'
            return next
          })
          setPrograms(normalized)
          setSelectedId(normalized[0].id)
        }
        if (Array.isArray(data.categories) && data.categories.length) {
          setCategories(data.categories)
        }
      }
    } catch {}
    setLoaded(true)
  }, [])

  // Auto-save (debounced)
  useEffect(() => {
    if (!loaded) return
    setSaveStatus('saving')
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ programs, categories }))
        setSaveStatus('saved')
      } catch {
        setSaveStatus('idle')
      }
    }, 350)
    return () => clearTimeout(t)
  }, [programs, categories, loaded])

  /* --- mutations --- */
  const updateProgram = (id, patch) =>
    setPrograms((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const addProgram = () => {
    const np = {
      id: genId(),
      title: 'Untitled Program',
      category: categories[0] || '',
      description: '',
      image: '',
      status: 'draft',
      degrees: [],
    }
    setPrograms((ps) => [np, ...ps])
    setSelectedId(np.id)
    setView('admin')
  }

  const deleteProgram = (id) => {
    setPrograms((ps) => {
      const next = ps.filter((p) => p.id !== id)
      if (id === selectedId) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  const addDegree = (programId) =>
    setPrograms((ps) =>
      ps.map((p) =>
        p.id !== programId
          ? p
          : { ...p, degrees: [...p.degrees, { id: genId(), degreeCategory: 'Masters', type: '', deliveryMode: 'on-campus', url: '' }] }
      )
    )

  const updateDegree = (programId, degreeId, patch) =>
    setPrograms((ps) =>
      ps.map((p) =>
        p.id !== programId
          ? p
          : { ...p, degrees: p.degrees.map((d) => (d.id === degreeId ? { ...d, ...patch } : d)) }
      )
    )

  const removeDegree = (programId, degreeId) =>
    setPrograms((ps) =>
      ps.map((p) => (p.id !== programId ? p : { ...p, degrees: p.degrees.filter((d) => d.id !== degreeId) }))
    )

  const addCategory = (name) => {
    const t = name.trim()
    if (!t || categories.includes(t)) return
    setCategories((cs) => [...cs, t])
  }

  const resetData = () => {
    if (!confirm('Reset all programs and categories to source data? This will erase any local edits.')) return
    setPrograms(SEED_PROGRAMS)
    setCategories(DEFAULT_CATEGORIES)
    setSelectedId(SEED_PROGRAMS[0].id)
  }

  const selected = programs.find((p) => p.id === selectedId)

  return (
    <div className="min-h-screen text-stone-900">
      <Header view={view} setView={setView} saveStatus={saveStatus} resetData={resetData} />
      {view === 'admin' ? (
        <AdminView
          programs={programs}
          categories={categories}
          selected={selected}
          setSelectedId={setSelectedId}
          addProgram={addProgram}
          updateProgram={updateProgram}
          deleteProgram={deleteProgram}
          addDegree={addDegree}
          updateDegree={updateDegree}
          removeDegree={removeDegree}
          addCategory={addCategory}
        />
      ) : (
        <PreviewView programs={programs} categories={categories} />
      )}
    </div>
  )
}

/* ============================================================================
   Header
============================================================================ */

function Header({ view, setView, saveStatus, resetData }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-stone-200"
      style={{ background: 'rgba(247,244,238,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: '#1e3a8a' }}
          >
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold">Program Directory</div>
            <div className="text-xs text-stone-500 -mt-0.5">UF College of Education · CMS Prototype</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SaveIndicator status={saveStatus} />
          <button
            onClick={resetData}
            title="Reset to source data"
            className="text-stone-500 hover:text-stone-900 p-1.5 rounded-md hover:bg-stone-200/60"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-stone-200/70 rounded-lg p-0.5">
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                view === 'admin' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PencilLine className="w-3.5 h-3.5" /> Admin
            </button>
            <button
              onClick={() => setView('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                view === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function SaveIndicator({ status }) {
  if (status === 'saving')
    return (
      <span className="text-xs text-stone-500 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Saving…
      </span>
    )
  if (status === 'saved')
    return (
      <span className="text-xs text-stone-500 flex items-center gap-1.5">
        <Check className="w-3 h-3 text-emerald-600" /> All changes saved
      </span>
    )
  return null
}

/* ============================================================================
   Admin View
============================================================================ */

function AdminView({
  programs, categories, selected, setSelectedId,
  addProgram, updateProgram, deleteProgram, addCategory,
}) {
  const [search, setSearch] = useState('')
  const [adminLayout, setAdminLayout] = useState('editor')
  const [editorDirty, setEditorDirty] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return programs
    return programs.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [programs, search])

  const handleSelectProgram = (id) => {
    if (editorDirty && id !== selected?.id) {
      setPendingAction({ type: 'select', id })
    } else {
      setSelectedId(id)
    }
  }

  const handleAddProgram = () => {
    if (editorDirty) {
      setPendingAction({ type: 'new' })
    } else {
      addProgram()
    }
  }

  const confirmDiscard = () => {
    const action = pendingAction
    setPendingAction(null)
    setEditorDirty(false)
    if (action?.type === 'select') setSelectedId(action.id)
    else if (action?.type === 'new') addProgram()
  }

  if (adminLayout === 'table') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <BulkListView
          programs={programs}
          categories={categories}
          filtered={filtered}
          search={search}
          setSearch={setSearch}
          updateProgram={updateProgram}
          deleteProgram={deleteProgram}
          addProgram={addProgram}
          onEditProgram={(id) => { setSelectedId(id); setAdminLayout('editor') }}
          onSwitchToEditor={() => setAdminLayout('editor')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {pendingAction && (
        <UnsavedModal onDiscard={confirmDiscard} onKeep={() => setPendingAction(null)} />
      )}
      <div className="grid grid-cols-12 gap-6" style={{ minHeight: 'calc(100vh - 6.5rem)' }}>
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div
            className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 7.5rem)' }}
          >
            <div className="p-3 border-b border-stone-200 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAddProgram}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-stone-800 transition"
                >
                  <Plus className="w-4 h-4" /> New Program
                </button>
                <button
                  onClick={() => setAdminLayout('table')}
                  title="List view"
                  className="border border-stone-200 rounded-lg px-2.5 hover:bg-stone-50 text-stone-500 hover:text-stone-900 transition"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search programs"
                  className="input-base w-full text-sm pl-8 pr-2 py-1.5 border border-stone-200 rounded-md bg-stone-50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 && (
                <div className="text-sm text-stone-500 px-4 py-8 text-center">No programs found</div>
              )}
              {filtered.map((p) => (
                <ProgramRow
                  key={p.id}
                  program={p}
                  selected={selected?.id === p.id}
                  onSelect={() => handleSelectProgram(p.id)}
                />
              ))}
            </div>
            <div className="p-3 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between">
              <span>{programs.length} program{programs.length !== 1 ? 's' : ''}</span>
              <span>{programs.reduce((n, p) => n + p.degrees.length, 0)} offerings</span>
            </div>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          {selected ? (
            <Editor
              key={selected.id}
              program={selected}
              categories={categories}
              updateProgram={updateProgram}
              deleteProgram={deleteProgram}
              addCategory={addCategory}
              onDirtyChange={setEditorDirty}
            />
          ) : (
            <EmptyEditor onAdd={handleAddProgram} />
          )}
        </main>
      </div>
    </div>
  )
}

function ProgramRow({ program, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-stone-50 flex items-start gap-3 group ${
        selected ? 'row-selected' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate">{program.title || 'Untitled'}</div>
          {program.status !== 'published' && <StatusPill status={program.status} />}
        </div>
        <div className="row-sub text-xs text-stone-500 truncate mt-0.5">{program.category || '—'}</div>
        <div className="mt-1.5">
          <span className="text-[11px] text-stone-400">
            {program.degrees.length} degree{program.degrees.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <ChevronRight className="row-chev w-4 h-4 text-stone-300 mt-0.5" />
    </button>
  )
}

function EmptyEditor({ onAdd }) {
  return (
    <div className="bg-white border border-stone-200 border-dashed rounded-xl flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="w-10 h-10 text-stone-300 mb-3" />
      <h3 className="font-display text-xl font-semibold mb-1">No program selected</h3>
      <p className="text-sm text-stone-500 mb-4">Pick a program from the list, or create a new one.</p>
      <button onClick={onAdd} className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
        <Plus className="w-4 h-4" /> New Program
      </button>
    </div>
  )
}

/* ============================================================================
   Editor
============================================================================ */

function Editor({ program, categories, updateProgram, deleteProgram, addCategory, onDirtyChange }) {
  const [draft, setDraft] = useState(program)
  const [showCategoryAdd, setShowCategoryAdd] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(program)

  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty])
  useEffect(() => { setDraft(program) }, [program.id])

  const patchDraft = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const patchDegreeDraft = (degId, patch) =>
    setDraft((d) => ({ ...d, degrees: d.degrees.map((deg) => deg.id === degId ? { ...deg, ...patch } : deg) }))

  const addDegreeDraft = () =>
    setDraft((d) => ({
      ...d,
      degrees: [...d.degrees, { id: genId(), degreeCategory: 'Masters', type: '', deliveryMode: 'on-campus', url: '' }],
    }))

  const removeDegreeDraft = (degId) =>
    setDraft((d) => ({ ...d, degrees: d.degrees.filter((deg) => deg.id !== degId) }))

  const handleSave = () => updateProgram(program.id, draft)

  return (
    <div className="bg-white border border-stone-200 rounded-xl anim-fade-up">
      <div className="px-7 py-6 space-y-7">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 select-none pt-1">
          <span className="text-[10px] uppercase tracking-wider text-stone-500">Status</span>
          <div className="flex bg-stone-100 rounded-md p-0.5">
            {STATUS_OPTIONS.map((s) => {
              const meta = STATUS_META[s]
              const active = draft.status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => patchDraft({ status: s })}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded transition ${
                    active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </label>
      </div>
      <div className="px-7 pt-7 pb-5 border-b border-stone-100 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Editing program</div>
          <input
            value={draft.title}
            onChange={(e) => patchDraft({ title: e.target.value })}
            placeholder="Program Title"
            className="input-base font-display text-3xl font-semibold w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0"
          />
        </div>
      </div>

      <div className="px-7 py-6 space-y-7">
        <section>
          <SectionLabel>Basics</SectionLabel>
          <div className="space-y-7">
            <div>
              <FieldLabel>School</FieldLabel>
              <div className="flex gap-2">
                <select
                  value={draft.category}
                  onChange={(e) => patchDraft({ category: e.target.value })}
                  className="input-base flex-1 text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
                >
                  <option value="">— Select —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCategoryAdd((s) => !s)}
                  className="text-sm border border-stone-200 rounded-md px-2 py-2 hover:bg-stone-50"
                  title="Add category"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showCategoryAdd && (
                <div className="flex gap-2 mt-2 anim-fade-up">
                  <input
                    autoFocus
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCategory(newCat)
                        if (newCat.trim()) patchDraft({ category: newCat.trim() })
                        setNewCat('')
                        setShowCategoryAdd(false)
                      }
                      if (e.key === 'Escape') {
                        setNewCat('')
                        setShowCategoryAdd(false)
                      }
                    }}
                    placeholder="New category name"
                    className="input-base flex-1 text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
                  />
                  <button
                    onClick={() => {
                      addCategory(newCat)
                      if (newCat.trim()) patchDraft({ category: newCat.trim() })
                      setNewCat('')
                      setShowCategoryAdd(false)
                    }}
                    className="text-sm bg-stone-900 text-white rounded-md px-3 py-2"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Short description</FieldLabel>
              <textarea
                value={draft.description}
                onChange={(e) => patchDraft({ description: e.target.value })}
                placeholder="Appears on the public program card."
                rows={3}
                className="input-base w-full text-sm border border-stone-200 rounded-md px-3 py-2 bg-white resize-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Hero image URL</FieldLabel>
            <div className="flex gap-3 items-start">
              <input
                value={draft.image || ''}
                onChange={(e) => patchDraft({ image: e.target.value })}
                placeholder="https://education.ufl.edu/program-directory/files/…"
                className="input-base flex-1 text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
              />
              <div className="w-28 h-16 rounded-md border border-stone-200 bg-stone-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {draft.image ? (
                  <img
                    src={draft.image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-stone-300" />
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-2">
            <SectionLabel className="mb-0">Degree Offerings</SectionLabel>
            <span className="text-xs text-stone-500">
              {draft.degrees.length} offering{draft.degrees.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-3">
            Each offering pairs a degree type with a delivery mode. Filters on the public site read from this list.
          </p>

          <div className="space-y-2">
            {draft.degrees.map((d) => (
              <DegreeRow
                key={d.id}
                degree={d}
                onChange={(patch) => patchDegreeDraft(d.id, patch)}
                onRemove={() => removeDegreeDraft(d.id)}
              />
            ))}
            {draft.degrees.length === 0 && (
              <div className="text-sm text-stone-500 border border-dashed border-stone-200 rounded-lg py-6 text-center bg-stone-50/60">
                No offerings yet. Add a degree below.
              </div>
            )}
          </div>

          <button
            onClick={addDegreeDraft}
            className="mt-3 inline-flex items-center gap-1.5 text-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 px-3 py-1.5 rounded-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add degree offering
          </button>
        </section>
      </div>

      <div className="px-7 py-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/40 rounded-b-xl">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete program
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-stone-700">Delete this program?</span>
            <button
              onClick={() => deleteProgram(program.id)}
              className="bg-red-600 text-white px-2.5 py-1 rounded-md text-xs font-medium"
            >
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-stone-500 px-2 py-1 text-xs">
              Cancel
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition ${
              isDirty
                ? 'bg-stone-900 text-white hover:bg-stone-700'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  )
}

function UnsavedModal({ onDiscard, onKeep }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onKeep} />
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 p-6 max-w-sm w-full mx-4 anim-fade-up">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">Unsaved changes</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              You have unsaved changes. If you leave now, your changes will be lost.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onKeep}
            className="px-3 py-1.5 text-sm text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition"
          >
            Keep editing
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Discard changes
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children, className = '' }) {
  return (
    <div className={`text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 ${className}`}>
      {children}
    </div>
  )
}
function FieldLabel({ children }) {
  return <label className="block text-xs font-medium text-stone-600 mb-1.5">{children}</label>
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border row-count ${meta.tint}`}>
      {meta.label}
    </span>
  )
}

/* ============================================================================
   Degree Row
============================================================================ */

function DegreeRow({ degree, onChange, onRemove }) {
  const abbrevId = 'abbrev-' + degree.id
  const suggestions = DEGREE_ABBREV_SUGGESTIONS[degree.degreeCategory] || []
  return (
    <div className="border border-stone-200 rounded-lg bg-white overflow-hidden">
      <div className="grid grid-cols-12 gap-3 p-3 items-start">
        {/* Degree type dropdown */}
        <div className="col-span-12 md:col-span-3">
          <FieldLabel>Degree type</FieldLabel>
          <select
            value={degree.degreeCategory || ''}
            onChange={(e) => onChange({ degreeCategory: e.target.value, type: '' })}
            className="input-base w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
          >
            <option value="">— Select —</option>
            {DEGREE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Specific abbreviation */}
        <div className="col-span-12 md:col-span-3">
          <FieldLabel>Abbreviation</FieldLabel>
          <input
            list={abbrevId}
            value={degree.type}
            onChange={(e) => onChange({ type: e.target.value })}
            placeholder="e.g. M.Ed., B.A.E."
            className="input-base w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
          />
          <datalist id={abbrevId}>
            {suggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        {/* Delivery mode dropdown */}
        <div className="col-span-12 md:col-span-2">
          <FieldLabel>Delivery mode</FieldLabel>
          <select
            value={degree.deliveryMode}
            onChange={(e) => onChange({ deliveryMode: e.target.value })}
            className="input-base w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
          >
            {DELIVERY_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* URL */}
        <div className="col-span-11 md:col-span-3">
          <FieldLabel>Program URL</FieldLabel>
          <input
            value={degree.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://education.ufl.edu/…"
            className="input-base w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
          />
        </div>

        <div className="col-span-1 flex items-end justify-end pt-5">
          <button
            onClick={onRemove}
            className="text-stone-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
            title="Remove offering"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   Bulk List View
============================================================================ */

function BulkListView({
  programs, categories, filtered, search, setSearch,
  updateProgram, deleteProgram, addProgram,
  onEditProgram, onSwitchToEditor,
}) {
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [bulkMenu, setBulkMenu] = useState(null) // 'status' | 'school' | null
  const [filterSchool, setFilterSchool] = useState('')
  const [filterDelivery, setFilterDelivery] = useState('')
  const selectAllRef = useRef(null)

  const displayRows = useMemo(() => {
    return filtered.filter((p) => {
      if (filterSchool && p.category !== filterSchool) return false
      if (filterDelivery && !p.degrees.some((d) => d.deliveryMode === filterDelivery)) return false
      return true
    })
  }, [filtered, filterSchool, filterDelivery])

  const allChecked = displayRows.length > 0 && displayRows.every((p) => checkedIds.has(p.id))
  const someChecked = !allChecked && displayRows.some((p) => checkedIds.has(p.id))

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked
  }, [someChecked])

  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(displayRows.map((p) => p.id)))
  }

  const toggleOne = (id) =>
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const bulkSetStatus = (status) => {
    checkedIds.forEach((id) => updateProgram(id, { status }))
    setCheckedIds(new Set())
    setBulkMenu(null)
  }

  const bulkSetCategory = (category) => {
    checkedIds.forEach((id) => updateProgram(id, { category }))
    setCheckedIds(new Set())
    setBulkMenu(null)
  }

  const bulkDelete = () => {
    if (!confirm(`Delete ${checkedIds.size} program${checkedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    checkedIds.forEach((id) => deleteProgram(id))
    setCheckedIds(new Set())
  }

  return (
    <div className="anim-fade-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={onSwitchToEditor}
            className="flex items-center gap-1.5 text-sm border border-stone-200 rounded-lg px-3 py-2 hover:bg-white hover:border-stone-300 text-stone-600 hover:text-stone-900 transition"
          >
            <PencilLine className="w-3.5 h-3.5" /> Editor
          </button>
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs…"
              className="input-base w-full text-sm pl-8 pr-3 py-2 border border-stone-200 rounded-lg bg-white"
            />
          </div>
        </div>
        <button
          onClick={addProgram}
          className="flex items-center gap-1.5 bg-stone-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-800 transition"
        >
          <Plus className="w-4 h-4" /> New Program
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <select
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
          className="input-base text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white text-stone-700"
        >
          <option value="">All schools</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterDelivery}
          onChange={(e) => setFilterDelivery(e.target.value)}
          className="input-base text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white text-stone-700"
        >
          <option value="">All delivery types</option>
          {DELIVERY_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {(filterSchool || filterDelivery) && (
          <button
            onClick={() => { setFilterSchool(''); setFilterDelivery('') }}
            className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-stone-500">{displayRows.length} of {programs.length}</span>
      </div>

      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div className="bg-stone-900 text-white rounded-xl px-4 py-2.5 mb-3 flex items-center gap-3 anim-fade-up">
          <span className="text-sm font-medium tabular-nums">{checkedIds.size} selected</span>
          <div className="w-px h-4 bg-stone-600" />

          <div className="relative">
            <button
              onClick={() => setBulkMenu((m) => (m === 'status' ? null : 'status'))}
              className="flex items-center gap-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-md transition"
            >
              Set status <ChevronDown className="w-3 h-3" />
            </button>
            {bulkMenu === 'status' && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => bulkSetStatus(s)}
                    className="w-full text-left px-3 py-1.5 text-xs text-stone-800 flex items-center gap-2 hover:bg-stone-50"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[s].dot}`} />
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setBulkMenu((m) => (m === 'school' ? null : 'school'))}
              className="flex items-center gap-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-md transition"
            >
              Set school <ChevronDown className="w-3 h-3" />
            </button>
            {bulkMenu === 'school' && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1 min-w-[260px]">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => bulkSetCategory(c)}
                    className="w-full text-left px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={bulkDelete}
            className="flex items-center gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>

          <button
            onClick={() => { setCheckedIds(new Set()); setBulkMenu(null) }}
            className="ml-auto text-stone-400 hover:text-white transition"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="rounded border-stone-300 accent-stone-900 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 min-w-[220px]">Title</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 min-w-[200px]">School</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 min-w-[180px]">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 min-w-[120px]">Offerings</th>
                <th className="w-20 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayRows.map((p) => (
                <BulkRow
                  key={p.id}
                  program={p}
                  checked={checkedIds.has(p.id)}
                  onToggle={() => toggleOne(p.id)}
                  onUpdate={(patch) => updateProgram(p.id, patch)}
                  onDelete={() => deleteProgram(p.id)}
                  onEdit={() => onEditProgram(p.id)}
                  categories={categories}
                />
              ))}
            </tbody>
          </table>
        </div>

        {displayRows.length === 0 && (
          <div className="py-12 text-center text-sm text-stone-500">No programs found</div>
        )}

        <div className="px-4 py-2.5 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between bg-stone-50/40">
          <span>{programs.length} program{programs.length !== 1 ? 's' : ''}</span>
          <span>{programs.reduce((n, p) => n + p.degrees.length, 0)} total offerings</span>
        </div>
      </div>
    </div>
  )
}

function BulkRow({ program, checked, onToggle, onUpdate, onDelete, onEdit, categories }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(program.title)

  const commitTitle = () => {
    onUpdate({ title: titleDraft })
    setEditingTitle(false)
  }

  return (
    <tr
      className={`group border-b border-stone-100 transition-colors ${
        checked ? 'bg-blue-50/40' : 'hover:bg-stone-50/60'
      }`}
    >
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="rounded border-stone-300 accent-stone-900 cursor-pointer"
        />
      </td>

      <td className="px-3 py-2.5 font-medium text-stone-900">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setTitleDraft(program.title); setEditingTitle(false) }
            }}
            className="input-base w-full border border-stone-300 rounded px-2 py-0.5 text-sm font-medium"
          />
        ) : (
          <button
            onClick={() => { setTitleDraft(program.title); setEditingTitle(true) }}
            className="text-left hover:underline underline-offset-2 decoration-stone-300 w-full"
            title="Click to edit title"
          >
            {program.title || 'Untitled'}
          </button>
        )}
      </td>

      <td className="px-3 py-2.5">
        <select
          value={program.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className="text-sm text-stone-600 bg-transparent border-0 cursor-pointer hover:text-stone-900 focus:outline-none focus:ring-0 pr-1 -ml-0.5 w-full"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2.5">
        <StatusDropdown status={program.status} onChange={(s) => onUpdate({ status: s })} />
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 tabular-nums w-4 shrink-0">{program.degrees.length}</span>
          <div className="flex gap-1 flex-wrap">
            {program.degrees.slice(0, 8).map((d) => (
              <span
                key={d.id}
                className={`w-2 h-2 rounded-full ${MODE_DOT[d.deliveryMode]}`}
                title={`${d.degreeCategory || d.type}${d.degreeCategory && d.type ? ' · ' + d.type : ''} · ${MODE_LABEL[d.deliveryMode]}`}
              />
            ))}
            {program.degrees.length > 8 && (
              <span className="text-[10px] text-stone-400">+{program.degrees.length - 8}</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition"
            title="Open in editor"
          >
            <PencilLine className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition"
            title="Delete program"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function StatusDropdown({ status, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const meta = STATUS_META[status] || STATUS_META.draft

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${meta.tint} hover:shadow-sm transition`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1 min-w-[130px]">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-stone-50 ${
                status === s ? 'font-semibold text-stone-900' : 'text-stone-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================================
   Preview View
============================================================================ */

function PreviewView({ programs, categories }) {
  const [search, setSearch] = useState('')
  const [activeCategories, setActiveCategories] = useState([])
  const [activeDegrees, setActiveDegrees] = useState([])
  const [activeModes, setActiveModes] = useState([])
  const [layout, setLayout] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) || 'grid'
    } catch {
      return 'grid'
    }
  })

  useEffect(() => {
    try { localStorage.setItem(LAYOUT_KEY, layout) } catch {}
  }, [layout])

  const usedDegreeTypes = useMemo(() => {
    const set = new Set()
    programs.forEach((p) =>
      p.degrees.forEach((d) => {
        if (d.degreeCategory && DEGREE_CATEGORIES.includes(d.degreeCategory)) set.add(d.degreeCategory)
      })
    )
    return DEGREE_CATEGORIES.filter((c) => set.has(c))
  }, [programs])

  const usedCategories = useMemo(() => {
    const set = new Set(programs.filter((p) => p.status === 'published').map((p) => p.category).filter(Boolean))
    return categories.filter((c) => set.has(c))
  }, [programs, categories])

  const visiblePrograms = useMemo(() => {
    return programs.filter((p) => {
      if (p.status !== 'published') return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q) &&
          !(p.description || '').toLowerCase().includes(q)
        )
          return false
      }
      if (activeCategories.length && !activeCategories.includes(p.category)) return false
      if (activeDegrees.length || activeModes.length) {
        const matches = p.degrees.some(
          (d) =>
            (!activeDegrees.length || activeDegrees.includes(d.degreeCategory)) &&
            (!activeModes.length || activeModes.includes(d.deliveryMode))
        )
        if (!matches) return false
      }
      return true
    })
  }, [programs, search, activeCategories, activeDegrees, activeModes])

  const toggleIn = (setter) => (val) =>
    setter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]))
  const toggleCat = toggleIn(setActiveCategories)
  const toggleDeg = toggleIn(setActiveDegrees)
  const toggleMode = toggleIn(setActiveModes)

  const reset = () => {
    setActiveCategories([])
    setActiveDegrees([])
    setActiveModes([])
    setSearch('')
  }
  const anyActive = !!(activeCategories.length || activeDegrees.length || activeModes.length || search.trim())

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.18em] text-stone-500 mb-2">College of Education</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-3">Program Directory</h1>
        <p className="text-stone-600 leading-relaxed">
          Browse the College of Education's certificate, undergraduate, and graduate programs. Filter by program
          type, degree, and delivery mode to find the option that fits your goals.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 md:col-span-5">
            <FieldLabel>Search</FieldLabel>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs by title, category, or description"
                className="input-base w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-md bg-white"
              />
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 flex items-end justify-end gap-3">
            <span className="text-xs text-stone-500 mr-auto md:mr-0">
              {anyActive ? (
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Filtering · {visiblePrograms.length} result{visiblePrograms.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <>{visiblePrograms.length} programs</>
              )}
            </span>
            {anyActive && (
              <button onClick={reset} className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1">
                <X className="w-3 h-3" /> Reset
              </button>
            )}
            <div className="flex items-center bg-stone-100 rounded-md p-0.5">
              <button
                onClick={() => setLayout('grid')}
                title="Grid view"
                className={`p-1.5 rounded transition ${
                  layout === 'grid' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayout('list')}
                title="List view"
                className={`p-1.5 rounded transition ${
                  layout === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <FilterGroup label="Degree Type">
          {usedDegreeTypes.map((t) => (
            <Chip key={t} active={activeDegrees.includes(t)} onClick={() => toggleDeg(t)}>
              {t}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Program Type">
          {usedCategories.map((c) => (
            <Chip key={c} active={activeCategories.includes(c)} onClick={() => toggleCat(c)}>
              {c}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Delivery Mode" last>
          {DELIVERY_MODES.map((m) => (
            <Chip
              key={m.value}
              active={activeModes.includes(m.value)}
              onClick={() => toggleMode(m.value)}
              dot={MODE_DOT[m.value]}
            >
              {m.label}
            </Chip>
          ))}
        </FilterGroup>
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl font-semibold">
          Program Offerings <span className="text-stone-400 font-normal">({visiblePrograms.length})</span>
        </h2>
      </div>

      {visiblePrograms.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-200 rounded-xl py-16 text-center">
          <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <div className="font-display text-lg font-semibold mb-1">No matching programs</div>
          <div className="text-sm text-stone-500 mb-3">Try adjusting your filters.</div>
          {anyActive && (
            <button onClick={reset} className="text-sm bg-stone-900 text-white rounded-md px-3 py-1.5">
              Reset filters
            </button>
          )}
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePrograms.map((p) => (
            <ProgramCard key={p.id} program={p} activeDegrees={activeDegrees} activeModes={activeModes} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePrograms.map((p) => (
            <ProgramListItem key={p.id} program={p} activeDegrees={activeDegrees} activeModes={activeModes} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, children, last }) {
  return (
    <div className={`pt-4 ${last ? '' : 'border-b border-stone-100 pb-4'}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children, dot }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition ${
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
      }`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {children}
      {active && <X className="w-3 h-3 -mr-0.5" />}
    </button>
  )
}

function ProgramCard({ program, activeDegrees, activeModes }) {
  return (
    <article className="card-hover bg-white border border-stone-200 rounded-xl flex flex-col overflow-hidden">
      {program.image ? (
        <div className="aspect-[16/9] bg-stone-100 overflow-hidden">
          <img
            src={program.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
          />
        </div>
      ) : null}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">
          {program.category || 'Uncategorized'}
        </div>
        <h3 className="font-display text-xl font-semibold leading-snug mb-2">{program.title}</h3>
        {program.description && (
          <p className="text-sm text-stone-600 leading-relaxed mb-4 line-clamp-3">{program.description}</p>
        )}
        <div className="mt-auto pt-3 border-t border-stone-100 space-y-1.5">
          {program.degrees.map((d) => {
            const dimmed =
              (activeDegrees.length && !activeDegrees.includes(d.degreeCategory)) ||
              (activeModes.length && !activeModes.includes(d.deliveryMode))
            const degreeLabel = d.degreeCategory
              ? d.type ? `${d.degreeCategory} · ${d.type}` : d.degreeCategory
              : d.type
            return (
              <div key={d.id} className={`flex items-center gap-2 text-sm ${dimmed ? 'opacity-40' : ''}`}>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border ${MODE_TINT[d.deliveryMode]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[d.deliveryMode]}`} />
                  {MODE_LABEL[d.deliveryMode]}
                </span>
                <span className="text-stone-800">{degreeLabel}</span>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-stone-400 hover:text-stone-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )
          })}
          {program.degrees.length === 0 && (
            <div className="text-xs text-stone-400 italic">No offerings yet</div>
          )}
        </div>
      </div>
    </article>
  )
}

function ProgramListItem({ program, activeDegrees, activeModes }) {
  return (
    <article className="card-hover bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col sm:flex-row">
      <div className="w-full sm:w-44 sm:flex-shrink-0 bg-stone-100 aspect-[16/9] sm:aspect-auto">
        {program.image ? (
          <img
            src={program.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center min-h-[120px]">
            <ImageIcon className="w-6 h-6 text-stone-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 p-5">
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">
          {program.category || 'Uncategorized'}
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug mb-1.5">{program.title}</h3>
        {program.description && (
          <p className="text-sm text-stone-600 leading-relaxed mb-3 line-clamp-2">{program.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {program.degrees.map((d) => {
            const dimmed =
              (activeDegrees.length && !activeDegrees.includes(d.degreeCategory)) ||
              (activeModes.length && !activeModes.includes(d.deliveryMode))
            const Tag = d.url ? 'a' : 'span'
            const linkProps = d.url ? { href: d.url, target: '_blank', rel: 'noreferrer' } : {}
            const degreeLabel = d.degreeCategory
              ? d.type ? `${d.degreeCategory} · ${d.type}` : d.degreeCategory
              : d.type
            return (
              <Tag
                key={d.id}
                {...linkProps}
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${MODE_TINT[d.deliveryMode]} ${
                  dimmed ? 'opacity-30' : ''
                } ${d.url ? 'hover:shadow-sm transition cursor-pointer' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[d.deliveryMode]}`} />
                <span className="font-medium">{degreeLabel}</span>
                <span className="opacity-50">·</span>
                <span>{MODE_LABEL[d.deliveryMode]}</span>
              </Tag>
            )
          })}
          {program.degrees.length === 0 && (
            <div className="text-xs text-stone-400 italic">No offerings yet</div>
          )}
        </div>
      </div>
    </article>
  )
}
