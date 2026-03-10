# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-03-10

### 💥 Breaking Changes
- **移除简单字符串 API 配置支持**: 不再支持简单字符串 URL 配置，所有 API 配置必须使用完整的配置对象格式
- **强制使用扩展配置对象**: `CrudPageSchema.api` 只接受 `ActionApiConfig` 对象

### 🗑️ Removed
- 移除 `parseApiConfig` 函数和向后兼容逻辑
- 移除简单字符串 URL 配置支持

### 🔧 Changed
- 更新类型定义，统一 API 配置格式
- 简化组件代码，直接使用 API 配置对象
- 配置生成器现在生成完整的 API 配置对象

### 📋 Migration Guide
```javascript
// 之前 (v0.0.x)
{
  api: {
    list: "/api/users",
    create: "/api/users"
  }
}

// 现在 (v0.1.0+)
{
  api: {
    list: {
      url: "/api/users",
      method: "GET"
    },
    create: {
      url: "/api/users", 
      method: "POST"
    }
  }
}
```

## [0.0.7] - 2025-03-10

### ✨ Added
- **扩展的 CRUD API 配置**: 标准 CRUD API（list、create、update、delete、detail）现在支持完整的配置对象
- **灵活的 HTTP 方法**: 支持 GET、POST、PUT、PATCH、DELETE 等方法
- **自定义请求头**: 支持添加认证、来源标识等请求头
- **请求体数据配置**: 支持固定参数和动态参数
- **模板变量替换**: 在请求体中支持 `{{fieldName}}` 格式的变量替换
- **动态 URL 占位符**: 支持 `:fieldName` 格式的 URL 占位符

### 🔧 Changed
- **向后兼容**: 继续支持简单字符串 URL 配置
- **类型安全**: 更新 TypeScript 类型定义，支持混合配置
- **错误处理**: 改进 API 配置解析的错误处理
- **代码优化**: 重构 API 调用逻辑，提高可维护性

### 📚 Documentation
- 新增 `EXTENDED_CRUD_API_CONFIG.md` 详细说明扩展配置功能
- 提供完整的配置示例和迁移指南

## [0.0.6] - 2025-03-10

### ✨ Added
- **统一 API 配置**: 支持在 `schema.api` 中集中定义所有 API 配置
- **API 键引用**: 操作可通过 `apiKey` 引用统一配置的 API
- **模板变量支持**: 请求体数据支持 `{{fieldName}}` 模板变量替换

### 🔧 Changed
- 重构 API 配置架构，提高配置的复用性
- 改进代码组织结构，增强可维护性

## [0.0.5] - 2025-03-10

### ✨ Added
- **纯 API 驱动**: 组件现在完全依赖 API 配置，不再有本地降级模式
- **明确错误提示**: API 调用失败时显示清晰的错误信息

### 🔧 Changed
- **移除降级演示模式**: 完全移除本地过滤和演示模式逻辑
- **简化组件架构**: 移除复杂的降级逻辑，提高代码可维护性
- **改进用户体验**: 避免混淆的"演示模式"提示

### 🗑️ Removed
- 移除 `localFilter` 本地过滤函数
- 移除 `localDataRef` 本地数据引用
- 移除所有"演示模式"相关的提示信息

### 📚 Documentation
- 更新组件行为说明，强调 API 配置的重要性

## [0.0.4] - 2025-03-09

### ✨ Added
- **动态 URL 参数支持**: 所有 API 配置现在支持任意字段作为 URL 参数
- 支持 `:orderNo`, `:customerName`, `:status` 等任意字段名占位符
- 统一了 CRUD 操作和自定义操作的 URL 构建逻辑

### 🔧 Changed
- 重构 `buildUrl` 函数，使用正则表达式支持多字段替换
- 更新所有 API 调用点使用新的动态参数逻辑

### 🐛 Fixed
- 修复了 URL 构建只支持 `:id` 的限制
- 提升了 API 配置的灵活性

### 📚 Documentation
- 更新 README 添加动态 URL 参数使用示例
- 添加详细的占位符格式说明

## [0.0.3] - 2025-03-08

### ✨ Added
- 自定义操作 API 配置支持
- 支持自定义按钮操作和 API 调用
- 添加响应类型处理 (json, blob)

### 🔧 Changed
- 扩展 ActionSchema 类型定义
- 增强 CrudPage 组件的 handleAction 逻辑

## [0.0.2] - 2025-03-07

### ✨ Added
- 基础 CRUD 功能完善
- 表单验证和错误处理
- 分页和筛选功能

### 🐛 Fixed
- 修复 React 重复实例问题
- 修正模块解析问题

## [0.0.1] - 2025-03-06

### ✨ Added
- 初始版本发布
- 基础 CRUD 组件
- JSON Schema 配置支持
- TypeScript 类型定义