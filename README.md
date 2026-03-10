# CRUD Page React

一个基于 React + Ant Design 的动态 CRUD 组件库，支持通过 JSON Schema 配置生成完整的增删改查界面。

## 特性

- 🚀 **零代码配置** - 通过 JSON Schema 快速生成 CRUD 界面
- 🎨 **美观易用** - 基于 Ant Design 设计语言
- 🔧 **高度可定制** - 支持自定义 API、字段配置、操作按钮
- 📱 **响应式设计** - 自适应各种屏幕尺寸
- 🔒 **类型安全** - 完整的 TypeScript 类型定义
- 🎯 **操作分组** - 自定义操作自动折叠到下拉菜单

## 安装

```bash
npm install crud-page-react
```

## 快速开始

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
  ],
  rowKey: 'id',
};

function App() {
  return <CrudPage schema={schema} />;
}
```

## 新特性：操作按钮分组 (v0.1.3)

自定义操作现在会自动折叠到"其它操作"下拉菜单中，保持界面整洁：

```tsx
const schema: CrudPageSchema = {
  // ... 其他配置
  actions: [
    // 基础操作 - 显示为独立按钮
    { key: 'view', label: '查看', type: 'view' },
    { key: 'edit', label: '编辑', type: 'edit' },
    { key: 'delete', label: '删除', type: 'delete' },
    
    // 自定义操作 - 自动折叠到下拉菜单
    { key: 'approve', label: '审批', type: 'custom', apiKey: 'approve' },
    { key: 'reject', label: '拒绝', type: 'custom', apiKey: 'reject', danger: true },
    { key: 'export', label: '导出', type: 'custom', apiKey: 'export' },
  ],
};
```

### 操作类型

- **基础操作** (`view`, `edit`, `delete`) - 显示为独立的图标按钮
- **自定义操作** (`custom`) - 折叠到"其它操作"下拉菜单中
- **复制功能** - 始终在下拉菜单中提供"复制 JSON"功能

## 文档

更多详细文档和示例，请查看 [example.md](./example.md)

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新内容。

## 许可证

MIT