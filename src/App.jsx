import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, Trash2, X, MapPin, Globe, Layers,
  GraduationCap, RotateCcw, Check, ChevronRight,
  AlertCircle, BookOpen, Filter, Eye, PencilLine, ExternalLink,
  Archive, FileText, LayoutGrid, List, Image as ImageIcon,
} from 'lucide-react'
import { SEED_PROGRAMS, DEFAULT_CATEGORIES } from './data.js'

/* ============================================================================
   Constants
============================================================================ */

const DEGREE_TYPES_PRESET = [
  'Certificate', 'Minor', 'Undergraduate Minor', 'Graduate Minor',
  'B.A.', 'B.A.E.',
  'M.A.', 'M.A.E.', 'M.Ed.',
  'Ed.S.', 'Ed.D.', 'Ph.D.',
  'Reading Endorsement', 'EdTech 4+1',
]

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
          : { ...p, degrees: [...p.degrees, { id: genId(), type: 'M.Ed.', deliveryMode: 'on-campus', url: '' }] }
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
  addProgram, updateProgram, deleteProgram,
  addDegree, updateDegree, removeDegree, addCategory,
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return programs
    return programs.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [programs, search])

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-12 gap-6" style={{ minHeight: 'calc(100vh - 6.5rem)' }}>
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div
            className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 7.5rem)' }}
          >
            <div className="p-3 border-b border-stone-200 space-y-2">
              <button
                onClick={addProgram}
                className="w-full flex items-center justify-center gap-1.5 bg-stone-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-stone-800 transition"
              >
                <Plus className="w-4 h-4" /> New Program
              </button>
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
                  onSelect={() => setSelectedId(p.id)}
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
              addDegree={addDegree}
              updateDegree={updateDegree}
              removeDegree={removeDegree}
              addCategory={addCategory}
            />
          ) : (
            <EmptyEditor onAdd={addProgram} />
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
        <div className="flex items-center gap-1 mt-1.5">
          {program.degrees.slice(0, 6).map((d) => (
            <span
              key={d.id}
              className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[d.deliveryMode]}`}
              title={`${d.type} · ${MODE_LABEL[d.deliveryMode]}`}
            />
          ))}
          {program.degrees.length > 6 && (
            <span className="text-[10px] text-stone-400">+{program.degrees.length - 6}</span>
          )}
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

function Editor({ program, categories, updateProgram, deleteProgram, addDegree, updateDegree, removeDegree, addCategory }) {
  const [showCategoryAdd, setShowCategoryAdd] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white border border-stone-200 rounded-xl anim-fade-up">
      <div class="px-7 py-6 space-y-7">
         <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 select-none pt-1">
          <span className="text-[10px] uppercase tracking-wider text-stone-500">Status</span>
          <div className="flex bg-stone-100 rounded-md p-0.5">
            {STATUS_OPTIONS.map((s) => {
              const meta = STATUS_META[s]
              const active = program.status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateProgram(program.id, { status: s })}
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
            value={program.title}
            onChange={(e) => updateProgram(program.id, { title: e.target.value })}
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
                  value={program.category}
                  onChange={(e) => updateProgram(program.id, { category: e.target.value })}
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
                        if (newCat.trim()) updateProgram(program.id, { category: newCat.trim() })
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
                      if (newCat.trim()) updateProgram(program.id, { category: newCat.trim() })
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
                value={program.description}
                onChange={(e) => updateProgram(program.id, { description: e.target.value })}
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
                value={program.image || ''}
                onChange={(e) => updateProgram(program.id, { image: e.target.value })}
                placeholder="https://education.ufl.edu/program-directory/files/…"
                className="input-base flex-1 text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
              />
              <div className="w-28 h-16 rounded-md border border-stone-200 bg-stone-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {program.image ? (
                  <img
                    src={program.image}
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
              {program.degrees.length} offering{program.degrees.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-3">
            Each offering pairs a degree type with a delivery mode. Filters on the public site read from this list.
          </p>

          <div className="space-y-2">
            {program.degrees.map((d) => (
              <DegreeRow
                key={d.id}
                degree={d}
                onChange={(patch) => updateDegree(program.id, d.id, patch)}
                onRemove={() => removeDegree(program.id, d.id)}
              />
            ))}
            {program.degrees.length === 0 && (
              <div className="text-sm text-stone-500 border border-dashed border-stone-200 rounded-lg py-6 text-center bg-stone-50/60">
                No offerings yet. Add a degree below.
              </div>
            )}
          </div>

          <button
            onClick={() => addDegree(program.id)}
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
        <div className="text-xs text-stone-400 font-mono">{program.id}</div>
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
  return (
    <div className="border border-stone-200 rounded-lg bg-white overflow-hidden">
      <div className="grid grid-cols-12 gap-3 p-3 items-center">
        <div className="col-span-12 md:col-span-3">
          <FieldLabel>Degree type</FieldLabel>
          <input
            list="degree-types"
            value={degree.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="input-base w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
          />
          <datalist id="degree-types">
            {DEGREE_TYPES_PRESET.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="col-span-12 md:col-span-4">
          <FieldLabel>Delivery mode</FieldLabel>
          <div className="flex bg-stone-100 rounded-md p-0.5">
            {DELIVERY_MODES.map((m) => {
              const active = degree.deliveryMode === m.value
              return (
                <button
                  key={m.value}
                  onClick={() => onChange({ deliveryMode: m.value })}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded transition ${
                    active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[m.value]}`} />
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="col-span-11 md:col-span-4">
          <FieldLabel>Program URL</FieldLabel>
          <input
            value={degree.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://education.ufl.edu/…"
            className="input-base w-full text-sm border border-stone-200 rounded-md px-2.5 py-2 bg-white"
          />
        </div>

        <div className="col-span-1 flex items-end justify-end pb-0.5">
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
    programs.forEach((p) => p.degrees.forEach((d) => set.add(d.type)))
    return Array.from(set).sort()
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
            (!activeDegrees.length || activeDegrees.includes(d.type)) &&
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
              (activeDegrees.length && !activeDegrees.includes(d.type)) ||
              (activeModes.length && !activeModes.includes(d.deliveryMode))
            return (
              <div key={d.id} className={`flex items-center gap-2 text-sm ${dimmed ? 'opacity-40' : ''}`}>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border ${MODE_TINT[d.deliveryMode]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[d.deliveryMode]}`} />
                  {MODE_LABEL[d.deliveryMode]}
                </span>
                <span className="text-stone-800">{d.type}</span>
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
              (activeDegrees.length && !activeDegrees.includes(d.type)) ||
              (activeModes.length && !activeModes.includes(d.deliveryMode))
            const Tag = d.url ? 'a' : 'span'
            const linkProps = d.url ? { href: d.url, target: '_blank', rel: 'noreferrer' } : {}
            return (
              <Tag
                key={d.id}
                {...linkProps}
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${MODE_TINT[d.deliveryMode]} ${
                  dimmed ? 'opacity-30' : ''
                } ${d.url ? 'hover:shadow-sm transition cursor-pointer' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[d.deliveryMode]}`} />
                <span className="font-medium">{d.type}</span>
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
