import { useMemo, useState, FormEvent } from 'react';
import { Search, X, Pencil, Trash2, Plus } from 'lucide-react';
import { useTechnologies } from '../../context/TechnologyContext';
import { Technology } from '../../types';
import strings from '../ui/strings';
import '../modals/Modal.css';
import './TechnologiesAdminPage.css';

const CATEGORIES = Object.keys(strings.technologiesAdmin.categories) as Technology['category'][];

const emptyForm = (): Pick<Technology, 'name' | 'category' | 'color'> => ({
  name: '', category: 'language', color: '#2563eb',
});

const TechnologiesAdminPage: React.FC = () => {
  const { technologies, loading, addTechnology, updateTechnology, deleteTechnology } = useTechnologies();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return technologies;
    return technologies.filter(t =>
      t.name.toLowerCase().includes(q) ||
      strings.technologiesAdmin.categories[t.category].toLowerCase().includes(q)
    );
  }, [technologies, search]);

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setShowAdd(false); setError(''); };

  const startEdit = (tech: Technology) => {
    setEditingId(tech.id);
    setShowAdd(false);
    setForm({ name: tech.name, category: tech.category, color: tech.color });
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    const result = editingId
      ? await updateTechnology(editingId, form)
      : await addTechnology(form);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? strings.technologiesAdmin.saveError);
      return;
    }
    resetForm();
  };

  const handleDelete = async (tech: Technology) => {
    if (!window.confirm(`${strings.technologiesAdmin.confirmDelete}\n\n“${tech.name}”`)) return;
    setError('');
    const result = await deleteTechnology(tech.id);
    if (!result.success) setError(result.error ?? strings.technologiesAdmin.deleteError);
    if (editingId === tech.id) resetForm();
  };

  if (loading) {
    return (
      <div className="tech-admin-page">
        <p className="tech-admin-muted">{strings.technologiesAdmin.loading}</p>
      </div>
    );
  }

  return (
    <div className="tech-admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.technologiesAdmin.title}</h1>
          <p className="page-subtitle">{strings.technologiesAdmin.subtitle}</p>
        </div>
        {!showAdd && !editingId && (
          <button type="button" className="btn-primary" onClick={() => { setShowAdd(true); setForm(emptyForm()); setError(''); }}>
            <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {strings.technologiesAdmin.add}
          </button>
        )}
      </div>

      <div className="tech-admin-toolbar">
        <div className="tech-admin-search-wrap">
          <Search size={15} className="tech-admin-search-icon" />
          <input
            type="text"
            className="tech-admin-search-input"
            placeholder={strings.technologiesAdmin.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="tech-admin-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {(showAdd || editingId) && (
        <form className="tech-admin-form" onSubmit={handleSubmit}>
          <h3 className="tech-admin-form-title">
            {editingId ? strings.technologiesAdmin.editTitle : strings.technologiesAdmin.addTitle}
          </h3>
          <div className="tech-admin-form-grid">
            <div className="form-group">
              <label>{strings.technologiesAdmin.colName}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={strings.technologiesAdmin.namePlaceholder}
                required
              />
            </div>
            <div className="form-group">
              <label>{strings.technologiesAdmin.colCategory}</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Technology['category'] }))}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{strings.technologiesAdmin.categories[cat]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{strings.technologiesAdmin.colColor}</label>
              <div className="tech-admin-color-row">
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} pattern="^#[0-9A-Fa-f]{6}$" />
              </div>
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <div className="tech-admin-form-actions">
            <button type="button" className="btn-cancel" onClick={resetForm}>{strings.modal.cancel}</button>
            <button type="submit" className="btn-primary" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : (editingId ? strings.technologiesAdmin.save : strings.technologiesAdmin.add)}
            </button>
          </div>
        </form>
      )}

      {error && !showAdd && !editingId && <div className="login-error">{error}</div>}

      <div className="tech-admin-table-wrap">
        <table className="tech-admin-table">
          <thead>
            <tr>
              <th>{strings.technologiesAdmin.colName}</th>
              <th>{strings.technologiesAdmin.colCategory}</th>
              <th>{strings.technologiesAdmin.colColor}</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="tech-admin-empty">{strings.technologiesAdmin.noMatch}</td></tr>
            ) : (
              filtered.map(tech => (
                <tr key={tech.id} className={editingId === tech.id ? 'tech-admin-row--active' : ''}>
                  <td><strong>{tech.name}</strong></td>
                  <td>{strings.technologiesAdmin.categories[tech.category]}</td>
                  <td>
                    <span className="tech-admin-swatch" style={{ background: tech.color }} />
                    <span className="tech-admin-hex">{tech.color}</span>
                  </td>
                  <td className="tech-admin-actions">
                    <button type="button" className="tech-admin-icon-btn" onClick={() => startEdit(tech)} title={strings.technologiesAdmin.editTitle}>
                      <Pencil size={13} />
                    </button>
                    <button type="button" className="tech-admin-icon-btn tech-admin-icon-btn--danger" onClick={() => handleDelete(tech)} title={strings.technologiesAdmin.delete}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TechnologiesAdminPage;
