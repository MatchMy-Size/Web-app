import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FiArchive, FiEdit3, FiGrid, FiPlus, FiSearch, FiSliders, FiTrash2, FiX } from 'react-icons/fi';

import {
  archiveSellerSizeChart,
  createSellerSizeChart,
  getSellerSizeCharts,
  updateSellerSizeChart,
  type SaveSellerSizeChart,
  type SellerSizeChart,
} from '@/lib/seller-api';
import '@/seller-portal.css';

type Department = 'MEN' | 'WOMEN' | 'CHILDREN' | 'UNISEX';
type Unit = 'cm' | 'in';
type FormRow = { catalogId?: string; sizeLabel: string; measurements: Record<string, string> };

const departmentLabels: Record<Department, string> = { MEN: 'Men', WOMEN: 'Women', CHILDREN: 'Children', UNISEX: 'Unisex' };
const categoryOptions: Record<Department, { value: string; label: string }[]> = {
  MEN: [{ value: 'shirt', label: 'Shirt' }, { value: 'tshirt', label: 'T-shirt' }, { value: 'trouser', label: 'Trouser' }, { value: 'short', label: 'Short' }],
  WOMEN: [{ value: 'blouse', label: 'Blouse' }, { value: 'tshirt', label: 'T-shirt' }, { value: 'trouser', label: 'Trouser' }, { value: 'short', label: 'Short' }, { value: 'dress', label: 'Dress' }],
  CHILDREN: [{ value: 'shirt', label: 'Shirt' }, { value: 'tshirt', label: 'T-shirt' }, { value: 'trouser', label: 'Trouser' }, { value: 'short', label: 'Short' }, { value: 'dress', label: 'Dress' }],
  UNISEX: [{ value: 'shirt', label: 'Shirt' }, { value: 'tshirt', label: 'T-shirt' }],
};

const specs: Record<string, { keys: string[]; primary: string[] }> = {
  'MEN:shirt': { keys: ['neck', 'chest', 'sleeve', 'shoulder'], primary: ['neck'] },
  'MEN:tshirt': { keys: ['chest', 'length', 'shoulder'], primary: ['chest'] },
  'MEN:trouser': { keys: ['waist', 'inseam', 'outseam'], primary: ['waist'] },
  'MEN:short': { keys: ['waist', 'inseam'], primary: ['waist'] },
  'WOMEN:blouse': { keys: ['bust', 'length', 'shoulder', 'waist'], primary: ['bust'] },
  'WOMEN:tshirt': { keys: ['bust', 'length', 'shoulder', 'waist'], primary: ['bust'] },
  'WOMEN:trouser': { keys: ['waist', 'hip', 'thigh', 'inseam', 'outseam'], primary: ['waist'] },
  'WOMEN:short': { keys: ['waist', 'hip', 'thigh', 'inseam'], primary: ['waist'] },
  'WOMEN:dress': { keys: ['bust', 'shoulder', 'waist', 'length'], primary: ['bust'] },
  'CHILDREN:shirt': { keys: ['chest', 'length', 'sleeve', 'shoulder'], primary: ['chest'] },
  'CHILDREN:tshirt': { keys: ['chest', 'length', 'shoulder'], primary: ['chest'] },
  'CHILDREN:trouser': { keys: ['waist', 'hip', 'inseam', 'outseam'], primary: ['waist'] },
  'CHILDREN:short': { keys: ['waist', 'hip', 'inseam'], primary: ['waist'] },
  'CHILDREN:dress': { keys: ['chest', 'waist', 'length'], primary: ['chest'] },
  'UNISEX:shirt': { keys: ['neck', 'chest', 'sleeve', 'shoulder'], primary: ['chest'] },
  'UNISEX:tshirt': { keys: ['chest', 'length', 'shoulder'], primary: ['chest'] },
};

const titleCase = (value: string) => value.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
const newRows = (): FormRow[] => ['S', 'M', 'L', 'XL'].map(sizeLabel => ({ sizeLabel, measurements: {} }));

export function SellerCategoriesPage() {
  const [charts, setCharts] = useState<SellerSizeChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | Department>('ALL');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SellerSizeChart | 'new' | null>(null);

  const load = async () => {
    try { setLoading(true); setError(''); setCharts(await getSellerSizeCharts()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load size charts.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => charts.filter(chart => {
    const departmentMatch = filter === 'ALL' || chart.department === filter;
    const query = search.trim().toLowerCase();
    return departmentMatch && (!query || `${chart.brandName} ${chart.mainCategory} ${chart.subcategory || ''}`.toLowerCase().includes(query));
  }), [charts, filter, search]);

  const archive = async (chart: SellerSizeChart) => {
    if (!window.confirm(`Archive the ${chart.mainCategory} size chart? It will stop appearing in customer recommendations.`)) return;
    try { await archiveSellerSizeChart(chart.id); setCharts(current => current.filter(item => item.id !== chart.id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not archive size chart.'); }
  };

  return (
    <main className="seller-page">
      <header className="seller-page-header">
        <div><p className="seller-kicker">Catalog measurements</p><h1>Size chart <em>management.</em></h1><p>Add clothing categories and publish the exact measurements customers are matched against.</p></div>
        <button className="seller-primary-button compact" type="button" onClick={() => setEditing('new')}><FiPlus /> Add new chart</button>
      </header>

      <section className="seller-toolbar">
        <div className="seller-filter-tabs">
          {(['ALL', 'MEN', 'WOMEN', 'CHILDREN', 'UNISEX'] as const).map(value => <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'ALL' ? 'All' : departmentLabels[value]} <span>{value === 'ALL' ? charts.length : charts.filter(chart => chart.department === value).length}</span></button>)}
        </div>
        <label className="seller-search"><FiSearch /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search charts…" /></label>
      </section>

      {error && <div className="seller-form-error seller-page-error">{error}</div>}
      {loading ? <div className="seller-loading"><span /><p>Loading size charts…</p></div> : filtered.length ? (
        <section className="seller-chart-grid">
          {filtered.map(chart => (
            <article className="seller-chart-card" key={chart.id}>
              <div className="seller-chart-card-top"><span className="seller-chart-icon"><FiSliders /></span><span className="seller-chart-department">{departmentLabels[chart.department]}</span></div>
              <div><p className="seller-kicker">{chart.brandName}</p><h2>{titleCase(chart.mainCategory)}</h2><p>{chart.subcategory || 'Standard fit'} · {chart.measurementBasis === 'GARMENT' ? 'Garment measurements' : 'Body measurements'}</p></div>
              <div className="seller-size-pills">{chart.sizes.map(size => <span key={size.catalogId || size.sizeLabel}>{size.sizeLabel}</span>)}</div>
              <div className="seller-chart-measures">{chart.measurementKeys.map(key => <span key={key}>{titleCase(key)}</span>)}</div>
              <footer><span>{chart.sizes.length} size{chart.sizes.length === 1 ? '' : 's'} · Stored in cm</span><div><button type="button" onClick={() => setEditing(chart)} title="Edit chart"><FiEdit3 /></button><button className="danger" type="button" onClick={() => void archive(chart)} title="Archive chart"><FiArchive /></button></div></footer>
            </article>
          ))}
        </section>
      ) : (
        <section className="seller-empty"><span><FiGrid /></span><h2>{charts.length ? 'No matching charts' : 'Create your first size chart'}</h2><p>{charts.length ? 'Try another search or department filter.' : 'Add a clothing category, its available sizes, and the measurements used for matching.'}</p>{!charts.length && <button className="seller-primary-button compact" type="button" onClick={() => setEditing('new')}><FiPlus /> Create size chart</button>}</section>
      )}

      {editing && <SizeChartModal chart={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={saved => { setCharts(current => editing === 'new' ? [...current, saved] : current.map(item => item.id === saved.id ? saved : item)); setEditing(null); }} />}
    </main>
  );
}

function SizeChartModal({ chart, onClose, onSaved }: { chart?: SellerSizeChart; onClose: () => void; onSaved: (chart: SellerSizeChart) => void }) {
  const initialDepartment = chart?.department || 'MEN';
  const initialCategory = chart?.mainCategory || categoryOptions[initialDepartment][0].value;
  const [department, setDepartment] = useState<Department>(initialDepartment);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(chart?.subcategory || '');
  const [unit, setUnit] = useState<Unit>('cm');
  const [basis, setBasis] = useState<'BODY' | 'GARMENT'>(chart?.measurementBasis || 'BODY');
  const [rows, setRows] = useState<FormRow[]>(chart?.sizes.map(size => ({ catalogId: size.catalogId, sizeLabel: size.sizeLabel, measurements: Object.fromEntries(Object.entries(size.measurements).map(([key, value]) => [key, String(value)])) })) || newRows());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const spec = specs[`${department}:${category}`] || { keys: chart?.measurementKeys || [], primary: chart?.primaryMeasurementKeys || [] };

  const changeDepartment = (next: Department) => {
    const nextCategory = categoryOptions[next][0].value;
    setDepartment(next); setCategory(nextCategory); setRows(current => current.map(row => ({ ...row, measurements: {} })));
  };
  const changeCategory = (next: string) => { setCategory(next); setRows(current => current.map(row => ({ ...row, measurements: {} }))); };
  const changeUnit = (next: Unit) => {
    if (next === unit) return;
    const factor = next === 'in' ? 1 / 2.54 : 2.54;
    setRows(current => current.map(row => ({ ...row, measurements: Object.fromEntries(Object.entries(row.measurements).map(([key, value]) => {
      const numeric = Number(value); return [key, Number.isFinite(numeric) && value !== '' ? String(Number((numeric * factor).toFixed(2))) : value];
    })) })));
    setUnit(next);
  };
  const updateRow = (index: number, changes: Partial<FormRow>) => setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row));
  const updateMeasurement = (rowIndex: number, key: string, value: string) => setRows(current => current.map((row, index) => index === rowIndex ? { ...row, measurements: { ...row.measurements, [key]: value } } : row));

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!rows.length) return setError('Add at least one size row.');
    for (const row of rows) {
      if (!row.sizeLabel.trim()) return setError('Every row needs a size label.');
      if (!spec.primary.some(key => Number(row.measurements[key]) > 0)) return setError(`Size ${row.sizeLabel} needs a ${spec.primary.map(titleCase).join(' or ')} measurement.`);
    }
    const payload: SaveSellerSizeChart = {
      department, mainCategory: category, subcategory: subcategory.trim(), unit, measurementBasis: basis,
      sizes: rows.map((row, index) => ({ catalogId: row.catalogId, sizeLabel: row.sizeLabel.trim(), sizeKey: index + 1, measurements: Object.fromEntries(Object.entries(row.measurements).filter(([, value]) => value !== '' && Number(value) > 0).map(([key, value]) => [key, Number(value)])) })),
    };
    try {
      setSaving(true);
      onSaved(chart ? await updateSellerSizeChart(chart.id, payload) : await createSellerSizeChart(payload));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save size chart.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="seller-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="seller-modal seller-chart-modal" role="dialog" aria-modal="true" aria-labelledby="chart-modal-title">
        <header><div><p className="seller-kicker">{chart ? 'Update measurements' : 'New clothing category'}</p><h2 id="chart-modal-title">{chart ? `Edit ${titleCase(chart.mainCategory)} chart` : 'Create size chart'}</h2></div><button type="button" onClick={onClose} aria-label="Close"><FiX /></button></header>
        <form onSubmit={submit}>
          <div className="seller-modal-scroll">
            <section className="seller-form-section"><div className="seller-section-heading"><h3>Chart details</h3><p>Define who and what this chart applies to.</p></div><div className="seller-form-grid">
              <label><span>Department</span><select value={department} onChange={event => changeDepartment(event.target.value as Department)} disabled={Boolean(chart)}>{(Object.keys(departmentLabels) as Department[]).map(value => <option value={value} key={value}>{departmentLabels[value]}</option>)}</select></label>
              <label><span>Clothing category</span><select value={category} onChange={event => changeCategory(event.target.value)} disabled={Boolean(chart)}>{categoryOptions[department].map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
              <label><span>Fit / product line <small>Optional</small></span><input value={subcategory} onChange={event => setSubcategory(event.target.value)} placeholder="e.g. Slim fit, Formal, Core line" /></label>
              <label><span>Input unit</span><select value={unit} onChange={event => changeUnit(event.target.value as Unit)}><option value="cm">Centimetres (cm)</option><option value="in">Inches (in)</option></select></label>
              <label className="seller-grid-wide"><span>Measurement basis</span><div className="seller-segmented"><button type="button" className={basis === 'BODY' ? 'active' : ''} onClick={() => setBasis('BODY')}><strong>Body measurements</strong><small>Chart describes the wearer</small></button><button type="button" className={basis === 'GARMENT' ? 'active' : ''} onClick={() => setBasis('GARMENT')}><strong>Garment measurements</strong><small>Chart includes clothing ease</small></button></div></label>
            </div></section>

            <section className="seller-form-section"><div className="seller-section-heading chart"><div><h3>Size measurements</h3><p>Enter values in {unit === 'cm' ? 'centimetres' : 'inches'}. They will be stored in centimetres.</p></div><button type="button" className="seller-secondary-button small" onClick={() => setRows(current => [...current, { sizeLabel: '', measurements: {} }])}><FiPlus /> Add size</button></div>
              <div className="seller-size-table-wrap"><table className="seller-size-table"><thead><tr><th>Size</th>{spec.keys.map(key => <th key={key}>{titleCase(key)} {spec.primary.includes(key) && <b>*</b>}<small>{unit}</small></th>)}<th aria-label="Actions" /></tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row.catalogId || 'new'}-${rowIndex}`}><td><input value={row.sizeLabel} onChange={event => updateRow(rowIndex, { sizeLabel: event.target.value })} placeholder="e.g. M" /></td>{spec.keys.map(key => <td key={key}><input type="number" min="0" step="0.01" value={row.measurements[key] || ''} onChange={event => updateMeasurement(rowIndex, key, event.target.value)} placeholder="—" /></td>)}<td><button type="button" className="seller-remove-row" onClick={() => setRows(current => current.filter((_, index) => index !== rowIndex))} disabled={rows.length === 1} title="Remove size"><FiTrash2 /></button></td></tr>)}</tbody></table></div>
              <p className="seller-table-note"><b>*</b> Primary measurement required for every size. Empty optional fields are allowed.</p>
            </section>
            {error && <div className="seller-form-error">{error}</div>}
          </div>
          <footer><button type="button" className="seller-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="seller-primary-button compact" disabled={saving}>{saving ? 'Saving chart…' : chart ? 'Save chart changes' : 'Publish size chart'}</button></footer>
        </form>
      </section>
    </div>
  );
}
