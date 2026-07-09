import { Button, Switch, Toast } from '@douyinfe/semi-ui';
import type { CSSProperties } from 'react';
import { rollupOptions } from '../lib/defaults';
import type { DataRange, FieldMeta, FormState, TableMeta, ValueSourceForm } from '../types/dashboard';

interface ConfigPanelProps {
  form: FormState;
  tables: TableMeta[];
  currentFields: FieldMeta[];
  targetFields: FieldMeta[];
  currentRanges: DataRange[];
  targetRanges: DataRange[];
  saving: boolean;
  onChange: (next: FormState) => void;
  onSave: () => Promise<void>;
}

const palette = ['#25A8FF', '#4E7BFF', '#22B8A7', '#FFB020', '#7B61FF'];
const fieldRollupOptions = rollupOptions.filter((option) => option.value !== 'COUNTA');

function rangeLabel(range: DataRange) {
  if (range.type === 'ALL') {
    return '全部数据';
  }

  return range.viewName ? `视图：${range.viewName}` : range.type;
}

function rangeKey(range: DataRange) {
  if (range.type === 'VIEW' && range.viewId) {
    return `VIEW:${range.viewId}`;
  }

  return range.type;
}

interface SourceSectionProps {
  title: string;
  source: ValueSourceForm;
  tables: TableMeta[];
  fields: FieldMeta[];
  ranges: DataRange[];
  onChange: (next: ValueSourceForm) => void;
}

function SourceSection({ title, source, tables, fields, ranges, onChange }: SourceSectionProps) {
  const update = <Key extends keyof ValueSourceForm>(key: Key, value: ValueSourceForm[Key]) => {
    onChange({
      ...source,
      [key]: value,
      ...(key === 'tableId' ? { fieldId: '', dataRangeKey: 'ALL' } : {}),
      ...(key === 'valueMode' && value === 'COUNT' ? { fieldId: '' } : {}),
    });
  };

  return (
    <div className="panel-section source-section">
      <h2>{title}</h2>

      <label className="field">
        <span>数据表</span>
        <select value={source.tableId} onChange={(event) => update('tableId', event.target.value)}>
          <option value="">请选择数据表</option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              {table.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>数据范围</span>
        <select value={source.dataRangeKey} onChange={(event) => update('dataRangeKey', event.target.value)}>
          {ranges.map((range) => (
            <option key={rangeKey(range)} value={rangeKey(range)}>
              {rangeLabel(range)}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>数值</span>
        <div className="metric-box">
          <select value={source.valueMode} onChange={(event) => update('valueMode', event.target.value as ValueSourceForm['valueMode'])}>
            <option value="COUNT">统计记录总数</option>
            <option value="FIELD">统计字段数值</option>
          </select>

          {source.valueMode === 'FIELD' ? (
            <div className="metric-row">
              <select className="metric-field" value={source.fieldId} onChange={(event) => update('fieldId', event.target.value)}>
                <option value="">请选择字段</option>
                {fields.map((field) => (
                  <option key={field.fieldId} value={field.fieldId}>
                    # {field.fieldName}
                  </option>
                ))}
              </select>
              <select className="metric-rollup" value={source.rollup} onChange={(event) => update('rollup', event.target.value as ValueSourceForm['rollup'])}>
                {fieldRollupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ConfigPanel({
  form,
  tables,
  currentFields,
  targetFields,
  currentRanges,
  targetRanges,
  saving,
  onChange,
  onSave,
}: ConfigPanelProps) {
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    onChange({
      ...form,
      [key]: value,
    });
  };

  const handleSave = async () => {
    const currentReady = form.current.tableId && (form.current.valueMode === 'COUNT' || form.current.fieldId);
    const targetReady = form.target.tableId && (form.target.valueMode === 'COUNT' || form.target.fieldId);

    if (!currentReady || !targetReady) {
      Toast.warning('请先完成当前值和目标值的数据配置');
      return;
    }

    await onSave();
  };

  return (
    <aside className="config-panel">
      <div className="config-scroll">
        <SourceSection
          title="目标值"
          source={form.target}
          tables={tables}
          fields={targetFields}
          ranges={targetRanges}
          onChange={(target) => update('target', target)}
        />

        <SourceSection
          title="当前值"
          source={form.current}
          tables={tables}
          fields={currentFields}
          ranges={currentRanges}
          onChange={(current) => update('current', current)}
        />

        <div className="panel-section">
          <h2>数字格式</h2>

          <label className="field">
            <span>标题</span>
            <input value={form.title} onChange={(event) => update('title', event.target.value)} />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>当前标签</span>
              <input value={form.currentLabel} onChange={(event) => update('currentLabel', event.target.value)} />
            </label>
            <label className="field">
              <span>目标标签</span>
              <input value={form.targetLabel} onChange={(event) => update('targetLabel', event.target.value)} />
            </label>
          </div>

          <div className="field">
            <span>主题色</span>
            <div className="palette" role="list">
              {palette.map((color) => (
                <button
                  key={color}
                  aria-label={`选择颜色 ${color}`}
                  className={`swatch ${form.accentColor === color ? 'is-active' : ''}`}
                  style={{ '--swatch': color } as CSSProperties}
                  type="button"
                  onClick={() => update('accentColor', color)}
                />
              ))}
            </div>
          </div>

          <label className="switch-row">
            <span>显示当前与目标</span>
            <Switch checked={form.showDetail} onChange={(checked) => update('showDetail', checked)} />
          </label>
        </div>
      </div>

      <footer className="config-actions">
        <Button theme="solid" type="primary" loading={saving} onClick={handleSave}>
          确定
        </Button>
      </footer>
    </aside>
  );
}
