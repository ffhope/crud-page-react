import type { Rule } from 'antd/es/form';

/** 校验规则配置（内置 + 自定义均使用此结构） */
export interface ValidationRuleConfig {
  key: string;
  label: string;
  description?: string;
  message: string;
  /** 正则字符串（将转为 RegExp） */
  pattern?: string;
  /** 最小值（number）或最小长度（string） */
  min?: number;
  /** 最大值（number）或最大长度（string） */
  max?: number;
  /** antd 内置类型校验 */
  type?: 'string' | 'number' | 'email' | 'url' | 'integer';
  /** 是否不允许纯空白字符 */
  whitespace?: boolean;
  /** 是否内置（内置规则不可删除） */
  builtin?: boolean;
}

/** 内置规则集 */
export const BUILTIN_RULES: ValidationRuleConfig[] = [
  {
    key: 'phone_cn',
    label: '手机号（中国大陆）',
    description: '1 开头的 11 位数字',
    message: '请输入正确的手机号',
    pattern: '^1[3-9]\\d{9}$',
    builtin: true,
  },
  {
    key: 'email',
    label: '邮箱地址',
    description: '标准电子邮箱格式',
    message: '请输入正确的邮箱地址',
    type: 'email',
    builtin: true,
  },
  {
    key: 'url',
    label: 'URL 链接',
    description: '以 http/https 开头的合法 URL',
    message: '请输入正确的 URL 地址',
    type: 'url',
    builtin: true,
  },
  {
    key: 'id_card_cn',
    label: '居民身份证（中国）',
    description: '18 位二代身份证号码',
    message: '请输入正确的身份证号',
    pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
    builtin: true,
  },
  {
    key: 'positive_integer',
    label: '正整数',
    description: '大于 0 的整数',
    message: '请输入正整数',
    pattern: '^[1-9]\\d*$',
    builtin: true,
  },
  {
    key: 'non_negative_integer',
    label: '非负整数',
    description: '0 或大于 0 的整数',
    message: '请输入非负整数',
    pattern: '^\\d+$',
    builtin: true,
  },
  {
    key: 'chinese',
    label: '纯中文',
    description: '只能包含中文字符',
    message: '只能输入中文字符',
    pattern: '^[\\u4e00-\\u9fa5]+$',
    builtin: true,
  },
  {
    key: 'alphanumeric',
    label: '字母和数字',
    description: '只能包含英文字母和数字',
    message: '只能输入字母和数字',
    pattern: '^[a-zA-Z0-9]+$',
    builtin: true,
  },
  {
    key: 'no_special_chars',
    label: '无特殊字符',
    description: '只允许中文、字母、数字、下划线、短横线',
    message: '不能包含特殊字符',
    pattern: '^[a-zA-Z0-9\\u4e00-\\u9fa5_-]+$',
    builtin: true,
  },
  {
    key: 'ip_address',
    label: 'IPv4 地址',
    description: '标准 IPv4 地址格式',
    message: '请输入正确的 IP 地址',
    pattern: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
    builtin: true,
  },
  {
    key: 'date_format',
    label: '日期格式 (YYYY-MM-DD)',
    description: '格式如 2024-01-01',
    message: '请输入正确的日期格式，如 2024-01-01',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    builtin: true,
  },
  {
    key: 'no_whitespace',
    label: '不含空格',
    description: '不允许包含任何空白字符',
    message: '不能包含空格',
    pattern: '^\\S+$',
    builtin: true,
  },
  {
    key: 'min_len_2',
    label: '最少 2 个字符',
    description: '字符串长度不少于 2',
    message: '长度不能少于 2 个字符',
    min: 2,
    builtin: true,
  },
  {
    key: 'max_len_50',
    label: '最多 50 个字符',
    description: '字符串长度不超过 50',
    message: '长度不能超过 50 个字符',
    max: 50,
    builtin: true,
  },
  {
    key: 'max_len_200',
    label: '最多 200 个字符',
    description: '字符串长度不超过 200',
    message: '长度不能超过 200 个字符',
    max: 200,
    builtin: true,
  },
  {
    key: 'bank_card',
    label: '银行卡号',
    description: '16-19 位纯数字',
    message: '请输入正确的银行卡号',
    pattern: '^\\d{16,19}$',
    builtin: true,
  },
  {
    key: 'plate_cn',
    label: '车牌号（中国）',
    description: '含新能源车牌在内的中国大陆车牌',
    message: '请输入正确的车牌号',
    pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁夏][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$',
    builtin: true,
  },
  {
    key: 'postal_code_cn',
    label: '邮政编码（中国）',
    description: '6 位数字邮编',
    message: '请输入正确的邮政编码',
    pattern: '^\\d{6}$',
    builtin: true,
  },
];

const CUSTOM_RULES_STORAGE_KEY = 'dynamic_crud_custom_rules';

export function loadCustomRules(): ValidationRuleConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_RULES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ValidationRuleConfig[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomRules(rules: ValidationRuleConfig[]): void {
  try {
    localStorage.setItem(CUSTOM_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch { /* ignore */ }
}

/** 获取所有规则（内置 + 自定义） */
export function getAllRules(): ValidationRuleConfig[] {
  return [...BUILTIN_RULES, ...loadCustomRules()];
}

/** 根据 key 查找规则 */
export function getRuleByKey(key: string): ValidationRuleConfig | undefined {
  return getAllRules().find(r => r.key === key);
}

/** 将规则配置转为 Ant Design Form Rule */
export function ruleConfigToAntdRule(config: ValidationRuleConfig): Rule {
  const rule: Record<string, unknown> = { message: config.message };
  if (config.pattern) {
    rule.pattern = new RegExp(config.pattern);
  }
  if (config.type) {
    rule.type = config.type;
  }
  if (config.min !== undefined) {
    rule.min = config.min;
  }
  if (config.max !== undefined) {
    rule.max = config.max;
  }
  if (config.whitespace !== undefined) {
    rule.whitespace = config.whitespace;
  }
  return rule as Rule;
}

/** 将一组规则 key 转为 Ant Design Form Rules 数组 */
export function keysToAntdRules(keys: string[]): Rule[] {
  return keys
    .map(k => getRuleByKey(k))
    .filter((c): c is ValidationRuleConfig => c !== undefined)
    .map(ruleConfigToAntdRule);
}