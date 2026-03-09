# 发布到 NPM

## 发布前检查

1. 确保构建成功：
```bash
npm run build
```

2. 检查 package.json 中的版本号和包名：
```json
{
  "name": "crud-page-react",
  "version": "1.0.0"
}
```

3. 检查构建产物：
```bash
ls -la dist/
```

应该包含：
- `index.js` (CommonJS 格式)
- `index.esm.js` (ES Module 格式)  
- `index.d.ts` (TypeScript 类型定义)
- 相关的 sourcemap 文件

## 发布步骤

### 1. 登录 NPM
```bash
npm login
```

### 2. 发布包
```bash
npm publish
```

如果包名已存在，需要修改 package.json 中的 name 字段，或者使用 scoped 包名：
```json
{
  "name": "@your-username/crud-page-react"
}
```

### 3. 验证发布
发布成功后，可以在新项目中测试安装：
```bash
npm install crud-page-react
```

## 使用示例

安装后在项目中使用：

```tsx
import React from 'react';
import { CrudPage } from 'crud-page-react';
import type { CrudPageSchema } from 'crud-page-react';

const schema: CrudPageSchema = {
  title: '用户管理',
  fields: [
    {
      key: 'name',
      label: '姓名',
      dataType: 'string',
      widget: 'input',
      required: true
    },
    {
      key: 'email', 
      label: '邮箱',
      dataType: 'string',
      widget: 'input'
    }
  ],
  actions: [
    {
      type: 'create',
      label: '新增用户'
    },
    {
      type: 'update', 
      label: '编辑'
    },
    {
      type: 'delete',
      label: '删除'
    }
  ]
};

function App() {
  return (
    <CrudPage 
      schema={schema}
      apiRequest={async (url, options) => {
        // 自定义 API 请求逻辑
        const response = await fetch(url, options);
        return response.json();
      }}
    />
  );
}

export default App;
```

## 版本管理

更新版本：
```bash
npm version patch  # 修复版本 1.0.0 -> 1.0.1
npm version minor  # 次要版本 1.0.0 -> 1.1.0  
npm version major  # 主要版本 1.0.0 -> 2.0.0
```

然后重新发布：
```bash
npm publish
```

## 注意事项

1. **包名唯一性**：确保包名在 npm 上未被占用
2. **版本号**：每次发布需要递增版本号
3. **依赖管理**：确保 peerDependencies 正确设置
4. **文档完整性**：README.md 应包含完整的使用说明
5. **许可证**：添加适当的开源许可证