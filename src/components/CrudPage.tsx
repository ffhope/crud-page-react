import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { CrudPageSchema, ActionSchema, ApiRequest } from '../types/schema';
import DynamicFilter from './DynamicFilter';
import DynamicTable from './DynamicTable';
import DynamicForm from './DynamicForm';

const { Title } = Typography;

interface CrudPageProps {
  schema: CrudPageSchema;
  initialData?: Record<string, unknown>[];
  apiRequest?: ApiRequest;
}

/** 替换 URL 模板中的 :id */
function buildUrl(template: string, id: unknown): string {
  return template.replace(/:id/, String(id));
}

/** 通用请求封装 */
async function apiRequest<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** 从接口响应中提取列表和总数（兼容常见结构） */
function extractListResponse(json: unknown): { list: Record<string, unknown>[]; total: number } {
  if (!json || typeof json !== 'object') return { list: [], total: 0 };
  const obj = json as Record<string, unknown>;
  const data = obj.data ?? obj.result ?? obj;
  if (Array.isArray(data)) return { list: data as Record<string, unknown>[], total: data.length };
  if (data && typeof data === 'object') {
    const inner = data as Record<string, unknown>;
    const list = (inner.list ?? inner.records ?? inner.data ?? []) as Record<string, unknown>[];
    const total = Number(inner.total ?? inner.count ?? list.length);
    return { list, total };
  }
  return { list: [], total: 0 };
}

const CrudPage: React.FC<CrudPageProps> = ({ schema, initialData = [], apiRequest: customApiRequest }) => {
  const rowKey = schema.rowKey || 'id';

  // 使用传入的apiRequest或默认的
  const request = customApiRequest || apiRequest;

  // 本地兜底数据（API 失败时使用）
  const localDataRef = useRef<Record<string, unknown>[]>(initialData);

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(schema.pagination?.pageSize || 10);
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view';
    record?: Record<string, unknown>;
  }>({ open: false, mode: 'create' });

  const [messageApi, contextHolder] = message.useMessage();

  // ---------- 本地过滤（API 失败时兜底） ----------
  const localFilter = useCallback(
    (params: Record<string, unknown>, p: number, ps: number) => {
      const filtered = localDataRef.current.filter(row => {
        return Object.entries(params).every(([key, val]) => {
          if (val === undefined || val === null || val === '') return true;
          if (key.endsWith('_min')) return Number(row[key.slice(0, -4)]) >= Number(val);
          if (key.endsWith('_max')) return Number(row[key.slice(0, -4)]) <= Number(val);
          if (key.endsWith('_start') || key.endsWith('_end')) return true;
          const rowVal = row[key];
          if (Array.isArray(rowVal)) {
            return Array.isArray(val) ? val.some(v => rowVal.includes(v)) : rowVal.includes(val);
          }
          if (typeof val === 'string') return String(rowVal).toLowerCase().includes(val.toLowerCase());
          return rowVal === val;
        });
      });
      const start = (p - 1) * ps;
      setData(filtered.slice(start, start + ps));
      setTotal(filtered.length);
    },
    [],
  );

  // ---------- 获取列表 ----------
  const fetchList = useCallback(async (
    params: Record<string, unknown> = filterParams,
    p: number = page,
    ps: number = pageSize,
  ) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(p), pageSize: String(ps) });
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      const json = await request(`${schema.api.list}?${query}`);
      const { list, total: tot } = extractListResponse(json);
      setData(list);
      setTotal(tot);
    } catch {
      // API 不可用 → 本地演示模式
      localFilter(params, p, ps);
    } finally {
      setLoading(false);
    }
  }, [request, schema.api.list, filterParams, page, pageSize, localFilter]);

  // 初始加载 & 参数变化时重新请求
  useEffect(() => {
    fetchList(filterParams, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, page, pageSize]);

  // ---------- 搜索 ----------
  const handleSearch = useCallback((params: Record<string, unknown>) => {
    setFilterParams(params);
    setPage(1);
  }, []);

  // ---------- 翻页 ----------
  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  // ---------- 删除 ----------
  const handleDelete = useCallback(async (record: Record<string, unknown>) => {
    const id = record[rowKey];
    if (schema.api.delete) {
      try {
        await request(buildUrl(schema.api.delete, id), { method: 'DELETE' });
        messageApi.success('删除成功');
        fetchList();
        return;
      } catch {
        // 降级本地
      }
    }
    localDataRef.current = localDataRef.current.filter(r => r[rowKey] !== id);
    localFilter(filterParams, page, pageSize);
    messageApi.success('删除成功（演示模式）');
  }, [request, schema.api.delete, rowKey, fetchList, localFilter, filterParams, page, pageSize, messageApi]);

  // ---------- 操作列点击 ----------
  const handleAction = useCallback((action: ActionSchema, record: Record<string, unknown>) => {
    if (action.type === 'view') {
      setModalState({ open: true, mode: 'view', record });
    } else if (action.type === 'edit') {
      setModalState({ open: true, mode: 'edit', record });
    } else if (action.type === 'delete') {
      handleDelete(record);
    }
  }, [handleDelete]);

  // ---------- 新增 / 编辑提交 ----------
  const handleFormOk = useCallback(async (values: Record<string, unknown>) => {
    const isCreate = modalState.mode === 'create';

    if (isCreate) {
      if (schema.api.create) {
        try {
          await request(schema.api.create, {
            method: 'POST',
            body: JSON.stringify(values),
          });
          messageApi.success('新增成功');
          setModalState({ open: false, mode: 'create' });
          fetchList();
          return;
        } catch {
          // 降级本地
        }
      }
      const newRecord = { [rowKey]: `local-${Date.now()}`, ...values };
      localDataRef.current = [newRecord, ...localDataRef.current];
      localFilter(filterParams, 1, pageSize);
      setPage(1);
      messageApi.success('新增成功（演示模式）');
    } else {
      const id = values[rowKey];
      if (schema.api.update) {
        try {
          await request(buildUrl(schema.api.update, id), {
            method: 'PUT',
            body: JSON.stringify(values),
          });
          messageApi.success('编辑成功');
          setModalState({ open: false, mode: 'create' });
          fetchList();
          return;
        } catch {
          // 降级本地
        }
      }
      localDataRef.current = localDataRef.current.map(r =>
        r[rowKey] === id ? { ...r, ...values } : r,
      );
      localFilter(filterParams, page, pageSize);
      messageApi.success('编辑成功（演示模式）');
    }

    setModalState({ open: false, mode: 'create' });
  }, [
    request, modalState.mode, schema.api, rowKey,
    fetchList, localFilter, filterParams, page, pageSize, messageApi,
  ]);

  return (
    <div style={{ padding: 24, background: '#f5f6fa', minHeight: '100vh' }}>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{schema.title}</Title>
        {schema.api.create && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalState({ open: true, mode: 'create', record: undefined })}
          >
            {schema.createButtonLabel || '新增'}
          </Button>
        )}
      </div>

      <DynamicFilter schema={schema} onSearch={handleSearch} onReset={() => handleSearch({})} />

      <DynamicTable
        schema={schema}
        data={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: handlePageChange,
        }}
        onView={(record) => handleAction({ key: 'view', label: '查看', type: 'view' }, record)}
        onEdit={(record) => handleAction({ key: 'edit', label: '编辑', type: 'edit' }, record)}
        onDelete={(record) => handleDelete(record)}
        onCustomAction={(actionKey, record) => {
          const action = schema.actions?.find(a => a.key === actionKey);
          if (action) handleAction(action, record);
        }}
      />

      <DynamicForm
        schema={schema}
        visible={modalState.open}
        mode={modalState.mode}
        initialValues={modalState.record}
        onSubmit={handleFormOk}
        onCancel={() => setModalState({ open: false, mode: 'create' })}
      />
    </div>
  );
};

export default CrudPage;
