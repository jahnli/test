import { Button, Switch, Toast } from '@douyinfe/semi-ui';
import type { CSSProperties } from 'react';
import { rollupOptions } from '../lib/defaults';
import type { DataRange, FieldMeta, FormState, TableMeta } from '../types/dashboard';

interface ConfigPanelProps {
  form: FormState;
  tables: TableMeta[];
  fields: FieldMeta[];
  ranges: DataRange[];
  saving: boolean;
  onChange: (next: FormState) => void;
  onSave: () => Promise<void>;
}

const palette = ['#25A8FF', '#4E7BFF', '#22B8A7', '#FFB020', '#7B61FF'];

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

export function ConfigPanel({ form, tables, fields, ranges, saving, onChange, onSave }: ConfigPanelProps) {
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    onChange({
      ...form,
      [key]: value,
    });
  };

  const handleSave = async () => {
    if (!form.tableId || !form.currentFieldId || !form.targetFieldId) {
      Toast.warning('请先选择数据表、当前字段和目标字段');
      return;
    }

    await onSave();
  };

  return (
    <aside className="config-panel">
      <div className="config-scroll">
        <div className="panel-section">
          <h2>类型与数据</h2>

          <label className="field">
            <span>数据表</span>
            <select value={form.tableId} onChange={(event) => update('tableId', event.target.value)}>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>数据范围</span>
            <select value={form.dataRangeKey} onChange={(event) => update('dataRangeKey', event.target.value)}>
              {ranges.map((range) => (
                <option key={rangeKey(range)} value={rangeKey(range)}>
                  {rangeLabel(range)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>当前字段</span>
            <select value={form.currentFieldId} onChange={(event) => update('currentFieldId', event.target.value)}>
              <option value="">请选择字段</option>
              {fields.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>目标字段</span>
            <select value={form.targetFieldId} onChange={(event) => update('targetFieldId', event.target.value)}>
              <option value="">请选择字段</option>
              {fields.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>聚合方式</span>
            <select value={form.rollup} onChange={(event) => update('rollup', event.target.value as FormState['rollup'])}>
              {rollupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="panel-section">
          <h2>自定义样式</h2>

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
