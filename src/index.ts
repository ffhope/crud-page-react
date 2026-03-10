// 主要组件
export { default as CrudPage } from './components/CrudPage';
export { default as DynamicFilter } from './components/DynamicFilter';
export { default as DynamicTable } from './components/DynamicTable';
export { default as DynamicForm } from './components/DynamicForm';

// 类型定义
export type {
  CrudPageSchema,
  FieldSchema,
  DataType,
  WidgetType,
  SelectOption,
  FilterConfig,
  TableColumnConfig,
  FormFieldConfig,
  FieldConfig,
  ArrayItemField,
  ActionSchema,
  ActionType,
  ActionPermission,
  PaginationConfig,
  ApiRequest,
} from './types/schema';

export type {
  ValidationRuleConfig,
} from './types/validationRules';

// 工具函数
export {
  defaultWidgetForType,
  getEffectiveWidget,
  getNestedValue,
  getFieldGroupPrefix,
} from './types/schema';

export {
  BUILTIN_RULES,
  loadCustomRules,
  saveCustomRules,
  getAllRules,
  getRuleByKey,
  ruleConfigToAntdRule,
  keysToAntdRules,
} from './types/validationRules';

// 国际化支持 - 导出常用的 Ant Design 语言包
export { default as zhCN } from 'antd/locale/zh_CN';
export { default as enUS } from 'antd/locale/en_US';
export { default as jaJP } from 'antd/locale/ja_JP';
export { default as koKR } from 'antd/locale/ko_KR';
export type { Locale } from 'antd/es/locale';