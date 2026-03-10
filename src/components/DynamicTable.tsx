import { Table, Tag, Switch, Space, Button, Popconfirm, Tooltip, message, Dropdown } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CopyOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { CrudPageSchema, FieldSchema, TableColumnConfig, SelectOption } from '../types/schema';
import { getEffectiveWidget, getNestedValue } from '../types/schema';

interface DynamicTableProps {
  schema: CrudPageSchema;
  data: Record<string, unknown>[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onView: (record: Record<string, unknown>) => void;
  onEdit: (record: Record<string, unknown>) => void;
  onDelete: (record: Record<string, unknown>) => void;
  onCustomAction?: (actionKey: string, record: Record<string, unknown>) => void;
}

function getTableConfig(field: FieldSchema): TableColumnConfig | undefined {
  if (!field.table || typeof field.table === 'boolean') return undefined;
  return field.table as TableColumnConfig;
}

function getOptions(field: FieldSchema): SelectOption[] {
  return field.config?.options ?? [];
}

/** 格式化单元格显示值 */
function renderCell(field: FieldSchema, value: unknown): React.ReactNode {
  if (value == null || value === '') return <span style={{ color: '#ccc' }}>-</span>;

  const widget = getEffectiveWidget(field);

  // ── 布尔类 ──────────────────────────────────────────────
  if (field.type === 'boolean' || widget === 'switch') {
    return <Switch checked={Boolean(value)} disabled size="small" />;
  }

  // ── 下拉/单选（有 options） ──────────────────────────────
  if (widget === 'select' || widget === 'radio') {
    const options = getOptions(field);
    const opt = options.find((o) => o.value === value);
    if (opt) {
      return opt.color ? <Tag color={opt.color}>{opt.label}</Tag> : <span>{opt.label}</span>;
    }
    return <span>{String(value)}</span>;
  }

  // ── 多选（multiselect / checkbox，值为数组） ─────────────
  if (widget === 'multiselect' || widget === 'checkbox') {
    const arr = Array.isArray(value) ? value : [value];
    const options = getOptions(field);
    return (
      <Space size={4} wrap>
        {arr.map((v) => {
          const opt = options.find((o) => o.value === v);
          return opt ? (
            <Tag key={String(v)} color={opt.color}>{opt.label}</Tag>
          ) : (
            <Tag key={String(v)}>{String(v)}</Tag>
          );
        })}
      </Space>
    );
  }

  // ── 日期/时间 ────────────────────────────────────────────
  if (widget === 'datePicker') {
    const fmt = field.config?.dateFormat ?? (field.type === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
    const d = dayjs(value as string);
    return d.isValid() ? <span>{d.format(fmt)}</span> : <span>{String(value)}</span>;
  }

  if (widget === 'rangePicker') {
    if (Array.isArray(value)) {
      const fmt = field.config?.dateFormat ?? 'YYYY-MM-DD';
      return <span>{value.map((v) => (v ? dayjs(v as string).format(fmt) : '-')).join(' ~ ')}</span>;
    }
  }

  if (widget === 'timePicker') {
    const fmt = field.config?.dateFormat ?? 'HH:mm:ss';
    const d = dayjs(value as string);
    return d.isValid() ? <span>{d.format(fmt)}</span> : <span>{String(value)}</span>;
  }

  // ── 普通数组（array 基本类型） ───────────────────────────
  if (field.type === 'array' && Array.isArray(value)) {
    return (
      <Space size={4} wrap>
        {(value as unknown[]).map((v, i) => (
          <Tag key={i}>{String(v)}</Tag>
        ))}
      </Space>
    );
  }

  // ── objectArray / editableTable：显示 N 条记录 ──────────
  if (field.type === 'objectArray' || widget === 'editableTable') {
    const arr = Array.isArray(value) ? value : [];
    return <span style={{ color: '#888' }}>{arr.length} 条记录</span>;
  }

  // ── jsonInput（对象序列化为字符串） ──────────────────────
  if (widget === 'jsonInput') {
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return (
        <Tooltip title={<pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(value, null, 2)}</pre>}>
          <span style={{ cursor: 'help', fontFamily: 'monospace', fontSize: 12 }}>
            {str.length > 40 ? str.slice(0, 40) + '…' : str}
          </span>
        </Tooltip>
      );
    }
    return <span>{String(value)}</span>;
  }

  return <span>{String(value)}</span>;
}

export default function DynamicTable({
  schema,
  data,
  loading,
  pagination,
  onView,
  onEdit,
  onDelete,
  onCustomAction,
}: DynamicTableProps) {
  const tableFields = schema.fields.filter((f) => f.table !== false && f.table !== undefined);

  const columns: ColumnsType<Record<string, unknown>> = tableFields.map((field) => {
    const cfg = getTableConfig(field);
    const isNested = field.key.includes('.');

    return {
      title: field.label,
      // 点分路径使用数组形式，Ant Design Table 支持嵌套取值
      dataIndex: isNested ? field.key.split('.') : field.key,
      key: field.key,
      width: cfg?.width,
      fixed: cfg?.fixed,
      ellipsis: cfg?.ellipsis,
      sorter: cfg?.sortable,
      render: (_value: unknown, record: Record<string, unknown>) => {
        // 统一使用 getNestedValue 以支持多层点分路径
        const actualValue = isNested ? getNestedValue(record, field.key) : _value;
        return renderCell(field, actualValue);
      },
    };
  });

  const copyJson = (record: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2))
      .then(() => void message.success('已复制 JSON'))
      .catch(() => void message.error('复制失败'));
  };

  // 操作列（有 schema.actions 或始终存在，以便展示复制按钮）
  columns.push({
    title: '操作',
    key: '__actions',
    fixed: 'right',
    width: 200, // 固定宽度，因为现在有下拉菜单
    render: (_: unknown, record: Record<string, unknown>) => {
      const actions = schema.actions ?? [];
      
      // 分离基础操作和自定义操作
      const basicActions = actions.filter(action => 
        action.type === 'view' || action.type === 'edit' || action.type === 'delete'
      );
      const customActions = actions.filter(action => action.type === 'custom');

      // 构建下拉菜单项
      const dropdownItems = [
        ...customActions.map(action => ({
          key: action.key,
          label: action.label,
          onClick: () => onCustomAction?.(action.key, record),
          danger: action.danger,
        })),
        ...(customActions.length > 0 ? [{
          type: 'divider' as const,
        }] : []),
        {
          key: 'copy-json',
          label: '复制 JSON',
          icon: <CopyOutlined />,
          onClick: () => copyJson(record),
        }
      ];

      return (
        <Space size={4}>
          {basicActions.map((action) => {
            if (action.type === 'view') {
              return (
                <Tooltip key={action.key} title={action.label}>
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => onView(record)}
                  />
                </Tooltip>
              );
            }
            if (action.type === 'edit') {
              return (
                <Tooltip key={action.key} title={action.label}>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                  />
                </Tooltip>
              );
            }
            if (action.type === 'delete') {
              return (
                <Popconfirm
                  key={action.key}
                  title={action.confirm?.title ?? '确定删除？'}
                  description={action.confirm?.content}
                  onConfirm={() => onDelete(record)}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title={action.label}>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              );
            }
            return null;
          })}
          
          {/* 其它操作下拉菜单 - 始终显示，包含复制JSON功能 */}
          <Dropdown
            menu={{ items: dropdownItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Tooltip title="其它操作">
              <Button
                type="link"
                size="small"
                icon={<MoreOutlined />}
              />
            </Tooltip>
          </Dropdown>
        </Space>
      );
    },
  });

  return (
    <Table
      rowKey={schema.rowKey ?? 'id'}
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 'max-content' }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: schema.pagination?.showTotal
          ? (total) => `共 ${total} 条`
          : undefined,
        onChange: pagination.onChange,
        pageSizeOptions: schema.pagination?.pageSizeOptions ?? [10, 20, 50],
      }}
    />
  );
}
