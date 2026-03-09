/** API 请求函数类型 */
export interface ApiRequest {
  <T = unknown>(url: string, options?: RequestInit): Promise<T>;
}

/**
 * 数据类型：描述字段存储的值类型。
 *
 * 嵌套对象不再作为独立类型，而是通过 key 的点分路径（dot-path）表达，
 * 例如 `emergencyContact.name`、`emergencyContact.phone`。
 * 框架会自动将 Form 数据写入/读出对应的嵌套路径。
 */
export type DataType =
  | 'string'       // 字符串
  | 'number'       // 数字
  | 'boolean'      // 布尔
  | 'datetime'     // 日期时间
  | 'date'         // 仅日期
  | 'array'        // 基本类型数组（string[] / number[]），配合 multiselect / checkbox
  | 'objectArray'; // 对象数组（object[]），配合 editableTable，需配置 itemFields

/** UI 组件类型：描述字段渲染使用的组件 */
export type WidgetType =
  // ── 基础输入 ──────────────────────────────
  | 'input'          // 单行输入框（string 默认）
  | 'textarea'       // 多行文本域
  | 'inputNumber'    // 数字输入框（number 默认）
  // ── 选择类 ────────────────────────────────
  | 'select'         // 单选下拉
  | 'multiselect'    // 多选下拉（array 默认）
  | 'radio'          // 单选按钮组
  | 'checkbox'       // 多选复选框
  | 'switch'         // 开关（boolean 默认）
  // ── 日期时间 ──────────────────────────────
  | 'datePicker'     // 日期/时间选择（date/datetime 默认）
  | 'rangePicker'    // 日期范围选择
  | 'timePicker'     // 时间点选择
  // ── 对象数组 ──────────────────────────────
  | 'editableTable'  // 行内可编辑表格（objectArray 默认）
  // ── JSON 原始编辑 ─────────────────────────
  | 'jsonInput';     // 原始 JSON 文本域（fallback）

/** 兼容旧版 —— 不再推荐直接使用 */
export type FieldType = DataType;

export interface SelectOption {
  label: string;
  value: string | number | boolean;
  color?: string;
}

/**
 * 筛选项配置 —— 仅放筛选独有配置。
 * options / placeholder / dateFormat 统一在 FieldSchema.config 里配置。
 */
export interface FilterConfig {
  /** 覆盖字段级 widget，指定筛选组件类型 */
  widget?: WidgetType;
  /** inputNumber 时可开启数字范围（min/max 两个输入框） */
  range?: boolean;
  defaultValue?: unknown;
}

/** 表格列配置 */
export interface TableColumnConfig {
  width?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  ellipsis?: boolean;
}

/**
 * 表单字段配置 —— 仅放表单独有配置。
 * options / placeholder / dateFormat / rows 统一在 FieldSchema.config 里配置。
 */
export interface FormFieldConfig {
  /** 覆盖字段级 widget，指定表单组件类型 */
  widget?: WidgetType;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * 字段级共用组件配置。
 * filter 和 form 均可读取，无需在两处重复填写。
 */
export interface FieldConfig {
  /** 下拉/多选/单选等组件的选项列表 */
  options?: SelectOption[];
  /** 输入框、选择框等的占位提示文字 */
  placeholder?: string;
  /** 日期/时间组件的显示格式，如 'YYYY-MM-DD' */
  dateFormat?: string;
  /** textarea / jsonInput 的行数 */
  rows?: number;
}

/**
 * 对象数组（objectArray）中每个 item 的字段定义。
 * 故意保持简单：不支持嵌套 objectArray，不支持 dot-path key。
 */
export interface ArrayItemField {
  /** item 对象的属性名，不使用点分路径 */
  key: string;
  label: string;
  /** 不允许嵌套数组 */
  type: Exclude<DataType, 'array' | 'objectArray'>;
  /** 不允许嵌套 editableTable */
  widget?: Exclude<WidgetType, 'editableTable'>;
  config?: Pick<FieldConfig, 'options' | 'placeholder' | 'dateFormat'>;
  required?: boolean;
  /** 列宽（px） */
  width?: number;
}

/**
 * 字段定义。
 *
 * ### 点分路径（dot-path）规则
 * `key` 支持点分路径表达嵌套结构，例如：
 * - `emergencyContact.name`
 * - `emergencyContact.phone`
 *
 * Form 层会自动将值写入 / 读取对应的嵌套对象属性；
 * 具有相同前缀的字段在表单中会被归为同一视觉分组，并显示分组标题。
 */
export interface FieldSchema {
  key: string;
  label: string;
  /** 数据类型（值的类型） */
  type: DataType;
  /**
   * 默认 UI 组件类型；可被 filter / form 级别的 widget 覆盖。
   * 不填时由 defaultWidgetForType 推导。
   */
  widget?: WidgetType;
  filter?: boolean | FilterConfig;
  table?: boolean | TableColumnConfig;
  form?: boolean | FormFieldConfig;
  /**
   * 字段级共用组件配置（options、placeholder、dateFormat 等）。
   * filter 和 form 均从这里读取，不再重复配置。
   */
  config?: FieldConfig;
  render?: string;
  /**
   * 对象数组子字段定义，仅 type='objectArray' 时生效。
   * 配置后 widget 默认推导为 'editableTable'。
   */
  itemFields?: ArrayItemField[];
  /**
   * 校验规则 key 数组，引用 validationRules.ts 中内置或自定义规则的 key。
   * 例如 `rules: ['phone_cn', 'max_len_50']`
   * 注意：required 规则通过 form.required 单独控制，无需在此重复。
   */
  rules?: string[];
}

export type ActionType = 'edit' | 'delete' | 'view' | 'custom';

export interface ActionPermission {
  role?: string[];
  condition?: string;
}

export interface ActionSchema {
  key: string;
  label: string;
  type: ActionType;
  icon?: string;
  danger?: boolean;
  permission?: ActionPermission;
  confirm?: {
    title: string;
    content?: string;
  };
}

export interface PaginationConfig {
  pageSize?: number;
  pageSizeOptions?: number[];
  showTotal?: boolean;
}

export interface CrudPageSchema {
  id: string;
  title: string;
  api: {
    list: string;
    create?: string;
    update?: string;
    delete?: string;
    detail?: string;
  };
  fields: FieldSchema[];
  actions?: ActionSchema[];
  pagination?: PaginationConfig;
  rowKey?: string;
  createButtonLabel?: string;
}

/* ─── 工具函数 ──────────────────────────────────────── */

/**
 * 根据数据类型推导默认 UI 组件
 *
 * string      → input
 * number      → inputNumber
 * boolean     → switch
 * date        → datePicker
 * datetime    → datePicker
 * array       → multiselect
 * objectArray → editableTable
 */
export function defaultWidgetForType(type: DataType): WidgetType {
  switch (type) {
    case 'number':      return 'inputNumber';
    case 'boolean':     return 'switch';
    case 'date':
    case 'datetime':    return 'datePicker';
    case 'array':       return 'multiselect';
    case 'objectArray': return 'editableTable';
    default:            return 'input'; // string
  }
}

/** 获取实际生效的组件类型（context.widget > field.widget > type 推导） */
export function getEffectiveWidget(
  field: FieldSchema,
  config?: FilterConfig | FormFieldConfig,
): WidgetType {
  if (config?.widget) return config.widget;
  if (field.widget) return field.widget;
  return defaultWidgetForType(field.type);
}

/**
 * 从嵌套对象按点分路径取值
 *
 * getNestedValue({ a: { b: 1 } }, 'a.b') → 1
 * getNestedValue({ x: [1, 2] }, 'x')      → [1, 2]
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc != null && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * 从点分路径 key 中提取分组前缀（第一个 segment）。
 * 无前缀的顶层字段返回 null。
 *
 * 'emergencyContact.name' → 'emergencyContact'
 * 'name'                  → null
 */
export function getFieldGroupPrefix(key: string): string | null {
  const idx = key.indexOf('.');
  return idx >= 0 ? key.slice(0, idx) : null;
}