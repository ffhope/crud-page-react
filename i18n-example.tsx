import React, { useState } from 'react';
import { Radio, Space, Card } from 'antd';
import { CrudPage, zhCN, enUS, jaJP, koKR } from './src';
import type { CrudPageSchema, Locale } from './src';

// 测试用的schema
const testSchema: CrudPageSchema = {
  id: 'i18n-test',
  title: '国际化测试',
  api: {
    list: { url: '/api/users', method: 'GET' },
    create: { url: '/api/users', method: 'POST' },
    update: { url: '/api/users/:id', method: 'PUT' },
    delete: { url: '/api/users/:id', method: 'DELETE' },
  },
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      table: { width: 80 },
      form: false,
    },
    {
      key: 'name',
      label: '姓名',
      type: 'string',
      filter: true,
      table: true,
      form: { required: true },
    },
    {
      key: 'email',
      label: '邮箱',
      type: 'string',
      filter: true,
      table: true,
      form: { required: true },
    },
    {
      key: 'status',
      label: '状态',
      type: 'string',
      widget: 'select',
      config: {
        options: [
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'inactive' },
        ],
      },
      filter: true,
      table: true,
      form: true,
    },
  ],
  actions: [
    { key: 'view', label: '查看', type: 'view' },
    { key: 'edit', label: '编辑', type: 'edit' },
    { key: 'delete', label: '删除', type: 'delete' },
    { key: 'custom1', label: '自定义操作1', type: 'custom', apiKey: 'custom1' },
    { key: 'custom2', label: '自定义操作2', type: 'custom', apiKey: 'custom2' },
  ],
  rowKey: 'id',
};

// 模拟数据
const mockData = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', status: 'inactive' },
];

// 语言选项
const localeOptions = [
  { label: '简体中文', value: 'zhCN', locale: zhCN },
  { label: 'English', value: 'enUS', locale: enUS },
  { label: '日本語', value: 'jaJP', locale: jaJP },
  { label: '한국어', value: 'koKR', locale: koKR },
];

function I18nExample() {
  const [currentLocale, setCurrentLocale] = useState<{
    value: string;
    locale: Locale;
  }>({ value: 'zhCN', locale: zhCN });

  return (
    <div style={{ padding: 20 }}>
      <Card title="国际化测试" style={{ marginBottom: 20 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <strong>选择语言:</strong>
            <Radio.Group
              value={currentLocale.value}
              onChange={(e) => {
                const selected = localeOptions.find(opt => opt.value === e.target.value);
                if (selected) {
                  setCurrentLocale({ value: selected.value, locale: selected.locale });
                }
              }}
              style={{ marginLeft: 16 }}
            >
              {localeOptions.map(option => (
                <Radio.Button key={option.value} value={option.value}>
                  {option.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          
          <div style={{ fontSize: 14, color: '#666' }}>
            当前语言: <code>{currentLocale.value}</code>
          </div>
        </Space>
      </Card>

      <CrudPage 
        schema={testSchema} 
        initialData={mockData}
        locale={currentLocale.locale}
      />
    </div>
  );
}

export default I18nExample;