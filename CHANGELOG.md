# Changelog

All notable changes to this project will be documented in this file.

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