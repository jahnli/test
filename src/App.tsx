import { useEffect, useMemo, useRef, useState } from 'react';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { ConfigPanel } from './components/ConfigPanel';
import { GaugeChart } from './components/GaugeChart';
import { conditionFromSource, configToForm, formToConfig } from './lib/config';
import { composeGaugeData, dataToGaugeDatum } from './lib/completion';
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
  setRendered,
} from './lib/sdk';
import type { DashboardData, DashboardState, DataCondition, DataRange, FieldMeta, FormState, PluginConfig, TableMeta } from './types/dashboard';
import './styles.css';

const configurableStates: DashboardState[] = ['Create', 'Config'];
const defaultRanges: DataRange[] = [{ type: 'ALL' }];

function getConditionList(config?: PluginConfig): DataCondition[] {
  if (config?.customConfig?.sourceConditions?.length) {
    return config.customConfig.sourceConditions;
  }

  if (!config?.dataConditions) {
    return [];
  }

  return Array.isArray(config.dataConditions) ? config.dataConditions : [config.dataConditions];
}

export default function App() {
  const [dashboardState] = useState<DashboardState>(() => getDashboardState());
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [currentFields, setCurrentFields] = useState<FieldMeta[]>([]);
  const [targetFields, setTargetFields] = useState<FieldMeta[]>([]);
  const [currentRanges, setCurrentRanges] = useState<DataRange[]>(defaultRanges);
  const [targetRanges, setTargetRanges] = useState<DataRange[]>(defaultRanges);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dataConditionsRef = useRef<DataCondition[]>([]);

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

  const resolveGaugeData = async (conditions: DataCondition[], hostData?: DashboardData) => {
    if (hostData && dataToGaugeDatum(hostData)) {
      return hostData;
    }

    if (conditions.length >= 2) {
      const [currentData, targetData] = await Promise.all([getPreviewData(conditions[0]), getPreviewData(conditions[1])]);
      return composeGaugeData(currentData, targetData);
    }

    return hostData ?? emptyData;
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);
      const tableList = await getTables();
      const persistedConfig = dashboardState === 'Create' ? undefined : await getConfig();
      const persistedConditions = getConditionList(persistedConfig);
      dataConditionsRef.current = persistedConditions;
      const nextForm = configToForm(persistedConfig);
      const fallbackTableId = tableList[0]?.id || '';
      const currentTableId = nextForm.current.tableId || fallbackTableId;
      const targetTableId = nextForm.target.tableId || fallbackTableId;
      const [currentFieldList, currentRangeList] = currentTableId
        ? await Promise.all([getFields(currentTableId), getRanges(currentTableId)])
        : [[], defaultRanges];
      const [targetFieldList, targetRangeList] = targetTableId
        ? await Promise.all([getFields(targetTableId), getRanges(targetTableId)])
        : [[], defaultRanges];
      const hydratedForm = {
        ...nextForm,
        current: {
          ...nextForm.current,
          tableId: currentTableId,
          fieldId: nextForm.current.fieldId || currentFieldList[0]?.fieldId || '',
        },
        target: {
          ...nextForm.target,
          tableId: targetTableId,
          fieldId: nextForm.target.fieldId || targetFieldList[0]?.fieldId || '',
        },
      };
      const effectiveConditions =
        persistedConditions.length >= 2
          ? persistedConditions
          : hydratedForm.current.tableId && hydratedForm.target.tableId
            ? [conditionFromSource(hydratedForm.current, currentRangeList), conditionFromSource(hydratedForm.target, targetRangeList)]
            : persistedConditions;

      if (!mounted) {
        return;
      }

      setTables(tableList);
      setCurrentFields(currentFieldList);
      setTargetFields(targetFieldList);
      setCurrentRanges(currentRangeList);
      setTargetRanges(targetRangeList);
      setForm(hydratedForm);
      dataConditionsRef.current = effectiveConditions;

      if (!isConfigurable) {
        const hostData = await getData();
        setData(await resolveGaugeData(effectiveConditions, hostData));
      }

      setLoading(false);
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, [dashboardState, isConfigurable]);

  useEffect(() => {
    if (!form.current.tableId) {
      return;
    }

    let mounted = true;
    async function syncCurrentMeta() {
      const [fieldList, rangeList] = await Promise.all([getFields(form.current.tableId), getRanges(form.current.tableId)]);

      if (!mounted) {
        return;
      }

      setCurrentFields(fieldList);
      setCurrentRanges(rangeList);
      setForm((current) => ({
        ...current,
        current: {
          ...current.current,
          fieldId: current.current.fieldId || fieldList[0]?.fieldId || '',
        },
      }));
    }

    void syncCurrentMeta();

    return () => {
      mounted = false;
    };
  }, [form.current.tableId]);

  useEffect(() => {
    if (!form.target.tableId) {
      return;
    }

    let mounted = true;
    async function syncTargetMeta() {
      const [fieldList, rangeList] = await Promise.all([getFields(form.target.tableId), getRanges(form.target.tableId)]);

      if (!mounted) {
        return;
      }

      setTargetFields(fieldList);
      setTargetRanges(rangeList);
      setForm((current) => ({
        ...current,
        target: {
          ...current.target,
          fieldId: current.target.fieldId || fieldList[0]?.fieldId || '',
        },
      }));
    }

    void syncTargetMeta();

    return () => {
      mounted = false;
    };
  }, [form.target.tableId]);

  useEffect(() => {
    const currentReady = form.current.tableId && (form.current.valueMode === 'COUNT' || form.current.fieldId);
    const targetReady = form.target.tableId && (form.target.valueMode === 'COUNT' || form.target.fieldId);

    if (!isConfigurable || !currentReady || !targetReady) {
      return;
    }

    const config = formToConfig(form, currentRanges, targetRanges);
    const conditions = Array.isArray(config.dataConditions) ? config.dataConditions : [config.dataConditions];
    dataConditionsRef.current = conditions;

    void Promise.all([getPreviewData(conditions[0]), getPreviewData(conditions[1])]).then(([currentData, targetData]) => {
      setData(composeGaugeData(currentData, targetData));
    });
  }, [form, isConfigurable, currentRanges, targetRanges]);

  useEffect(() => {
    const offDataChange = onDataChange((nextData) => {
      if (dataToGaugeDatum(nextData)) {
        setData(nextData);
        return;
      }

      void resolveGaugeData(dataConditionsRef.current, nextData).then(setData);
    });
    const offConfigChange = onConfigChange((nextConfig) => {
      dataConditionsRef.current = getConditionList(nextConfig);
      setForm(configToForm(nextConfig));
    });

    return () => {
      offDataChange();
      offConfigChange();
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = formToConfig(form, currentRanges, targetRanges);
      const conditions = Array.isArray(config.dataConditions) ? config.dataConditions : [config.dataConditions];
      dataConditionsRef.current = conditions;

      const [currentData, targetData] = await Promise.all([getPreviewData(conditions[0]), getPreviewData(conditions[1])]);
      setData(composeGaugeData(currentData, targetData));

      await saveConfig(config);
      await setRendered();
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
          currentFields={currentFields}
          targetFields={targetFields}
          currentRanges={currentRanges}
          targetRanges={targetRanges}
          saving={saving}
          onChange={setForm}
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}
