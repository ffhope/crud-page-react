import { useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, DatePicker, Button, Row, Col, Space, Radio } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { CrudPageSchema, FieldSchema, FilterConfig, SelectOption } from '../types/schema';
import { getEffectiveWidget } from '../types/schema';

const { RangePicker } = DatePicker;

interface DynamicFilterProps {
  schema: CrudPageSchema;
  onSearch: (values: Record<string, unknown>) => void;
  onReset: () => void;
}

/** 解析 FilterConfig */
function getFilterConfig(field: FieldSchema): FilterConfig | undefined {
  if (!field.filter || typeof field.filter === 'boolean') return undefined;
  return field.filter as FilterConfig;
}

/** 获取选项列表（从 field.config 读取） */
function getOptions(field: FieldSchema): SelectOption[] {
  return field.config?.options ?? [];
}

/** 渲染单个筛选组件 */
function renderFilterInput(field: FieldSchema, cfg?: FilterConfig): React.ReactNode {
  const widget = getEffectiveWidget(field, cfg);
  const placeholder = field.config?.placeholder;
  const dateFormat = field.config?.dateFormat;
  const options = getOptions(field);
  const style = { width: '100%' };

  switch (widget) {
    case 'input':
      return <Input placeholder={placeholder ?? `请输入 ${field.label}`} style={style} />;

    case 'textarea':
      return <Input.TextArea placeholder={placeholder ?? `请输入 ${field.label}`} style={style} />;

    case 'inputNumber': {
      if (cfg?.range) {
        return (
          <Space>
            <Form.Item name={`${field.key}_min`} noStyle>
              <InputNumber placeholder="最小值" />
            </Form.Item>
            <span>~</span>
            <Form.Item name={`${field.key}_max`} noStyle>
              <InputNumber placeholder="最大值" />
            </Form.Item>
          </Space>
        );
      }
      return <InputNumber placeholder={placeholder ?? `请输入 ${field.label}`} style={style} />;
    }

    case 'select':
      return (
        <Select allowClear placeholder={placeholder ?? `请选择 ${field.label}`} style={style}>
          {options.map((o) => (
            <Select.Option key={String(o.value)} value={o.value}>
              {o.label}
            </Select.Option>
          ))}
        </Select>
      );

    case 'multiselect':
      return (
        <Select mode="multiple" allowClear placeholder={placeholder ?? `请选择 ${field.label}`} style={style}>
          {options.map((o) => (
            <Select.Option key={String(o.value)} value={o.value}>
              {o.label}
            </Select.Option>
          ))}
        </Select>
      );

    case 'radio':
      return (
        <Radio.Group style={style}>
          {options.map((o) => (
            <Radio key={String(o.value)} value={o.value}>{o.label}</Radio>
          ))}
        </Radio.Group>
      );

    case 'switch':
      return <Switch />;

    case 'datePicker': {
      const showTime = field.type === 'datetime';
      return <DatePicker showTime={showTime} format={dateFormat} style={style} />;
    }

    case 'rangePicker': {
      const showTime = field.type === 'datetime';
      return <RangePicker showTime={showTime} format={dateFormat} style={style} />;
    }

    case 'timePicker':
      return <DatePicker picker="time" format={dateFormat ?? 'HH:mm:ss'} style={style} />;

    case 'jsonInput':
      return <Input placeholder={placeholder ?? `搜索 ${field.label}`} style={style} />;

    default:
      return <Input placeholder={placeholder ?? `请输入 ${field.label}`} style={style} />;
  }
}

export default function DynamicFilter({ schema, onSearch, onReset }: DynamicFilterProps) {
  const [form] = Form.useForm();
  const [expanded, setExpanded] = useState(false);

  const filterFields = schema.fields.filter(
    (f) => f.filter !== false && f.filter !== undefined && f.type !== 'objectArray',
  );

  const handleFinish = (values: Record<string, unknown>) => {
    onSearch(values);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  const colSpan = { xs: 24, sm: 12, md: 12, lg: 8, xl: 6, xxl: 6 };

  const visibleFields = expanded ? filterFields : filterFields.slice(0, 4);

  return (
    <Form form={form} onFinish={handleFinish} layout="vertical">
      <Row gutter={[16, 0]}>
        {visibleFields.map((field) => {
          const cfg = getFilterConfig(field);
          const widget = getEffectiveWidget(field, cfg);

          // inputNumber 数字范围：name 不放在 Form.Item 上，由内部子 Form.Item 承载
          const isNumberRange = widget === 'inputNumber' && cfg?.range;

          return (
            <Col key={field.key} {...colSpan}>
              <Form.Item
                label={field.label}
                name={isNumberRange ? undefined : field.key}
                valuePropName={widget === 'switch' ? 'checked' : 'value'}
              >
                {renderFilterInput(field, cfg)}
              </Form.Item>
            </Col>
          );
        })}

        {/* 操作按钮 */}
        <Col {...colSpan}>
          <Form.Item label=" ">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
              {filterFields.length > 4 && (
                <Button type="link" onClick={() => setExpanded(!expanded)}>
                  {expanded ? '收起' : '展开'}
                </Button>
              )}
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
