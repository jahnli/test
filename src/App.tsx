import { useEffect, useMemo, useState } from 'react';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { ConfigPanel } from './components/ConfigPanel';
import { GaugeChart } from './components/GaugeChart';
import { configToForm, formToConfig } from './lib/config';
import { dataToGaugeDatum } from './lib/completion';
import { defaultCustomConfig, defaultFormState, emptyData } from './lib/defaults';
import {
  getConfig,
  getDashboardState,
  getData,
  getFields,
  getPreviewData,
  getRanges,
  getTables,
  onConfigChange,
  onDataChange,
  saveConfig,
} from './lib/sdk';
import type { DashboardData, DashboardState, DataRange, FieldMeta, FormState, TableMeta } from './types/dashboard';
import './styles.css';

const configurableStates: DashboardState[] = ['Create', 'Config'];

export default function App() {
  const [dashboardState] = useState<DashboardState>(() => getDashboardState());
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [ranges, setRanges] = useState<DataRange[]>([{ type: 'ALL' }]);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isConfigurable = configurableStates.includes(dashboardState);
  const isFullScreen = dashboardState === 'FullScreen';

  const chartConfig = useMemo(
    () => ({
      ...defaultCustomConfig,
      title: form.title,
      currentLabel: form.currentLabel,
      targetLabel: form.targetLabel,
      accentColor: form.accentColor,
      showDetail: form.showDetail,
    }),
    [form],
  );

  const gaugeDatum = useMemo(() => dataToGaugeDatum(data), [data]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);
      const tableList = await getTables();
      const persistedConfig = dashboardState === 'Create' ? undefined : await getConfig();
      const nextForm = configToForm(persistedConfig);
      const tableId = nextForm.tableId || tableList[0]?.id || '';
      const [fieldList, rangeList] = tableId ? await Promise.all([getFields(tableId), getRanges(tableId)]) : [[], [{ type: 'ALL' }]];

      if (!mounted) {
        return;
      }

      setTables(tableList);
      setFields(fieldList);
      setRanges(rangeList);
      setForm({
        ...nextForm,
        tableId,
        currentFieldId: nextForm.currentFieldId || fieldList[0]?.fieldId || '',
        targetFieldId: nextForm.targetFieldId || fieldList[1]?.fieldId || fieldList[0]?.fieldId || '',
      });

      if (!isConfigurable) {
        setData(await getData());
      }

      setLoading(false);
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, [dashboardState, isConfigurable]);

  useEffect(() => {
    if (!form.tableId) {
      return;
    }

    let mounted = true;
    async function syncTableMeta() {
      const [fieldList, rangeList] = await Promise.all([getFields(form.tableId), getRanges(form.tableId)]);

      if (!mounted) {
        return;
      }

      setFields(fieldList);
      setRanges(rangeList);
      setForm((current) => ({
        ...current,
        currentFieldId: current.currentFieldId || fieldList[0]?.fieldId || '',
        targetFieldId: current.targetFieldId || fieldList[1]?.fieldId || fieldList[0]?.fieldId || '',
      }));
    }

    void syncTableMeta();

    return () => {
      mounted = false;
    };
  }, [form.tableId]);

  useEffect(() => {
    if (!isConfigurable || !form.tableId || !form.currentFieldId || !form.targetFieldId) {
      return;
    }

    const config = formToConfig(form, ranges);
    void getPreviewData(config.dataConditions).then(setData);
  }, [form, isConfigurable, ranges]);

  useEffect(() => {
    const offDataChange = onDataChange((nextData) => setData(nextData));
    const offConfigChange = onConfigChange((nextConfig) => setForm(configToForm(nextConfig)));

    return () => {
      offDataChange();
      offConfigChange();
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(formToConfig(form, ranges));
      Toast.success('配置已保存');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="app-shell loading-shell">
        <Spin size="large" />
      </main>
    );
  }

  return (
    <main className={`app-shell ${isConfigurable ? 'is-configurable' : 'is-view'} ${isFullScreen ? 'is-fullscreen' : ''}`}>
      <div className="preview-pane">
        <GaugeChart datum={gaugeDatum} config={chartConfig} fullScreen={isFullScreen} />
      </div>

      {isConfigurable ? (
        <ConfigPanel
          form={form}
          tables={tables}
          fields={fields}
          ranges={ranges}
          saving={saving}
          onChange={setForm}
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}
