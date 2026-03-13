import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, message, Typography, ConfigProvider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';
import type { CrudPageSchema, ActionSchema, ActionApiConfig, ApiRequest } from '../types/schema';
import DynamicFilter from './DynamicFilter';
import DynamicTable from './DynamicTable';
import DynamicForm from './DynamicForm';

const { Title } = Typography;

interface CrudPageProps {
  schema: CrudPageSchema;
  initialData?: Record<string, unknown>[];
  apiRequest?: ApiRequest;
  /** Ant Design 语言配置，默认为中文 */
  locale?: Locale;
}

/** 动态替换 URL 模板中的占位符，支持 :fieldName 和 {{fieldName}} 两种格式 */
function buildUrl(template: string, record: Record<string, unknown>): string {
  let result = template;
  
  // 替换 :fieldName 格式
  result = result.replace(/:(\w+)/g, (match, fieldName) => {
    const value = record[fieldName];
    return value !== undefined ? String(value) : match;
  });
  
  // 替换 {{fieldName}} 格式
  result = result.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
    const value = record[fieldName];
    return value !== undefined ? String(value) : match;
  });
  
  return result;
}

/** 处理模板数据，支持 {{fieldName}} 格式的变量替换，支持嵌套对象和数组 */
function processTemplateData(data: Record<string, unknown>, record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
      // 替换模板变量 {{fieldName}}
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
        const fieldValue = record[fieldName];
        return fieldValue !== undefined ? String(fieldValue) : match;
      });
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // 处理数组
        result[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return processTemplateData(item as Record<string, unknown>, record);
          } else if (typeof item === 'string' && item.includes('{{') && item.includes('}}')) {
            return item.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
              const fieldValue = record[fieldName];
              return fieldValue !== undefined ? String(fieldValue) : match;
            });
          }
          return item;
        });
      } else {
        // 处理嵌套对象
        result[key] = processTemplateData(value as Record<string, unknown>, record);
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
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

const CrudPage: React.FC<CrudPageProps> = ({ 
  schema, 
  initialData = [], 
  apiRequest: customApiRequest,
  locale = zhCN 
}) => {
  const rowKey = schema.rowKey || 'id';

  // 使用传入的apiRequest或默认的
  const request = customApiRequest || apiRequest;

  // 初始数据引用
  const initialDataRef = useRef<Record<string, unknown>[]>(initialData);

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

  // ---------- 初始化数据 ----------
  const initializeData = useCallback(() => {
    if (initialDataRef.current.length > 0) {
      setData(initialDataRef.current);
      setTotal(initialDataRef.current.length);
    }
  }, []);

  // ---------- 获取列表 ----------
  const fetchList = useCallback(async (
    params: Record<string, unknown> = filterParams,
    p: number = page,
    ps: number = pageSize,
  ) => {
    if (!schema.api.list) {
      // 没有配置 API，使用初始数据
      initializeData();
      return;
    }

    const listApiConfig = schema.api.list;

    setLoading(true);
    try {
      // 构建查询参数
      const query = new URLSearchParams({ page: String(p), pageSize: String(ps) });
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      
      // 构建请求选项
      const options: RequestInit = {
        method: listApiConfig.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...listApiConfig.headers
        }
      };

      // 构建 URL，支持动态占位符替换
      let url = buildUrl(listApiConfig.url, params);
      if (listApiConfig.method === 'POST') {
        const queryParams: Record<string, string> = {};
        query.forEach((value, key) => {
          queryParams[key] = value;
        });
        
        // 处理模板数据（如果有的话）
        let processedApiData = {};
        if (listApiConfig.data) {
          // 对于list API，通常没有特定的record，使用查询参数作为上下文
          processedApiData = processTemplateData(listApiConfig.data, queryParams);
        }
        
        const requestData = {
          ...queryParams,
          ...processedApiData
        };
        options.body = JSON.stringify(requestData);
      } else {
        // 对于GET请求，如果有data配置，将其作为查询参数处理
        if (listApiConfig.data) {
          const processedApiData = processTemplateData(listApiConfig.data, params);
          Object.entries(processedApiData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              query.set(key, String(value));
            }
          });
        }
        url = `${url}?${query}`;
      }

      const json = await request(url, options);
      const { list, total: tot } = extractListResponse(json);
      setData(list);
      setTotal(tot);
    } catch (error) {
      console.error('Failed to fetch list:', error);
      messageApi.error('获取数据失败，请检查网络连接或联系管理员');
      // 如果有初始数据，显示初始数据
      if (initialDataRef.current.length > 0) {
        initializeData();
      } else {
        setData([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [request, schema.api.list, filterParams, page, pageSize, initializeData, messageApi]);

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
    if (!schema.api.delete) {
      messageApi.error('删除功能未配置');
      return;
    }

    const deleteApiConfig = schema.api.delete;

    try {
      // 构建 URL，动态替换占位符
      let url = buildUrl(deleteApiConfig.url, record);
      
      // 构建请求选项
      const options: RequestInit = {
        method: deleteApiConfig.method || 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...deleteApiConfig.headers
        }
      };

      // 处理请求体数据
      if (deleteApiConfig.data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(deleteApiConfig.method || 'DELETE')) {
        const processedData = processTemplateData(deleteApiConfig.data, record);
        options.body = JSON.stringify({
          ...processedData,
          recordId: record[rowKey],
          timestamp: new Date().toISOString()
        });
      }

      await request(url, options);
      messageApi.success('删除成功');
      fetchList();
    } catch (error) {
      console.error('Delete failed:', error);
      messageApi.error('删除失败，请稍后重试');
    }
  }, [request, schema.api.delete, fetchList, messageApi, rowKey]);

  // ---------- 操作列点击 ----------
  const handleAction = useCallback(async (action: ActionSchema, record: Record<string, unknown>) => {
    if (action.type === 'view' || action.type === 'edit') {
      // 如果配置了detail API，先调用获取详细数据
      if (schema.api.detail) {
        try {
          const detailApiConfig = schema.api.detail;
          
          // 构建 URL，动态替换占位符
          let url = buildUrl(detailApiConfig.url, record);

          // 构建请求选项
          const options: RequestInit = {
            method: detailApiConfig.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...detailApiConfig.headers
            }
          };

          // 处理请求体数据（对于GET请求，通常不需要body，但有些API可能需要）
          if (detailApiConfig.data && ['POST', 'PUT', 'PATCH'].includes(detailApiConfig.method || 'GET')) {
            const processedData = processTemplateData(detailApiConfig.data, record);
            options.body = JSON.stringify(processedData);
          } else if (detailApiConfig.method === 'GET' && detailApiConfig.data) {
            // 对于GET请求，将data作为查询参数
            const processedData = processTemplateData(detailApiConfig.data, record);
            const query = new URLSearchParams();
            Object.entries(processedData).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                query.set(key, String(value));
              }
            });
            url = `${url}?${query}`;
          }

          const response = await request(url, options);
          
          // 提取详细数据
          let detailData = record; // 默认使用列表数据
          if (response && typeof response === 'object') {
            const responseObj = response as Record<string, unknown>;
            // 尝试从不同的响应结构中提取数据
            detailData = (responseObj.data ?? responseObj.result ?? responseObj) as Record<string, unknown>;
          }
          
          setModalState({ open: true, mode: action.type, record: detailData });
        } catch (error) {
          console.error('Failed to fetch detail:', error);
          messageApi.error('获取详细数据失败，使用列表数据');
          // 如果获取详细数据失败，仍然使用列表数据
          setModalState({ open: true, mode: action.type, record });
        }
      } else {
        // 没有配置detail API，直接使用列表数据
        setModalState({ open: true, mode: action.type, record });
      }
    } else if (action.type === 'delete') {
      handleDelete(record);
    } else if (action.type === 'custom') {
      // 处理自定义 action 的 API 调用
      let apiConfig: ActionApiConfig | undefined;
      
      // 优先使用 apiKey 引用统一配置，向后兼容 api 直接配置
      if (action.apiKey) {
        const apiDef = schema.api[action.apiKey];
        if (typeof apiDef === 'string') {
          // 简单字符串 URL 配置
          apiConfig = {
            url: apiDef,
            method: 'GET',
            responseType: 'json'
          };
        } else if (apiDef && typeof apiDef === 'object') {
          // 完整的 API 配置对象
          apiConfig = apiDef as ActionApiConfig;
        }
      } else if (action.api) {
        // 向后兼容：使用 action.api 配置
        apiConfig = action.api;
      }

      if (!apiConfig) {
        messageApi.error(`${action.label}未配置 API`);
        return;
      }

      try {
        // 构建 URL，动态替换占位符
        let url = buildUrl(apiConfig.url, record);
        
        // 构建请求选项
        const options: RequestInit = {
          method: apiConfig.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...apiConfig.headers
          }
        };

        // 处理请求体数据
        if (apiConfig.data && ['POST', 'PUT', 'PATCH'].includes(apiConfig.method || 'GET')) {
          // 支持模板变量替换
          const processedData = processTemplateData(apiConfig.data, record);
          options.body = JSON.stringify({
            ...processedData,
            recordId: record[rowKey],
            timestamp: new Date().toISOString()
          });
        }

        // 调用 API
        const response = await request(url, options);
        
        // 处理特殊响应类型
        if (apiConfig.responseType === 'blob') {
          // 处理文件下载
          const blob = new Blob([response as BlobPart]);
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${action.key}.pdf`;
          a.click();
          URL.revokeObjectURL(downloadUrl);
          messageApi.success(`${action.label}成功`);
        } else {
          // 处理 JSON 响应
          const result = response as { success?: boolean; message?: string };
          if (result.success !== false) {
            messageApi.success(`${action.label}成功`);
            // 刷新数据
            await fetchList();
          } else {
            messageApi.error(result.message || `${action.label}失败`);
          }
        }
      } catch (error) {
        console.error(`Action ${action.key} failed:`, error);
        messageApi.error(`${action.label}失败`);
      }
    }
  }, [handleDelete, rowKey, request, messageApi, fetchList]);

  // ---------- 新增 / 编辑提交 ----------
  const handleFormOk = useCallback(async (values: Record<string, unknown>) => {
    const isCreate = modalState.mode === 'create';

    if (isCreate) {
      if (!schema.api.create) {
        messageApi.error('新增功能未配置');
        return;
      }

      const createApiConfig = schema.api.create;

      try {
        // 构建请求选项
        const options: RequestInit = {
          method: createApiConfig.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...createApiConfig.headers
          }
        };

        // 处理请求体数据
        let requestData = { ...values };
        if (createApiConfig.data) {
          const processedData = processTemplateData(createApiConfig.data, values);
          requestData = {
            ...requestData,
            ...processedData,
            timestamp: new Date().toISOString()
          };
        }
        
        options.body = JSON.stringify(requestData);

        // 构建 URL，支持动态占位符替换
        const url = buildUrl(createApiConfig.url, values);
        await request(url, options);
        messageApi.success('新增成功');
        setModalState({ open: false, mode: 'create' });
        fetchList();
      } catch (error) {
        console.error('Create failed:', error);
        messageApi.error('新增失败，请稍后重试');
      }
    } else {
      if (!schema.api.update) {
        messageApi.error('编辑功能未配置');
        return;
      }

      const updateApiConfig = schema.api.update;

      try {
        // 使用原始记录数据进行模板变量替换（来自detail或列表数据）
        const templateData = modalState.record || {};
        
        // 构建 URL，动态替换占位符
        let url = buildUrl(updateApiConfig.url, templateData);

        // 构建请求选项
        const options: RequestInit = {
          method: updateApiConfig.method || 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...updateApiConfig.headers
          }
        };

        // 处理请求体数据
        let requestData = { ...values };
        if (updateApiConfig.data) {
          // 使用原始记录数据处理模板变量，而不是表单值
          const processedData = processTemplateData(updateApiConfig.data, templateData);
          requestData = {
            ...requestData,
            ...processedData,
            timestamp: new Date().toISOString()
          };
        }
        
        options.body = JSON.stringify(requestData);

        await request(url, options);
        messageApi.success('编辑成功');
        setModalState({ open: false, mode: 'create' });
        fetchList();
      } catch (error) {
        console.error('Update failed:', error);
        messageApi.error('编辑失败，请稍后重试');
      }
    }
  }, [
    request, modalState.mode, modalState.record, schema.api, fetchList, messageApi,
  ]);

  return (
    <ConfigProvider locale={locale}>
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
    </ConfigProvider>
  );
};

export default CrudPage;
