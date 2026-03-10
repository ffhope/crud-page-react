# 使用示例

## 安装

```bash
npm install crud-page-react
```

## 基本使用

```tsx
import React from 'react';
import { CrudPage } from 'crud-page-react';
import type { CrudPageSchema } from 'crud-page-react';

const schema: CrudPageSchema = {
  id: 'users',
  title: '用户管理',
  api: {
    list: { url: '/api/users', method: 'GET' },
    create: { url: '/api/users', method: 'POST' },
    update: { url: '/api/users/:id', method: 'PUT' },
    delete: { url: '/api/users/:id', method: 'DELETE' },
    // 自定义操作的 API 配置
    resetPassword: {
      url: '/api/users/:id/reset-password',
      method: 'POST',
    },
    sendEmail: {
      url: '/api/users/:id/send-email',
      method: 'POST',
      data: {
        template: 'welcome',
        subject: '欢迎使用我们的服务',
      },
    },
    exportData: {
      url: '/api/users/:id/export',
      method: 'GET',
      responseType: 'blob',
    },
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
      rules: ['email'],
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
    {
      key: 'view',
      label: '查看',
      type: 'view',
    },
    {
      key: 'edit',
      label: '编辑',
      type: 'edit',
    },
    {
      key: 'delete',
      label: '删除',
      type: 'delete',
      confirm: {
        title: '确定删除此用户？',
        content: '删除后无法恢复',
      },
    },
    {
      key: 'reset-password',
      label: '重置密码',
      type: 'custom',
      apiKey: 'resetPassword',
    },
    {
      key: 'send-email',
      label: '发送邮件',
      type: 'custom',
      apiKey: 'sendEmail',
    },
    {
      key: 'export-data',
      label: '导出数据',
      type: 'custom',
      apiKey: 'exportData',
    },
  ],
  rowKey: 'id',
};

function App() {
  return (
    <div>
      <CrudPage schema={schema} />
    </div>
  );
}

export default App;
```

## 自定义 API 请求

```tsx
import { CrudPage, ApiRequest } from 'crud-page-react';

const customApiRequest: ApiRequest = async (url, options) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

<CrudPage
  schema={schema}
  apiRequest={customApiRequest}
/>
```

## 自定义操作和下拉菜单

从 v0.1.2 开始，自定义操作（type: 'custom'）会自动折叠到"其它操作"下拉菜单中，而基础操作（查看、编辑、删除）仍然显示为独立按钮。这样可以保持界面整洁，同时支持更多的自定义功能。

### 操作类型说明

- **基础操作**：`view`、`edit`、`delete` - 显示为独立的图标按钮
- **自定义操作**：`custom` - 折叠到"其它操作"下拉菜单中
- **复制功能**：始终在下拉菜单中提供"复制 JSON"功能

### 下拉菜单特性

- 自动分组：自定义操作在上方，复制功能在下方，用分割线分隔
- 危险操作：支持 `danger: true` 属性，菜单项会显示为红色
- 响应式：下拉菜单会根据屏幕位置自动调整弹出方向

```tsx
const schema: CrudPageSchema = {
  // ... 其他配置
  actions: [
    // 基础操作 - 显示为独立按钮
    { key: 'view', label: '查看', type: 'view' },
    { key: 'edit', label: '编辑', type: 'edit' },
    { key: 'delete', label: '删除', type: 'delete' },
    
    // 自定义操作 - 折叠到下拉菜单
    { key: 'approve', label: '审批', type: 'custom', apiKey: 'approve' },
    { key: 'reject', label: '拒绝', type: 'custom', apiKey: 'reject', danger: true },
    { key: 'export', label: '导出', type: 'custom', apiKey: 'export' },
  ],
};
```

## 发布到 npm

```bash
# 登录 npm
npm login

# 发布
npm publish
```