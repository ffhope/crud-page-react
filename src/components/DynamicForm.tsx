import { useEffect, useState } from 'react';
import {
  Modal, Form, Input, InputNumber, Select, Switch,
  DatePicker, Radio, Checkbox, Space, Card, Divider,
  Button, Table, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CodeOutlined, FormOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import type { CrudPageSchema, FieldSchema, FormFieldConfig, SelectOption, ArrayItemField } from '../types/schema';
import { getEffectiveWidget, getFieldGroupPrefix, getNestedValue } from '../types/schema';
import { keysToAntdRules } from '../types/validationRules';

type FormMode = 'create' | 'edit' | 'view';

interface DynamicFormProps {
  schema: CrudPageSchema;
  mode: FormMode;
  visible: boolean;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

function getFormConfig(field: FieldSchema): FormFieldConfig | undefined {
  if (!field.form || typeof field.form === 'boolean') return undefined;
  return field.form as FormFieldConfig;
}

function getOptions(field: FieldSchema): SelectOption[] {
  return field.config?.options ?? [];
}

/** 将 camelCase 前缀转为可读标签（仅首字母大写） */
function prefixToLabel(prefix: string): string {
  return prefix.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

/** 设置嵌套对象指定路径的值（修改原对象） */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (cur[k] == null || typeof cur[k] !== 'object' || Array.isArray(cur[k])) {
      cur[k] = {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = value;
}

/** 行内可编辑表格 cell 组件 */
function EditableCellInput({
  itemField,
  disabled,
  value,
  onChange,
}: {
  itemField: ArrayItemField;
  disabled: boolean;
  value?: unknown;                   // Form.Item 注入
  onChange?: (val: unknown) => void; // Form.Item 注入
}) {
  const ph = itemField.config?.placeholder ?? `请输入${itemField.label}`;
  switch (itemField.type) {
    case 'number':
      return (
        <InputNumber
          disabled={disabled}
          placeholder={ph}
          value={value as number | null | undefined}
          onChange={(v) => onChange?.(v)}
          style={{ width: '100%' }}
        />
      );
    case 'boolean':
      // Form.Item 默认 valuePropName="value"，这里手动映射到 checked
      return (
        <Switch
          disabled={disabled}
          checked={value as boolean}
          onChange={(checked) => onChange?.(checked)}
        />
      );
    case 'date':
    case 'datetime': {
      const fmt = itemField.config?.dateFormat ?? (itemField.type === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
      // value 可能是字符串（来自 initialValues）或 dayjs 对象（用户选择后）
      const pickerValue = value != null
        ? (dayjs.isDayjs(value) ? value : dayjs(value as string))
        : null;
      return (
        <DatePicker
          disabled={disabled}
          format={fmt}
          value={pickerValue}
          onChange={(v) => onChange?.(v)}
          style={{ width: '100%' }}
        />
      );
    }
    case 'string': {
      if (itemField.widget === 'select' && itemField.config?.options?.length) {
        return (
          <Select
            disabled={disabled}
            allowClear
            placeholder={ph}
            value={value as string | undefined}
            onChange={(v) => onChange?.(v)}
            style={{ width: '100%' }}
          >
            {itemField.config.options.map((o) => (
              <Select.Option key={String(o.value)} value={o.value}>{o.label}</Select.Option>
            ))}
          </Select>
        );
      }
      return (
        <Input
          disabled={disabled}
          placeholder={ph}
          value={value as string | undefined}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    }
    default:
      return (
        <Input
          disabled={disabled}
          placeholder={ph}
          value={value as string | undefined}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
  }
}

function renderFormInput(
  field: FieldSchema,
  cfg: FormFieldConfig | undefined,
  disabled: boolean,
): React.ReactNode {
  const widget = getEffectiveWidget(field, cfg);
  const options = getOptions(field);
  const placeholder = field.config?.placeholder;
  const rows = field.config?.rows;
  const style = { width: '100%' };

  switch (widget) {
    case 'input':
      return <Input disabled={disabled} placeholder={placeholder ?? `请输入 ${field.label}`} style={style} />;

    case 'textarea':
      return (
        <Input.TextArea
          disabled={disabled}
          rows={rows ?? 4}
          placeholder={placeholder ?? `请输入 ${field.label}`}
          style={style}
        />
      );

    case 'jsonInput':
      return (
        <Input.TextArea
          disabled={disabled}
          rows={rows ?? 5}
          placeholder={placeholder ?? '请输入 JSON'}
          style={{ ...style, fontFamily: 'monospace', fontSize: 12 }}
        />
      );

    case 'inputNumber':
      return (
        <InputNumber
          disabled={disabled}
          min={cfg?.min}
          max={cfg?.max}
          step={cfg?.step ?? 1}
          placeholder={placeholder ?? `请输入 ${field.label}`}
          style={style}
        />
      );

    case 'select':
      return (
        <Select disabled={disabled} allowClear placeholder={placeholder ?? `请选择 ${field.label}`} style={style}>
          {options.map((o) => (
            <Select.Option key={String(o.value)} value={o.value}>
              {o.label}
            </Select.Option>
          ))}
        </Select>
      );

    case 'multiselect':
      return (
        <Select
          mode="multiple"
          disabled={disabled}
          allowClear
          placeholder={placeholder ?? `请选择 ${field.label}`}
          style={style}
        >
          {options.map((o) => (
            <Select.Option key={String(o.value)} value={o.value}>
              {o.label}
            </Select.Option>
          ))}
        </Select>
      );

    case 'radio':
      return (
        <Radio.Group disabled={disabled}>
          {options.map((o) => (
            <Radio key={String(o.value)} value={o.value}>{o.label}</Radio>
          ))}
        </Radio.Group>
      );

    case 'checkbox':
      return (
        <Checkbox.Group disabled={disabled}>
          <Space wrap>
            {options.map((o) => (
              <Checkbox key={String(o.value)} value={o.value}>{o.label}</Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      );

    case 'switch':
      return <Switch disabled={disabled} />;

    case 'datePicker': {
      const showTime = field.type === 'datetime';
      const format = field.config?.dateFormat ?? (showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
      return <DatePicker disabled={disabled} showTime={showTime} format={format} style={style} />;
    }

    case 'rangePicker': {
      const showTime = field.type === 'datetime';
      const format = field.config?.dateFormat ?? (showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
      return <DatePicker.RangePicker disabled={disabled} showTime={showTime} format={format} style={style} />;
    }

    case 'timePicker':
      return (
        <DatePicker
          picker="time"
          disabled={disabled}
          format={field.config?.dateFormat ?? 'HH:mm:ss'}
          style={style}
        />
      );

    case 'editableTable': {
      const itemFields = field.itemFields ?? [];
      return (
        <Form.List name={field.key}>
          {(listFields, { add, remove }) => {
            const columns = [
              ...itemFields.map((itemField) => ({
                title: itemField.label,
                dataIndex: itemField.key,
                width: itemField.width,
                render: (_: unknown, record: { name: number }) => (
                  <Form.Item
                    name={[record.name, itemField.key]}
                    rules={itemField.required ? [{ required: true, message: `${itemField.label}必填` }] : undefined}
                    style={{ margin: 0 }}
                  >
                    <EditableCellInput itemField={itemField} disabled={disabled} />
                  </Form.Item>
                ),
              })),
              ...(!disabled
                ? [{
                    title: '',
                    width: 50,
                    render: (_: unknown, record: { name: number }) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(record.name)}
                      />
                    ),
                  }]
                : []),
            ];
            return (
              <div>
                <Table
                  size="small"
                  dataSource={listFields.map((f) => ({ ...f, _key: f.key }))}
                  rowKey="_key"
                  columns={columns}
                  pagination={false}
                  style={{ marginBottom: 8 }}
                />
                {!disabled && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({})}
                    block
                  >
                    添加一行
                  </Button>
                )}
              </div>
            );
          }}
        </Form.List>
      );
    }

    default:
      return <Input disabled={disabled} placeholder={placeholder ?? `请输入 ${field.label}`} style={style} />;
  }
}

/**
 * 将接口数据转为 Form 使用的初始值。
 *
 * - 顶层字段：直接展开（与原来相同）
 * - dot-path 字段（如 `emergencyContact.name`）：
 *   API 返回的数据已是嵌套结构，form.setFieldsValue 可直接识别
 * - 日期字段：将字符串转为 dayjs 对象
 */
function normalizeInitialValues(
  fields: FieldSchema[],
  values?: Record<string, unknown>,
): Record<string, unknown> {
  if (!values) return {};
  // 深拷贝，避免修改原对象
  const result: Record<string, unknown> = JSON.parse(JSON.stringify(values)) as Record<string, unknown>;

  fields.forEach((field) => {
    const cfg = getFormConfig(field);
    const widget = getEffectiveWidget(field, cfg);
    if (widget !== 'datePicker' && widget !== 'rangePicker' && widget !== 'timePicker') return;

    const path = field.key.split('.');
    const val = path.length > 1 ? getNestedValue(result, field.key) : result[field.key];
    if (val == null) return;

    if (widget === 'rangePicker' && Array.isArray(val)) {
      setNestedValue(result, path, (val as (string | dayjs.Dayjs)[]).map((v) => {
        if (!v) return null;
        return dayjs.isDayjs(v) ? v : dayjs(v as string);
      }));
    } else if (val) {
      // 检查是否已经是 dayjs 对象，避免重复转换
      if (dayjs.isDayjs(val)) {
        setNestedValue(result, path, val);
      } else {
        // timePicker 存储的是纯时间字符串（如 "09:30:00"），需要带 format 解析
        const fmt = widget === 'timePicker'
          ? (field.config?.dateFormat ?? 'HH:mm:ss')
          : undefined;
        setNestedValue(result, path, fmt ? dayjs(val as string, fmt) : dayjs(val as string));
      }
    }
  });

  return result;
}

/** 将 Form 值序列化为提交数据（dayjs → ISO string） */
function serializeValues(
  fields: FieldSchema[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = JSON.parse(JSON.stringify(values)) as Record<string, unknown>;

  fields.forEach((field) => {
    const cfg = getFormConfig(field);
    const widget = getEffectiveWidget(field, cfg);
    if (widget !== 'datePicker' && widget !== 'rangePicker' && widget !== 'timePicker') return;

    const path = field.key.split('.');
    // 必须从原始 values 读（dayjs 对象仍存在），
    // 不能从 result 读——JSON.parse(JSON.stringify) 已把 dayjs 序列化为 ISO 字符串，
    // 导致 dayjs.isDayjs() 全部失败（rangePicker 变成 [null, null]）。
    const val = path.length > 1 ? getNestedValue(values, field.key) : values[field.key];
    if (val == null) return;

    if (widget === 'timePicker' && dayjs.isDayjs(val)) {
      const fmt = field.config?.dateFormat ?? 'HH:mm:ss';
      setNestedValue(result, path, (val as ReturnType<typeof dayjs>).format(fmt));
    } else if (widget === 'datePicker' && dayjs.isDayjs(val)) {
      setNestedValue(result, path, (val as ReturnType<typeof dayjs>).toISOString());
    } else if (widget === 'rangePicker' && Array.isArray(val)) {
      setNestedValue(
        result,
        path,
        (val as ReturnType<typeof dayjs>[]).map((v) => (v && dayjs.isDayjs(v) ? v.toISOString() : null)),
      );
    }
  });

  return result;
}

/** 渲染单个 Form.Item */
function renderField(field: FieldSchema, disabled: boolean): React.ReactNode {
  const cfg = getFormConfig(field);
  const widget = getEffectiveWidget(field, cfg);
  const required = !disabled && (cfg?.required ?? false);

  // editableTable 使用 Form.List，不能再套 Form.Item name
  if (widget === 'editableTable') {
    return (
      <Form.Item key={field.key} label={field.label} style={{ marginBottom: 14 }}>
        {renderFormInput(field, cfg, disabled)}
      </Form.Item>
    );
  }

  const namePath = field.key.includes('.') ? field.key.split('.') : field.key;
  const extraRules = field.rules && !disabled ? keysToAntdRules(field.rules) : [];
  const validationRules = [
    ...(required ? [{ required: true, message: `请输入 ${field.label}` }] : []),
    ...extraRules,
  ];

  return (
    <Form.Item
      key={field.key}
      label={field.label}
      name={namePath}
      valuePropName={widget === 'switch' ? 'checked' : 'value'}
      rules={validationRules}
      style={{ marginBottom: 14 }}
    >
      {renderFormInput(field, cfg, disabled)}
    </Form.Item>
  );
}

export default function DynamicForm({
  schema,
  mode,
  visible,
  initialValues,
  onSubmit,
  onCancel,
}: DynamicFormProps) {
  const [form] = Form.useForm();
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [rawJsonError, setRawJsonError] = useState('');
  const disabled = mode === 'view';
  const entityName = schema.title.replace(/管理$/, '');

  const titleMap: Record<FormMode, string> = {
    create: `新增${entityName}`,
    edit:   `编辑${entityName}`,
    view:   `查看${entityName}`,
  };

  const formFields = schema.fields.filter((f) => {
    if (mode === 'view') return f.table !== false && f.table !== undefined;
    return f.form !== false && f.form !== undefined;
  });

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setRawJsonMode(false);
      setRawJsonText('');
      setRawJsonError('');
    } else {
      // 模态框打开时，根据模式设置表单值
      if (mode === 'create') {
        // 新增模式：清空表单并确保没有残留数据
        form.resetFields();
        form.setFieldsValue({});
      } else {
        // 编辑/查看模式设置初始值
        const normalized = normalizeInitialValues(formFields, initialValues);
        form.setFieldsValue(normalized);
      }
    }
  }, [visible, mode, initialValues]);

  const switchToRaw = () => {
    // getFieldsValue(true) 返回 store 全量数据（含 id 等非 Form.Item 字段）
    const rawValues = disabled
      ? (initialValues ?? {})
      : (form.getFieldsValue(true) as Record<string, unknown>);
    const serialized = disabled ? rawValues : serializeValues(formFields, rawValues);
    setRawJsonText(JSON.stringify(serialized, null, 2));
    setRawJsonError('');
    setRawJsonMode(true);
  };

  const switchToForm = () => {
    if (!disabled) {
      try {
        const parsed = JSON.parse(rawJsonText) as Record<string, unknown>;
        form.setFieldsValue(normalizeInitialValues(formFields, parsed));
        setRawJsonError('');
      } catch {
        setRawJsonError('JSON 格式错误，请修正后再切换');
        return;
      }
    }
    setRawJsonMode(false);
  };

  const handleOk = async () => {
    if (disabled) { onCancel(); return; }
    if (rawJsonMode) {
      try {
        const parsed = JSON.parse(rawJsonText) as Record<string, unknown>;
        onSubmit(parsed);
      } catch {
        setRawJsonError('JSON 格式错误，无法提交');
      }
      return;
    }
    const values = await form.validateFields();
    onSubmit(serializeValues(formFields, values as Record<string, unknown>));
  };

  /**
   * 将字段列表按 dot-path 前缀分组渲染：
   * - 无前缀字段：直接渲染
   * - 有前缀的字段：相同前缀聚合到一个带标题的 Card 中
   */
  const renderFieldGroups = () => {
    const nodes: React.ReactNode[] = [];
    let i = 0;
    while (i < formFields.length) {
      const field = formFields[i];
      const prefix = getFieldGroupPrefix(field.key);

      if (!prefix) {
        nodes.push(renderField(field, disabled));
        i++;
      } else {
        // 收集相同前缀的连续字段
        const groupFields: FieldSchema[] = [];
        while (i < formFields.length && getFieldGroupPrefix(formFields[i].key) === prefix) {
          groupFields.push(formFields[i]);
          i++;
        }
        nodes.push(
          <div key={prefix} style={{ marginBottom: 16 }}>
            <Divider style={{ fontSize: 13, color: '#666', margin: '8px 0 12px' }}>
              {prefixToLabel(prefix)}
            </Divider>
            <Card
              size="small"
              style={{ background: '#fafafa', borderRadius: 6 }}
              styles={{ body: { paddingBottom: 4 } }}
            >
              {groupFields.map((gf) => renderField(gf, disabled))}
            </Card>
          </div>,
        );
      }
    }
    return nodes;
  };

  const copyRawJson = () => {
    const json = rawJsonMode
      ? rawJsonText
      : JSON.stringify(
          disabled
            ? (initialValues ?? {})
            : serializeValues(formFields, form.getFieldsValue(true) as Record<string, unknown>),
          null, 2,
        );
    navigator.clipboard.writeText(json)
      .then(() => void message.success('已复制 JSON'))
      .catch(() => void message.error('复制失败'));
  };

  const modalTitle = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
      <span>{titleMap[mode]}</span>
      <Space size={8}>
        <Button
          size="small"
          type="text"
          icon={rawJsonMode ? <FormOutlined /> : <CodeOutlined />}
          onClick={rawJsonMode ? switchToForm : switchToRaw}
        >
          {rawJsonMode ? '表单视图' : 'Raw JSON'}
        </Button>
      </Space>
    </div>
  );

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={disabled ? '关闭' : '确认'}
      cancelText="取消"
      cancelButtonProps={disabled ? { style: { display: 'none' } } : {}}
      width={720}
      destroyOnClose
    >
      {/* Form 始终挂载，切换模式时仅用 display 隐藏，防止卸载导致 store 重置 */}
      <div style={{ display: rawJsonMode ? 'none' : undefined }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={mode === 'create' ? {} : normalizeInitialValues(formFields, initialValues)}
        >
          {renderFieldGroups()}
        </Form>
      </div>

      {rawJsonMode && (
        <div>
          <Input.TextArea
            value={rawJsonText}
            onChange={disabled ? undefined : (e) => { setRawJsonText(e.target.value); setRawJsonError(''); }}
            readOnly={disabled}
            rows={20}
            style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            status={rawJsonError ? 'error' : undefined}
          />
          {rawJsonError && (
            <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{rawJsonError}</div>
          )}
          {!disabled && (
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <Button size="small" icon={<CodeOutlined />} onClick={copyRawJson}>复制 JSON</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
