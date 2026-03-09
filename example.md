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
    list: '/api/users',
    create: '/api/users',
    update: '/api/users/:id',
    delete: '/api/users/:id',
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

## 发布到 npm

```bash
# 登录 npm
npm login

# 发布
npm publish
```