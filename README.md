# CRUD Page React

一个基于 React + Ant Design 的动态 CRUD 组件库，支持通过 JSON Schema 配置生成完整的增删改查界面。

## 特性

- 🚀 **零代码配置** - 通过 JSON Schema 配置即可生成完整 CRUD 界面
- 📝 **丰富的表单组件** - 支持 15+ 种表单控件类型
- 🔍 **智能筛选** - 自动生成筛选器，支持范围查询
- 📊 **灵活表格** - 可配置列宽、排序、固定列等
- 🎨 **Raw JSON 模式** - 支持原始 JSON 编辑和查看
- 🔌 **自定义 API** - 支持自定义 API 请求函数和动态 URL 参数
- 🌐 **动态 URL 参数** - 支持任意字段作为 URL 参数 (`:id`, `:orderNo`, `:customerName` 等)
- ⚡ **自定义操作** - 支持配置自定义按钮操作和 API 调用
- 📱 **响应式设计** - 适配移动端和桌面端
- 🎯 **TypeScript 支持** - 完整的类型定义

## 安装

```bash
npm install crud-page-react
# 或
yarn add crud-page-react
```

### 依赖要求

```json
{
  "react": ">=16.8.0",
  "react-dom": ">=16.8.0",
  "antd": ">=5.0.0",
  "dayjs": ">=1.11.0"
}
```

## 快速开始

### 基础用法

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

### 扩展 API 配置

v0.0.7+ 版本支持更强大的 API 配置，包括自定义 HTTP 方法、请求头、请求体数据和模板变量：

```tsx
const advancedSchema: CrudPageSchema = {
  id: 'orders',
  title: '订单管理',
  api: {
    // 简单字符串配置（向后兼容）
    list: '/api/orders',
    
    // 扩展对象配置
    create: {
      url: '/api/orders',
      method: 'POST',
      headers: {
        'X-Request-Source': 'admin-panel'
      },
      data: {
        source: 'web',
        createdBy: '{{currentUser}}',
        timestamp: '{{timestamp}}'
      }
    },
    
    update: {
      url: '/api/orders/:id',
      method: 'PUT',
      data: {
        updatedBy: '{{currentUser}}',
        updateTime: '{{timestamp}}'
      }
    },
    
    delete: {
      url: '/api/orders/:orderNo',
      method: 'DELETE',
      data: {
        deletedBy: '{{currentUser}}',
        deleteReason: '{{deleteReason}}',
        timestamp: '{{timestamp}}'
      }
    }
  },
  // ... 其他配置
};
```

### 支持的扩展配置

- **HTTP 方法**：GET、POST、PUT、PATCH、DELETE
- **自定义请求头**：添加认证、来源标识等
- **请求体数据**：固定参数和动态参数
- **模板变量**：`{{fieldName}}` 格式的动态值替换
- **URL 占位符**：`:fieldName` 格式的动态 URL 构建

## 动态 URL 参数

支持在 API 配置中使用任意字段作为 URL 参数：

```tsx
const schema = {
  api: {
    list: '/api/orders',
    create: '/api/orders',
    update: '/api/orders/:id',        // 使用 id 字段
    delete: '/api/orders/:orderNo',   // 使用 orderNo 字段
    detail: '/api/orders/:id',
  },
  actions: [
    {
      key: 'track',
      label: '物流跟踪',
      type: 'custom',
      api: {
        url: '/api/tracking/:orderNo',  // 使用 orderNo 字段
        method: 'GET',
        responseType: 'json'
      }
    },
    {
      key: 'notify',
      label: '通知客户',
      type: 'custom', 
      api: {
        url: '/api/notify/:customerName', // 使用 customerName 字段
        method: 'POST',
        data: {
          message: '您的订单状态已更新'
        }
      }
    }
  ],
  // ... 其他配置
};
```

### 支持的占位符格式
- `:id` → 记录中的 `id` 字段值
- `:orderNo` → 记录中的 `orderNo` 字段值  
- `:customerName` → 记录中的 `customerName` 字段值
- 任意 `:fieldName` → 记录中的 `fieldName` 字段值

## 自定义 API 请求

```tsx
import { CrudPage, ApiRequest } from 'crud-page-react';

// 自定义 API 请求函数
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

// 使用自定义 API 请求
<CrudPage
  schema={schema}
  apiRequest={customApiRequest}
/>
```

## API 文档

### CrudPageProps

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| schema | CrudPageSchema | ✓ | - | 页面配置 schema |
| initialData | Record<string, unknown>[] | ✗ | [] | 初始数据，API 失败时作为降级数据 |
| apiRequest | ApiRequest | ✗ | 内置 fetch | 自定义 API 请求函数 |

### ApiRequest

```typescript
interface ApiRequest {
  <T = unknown>(url: string, options?: RequestInit): Promise<T>;
}
```

### CrudPageSchema

完整的 schema 配置请参考类型定义文件。

## 字段类型支持

- `string` - 字符串
- `number` - 数字  
- `boolean` - 布尔值
- `date` - 日期
- `datetime` - 日期时间
- `array` - 数组
- `objectArray` - 对象数组

## 组件类型支持

- `input` - 输入框
- `textarea` - 文本域
- `inputNumber` - 数字输入
- `select` - 下拉选择
- `multiselect` - 多选下拉
- `radio` - 单选按钮
- `checkbox` - 复选框
- `switch` - 开关
- `datePicker` - 日期选择
- `rangePicker` - 日期范围
- `timePicker` - 时间选择
- `editableTable` - 可编辑表格
- `jsonInput` - JSON 编辑器

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 许可证

MIT