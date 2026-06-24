import type { ServiceProvider } from '../types';

export const SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    name: 'DeepSeek（推荐）',
    url: 'https://api.deepseek.com',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', description: '速度快，性价比高' },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', description: '能力更强' },
    ]
  },
  {
    name: '小米 MiMo（推荐）',
    url: 'https://api.xiaomimimo.com/v1',
    keyUrl: 'https://platform.xiaomimimo.com/console/api-keys',
    models: [
      { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro', description: '最强能力' },
      { id: 'mimo-v2.5', name: 'MiMo V2.5', description: '均衡性能' },
    ]
  },
  {
    name: '小米 MiMo (套餐)',
    url: 'https://token-plan-cn.xiaomimimo.com/v1',
    keyUrl: 'https://platform.xiaomimimo.com/console/plan-manage',
    models: [
      { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro', description: '最强能力' },
      { id: 'mimo-v2.5', name: 'MiMo V2.5', description: '均衡性能' },
    ]
  },
  {
    name: '通义千问',
    url: 'https://dashscope.aliyuncs.com/compatible-mode',
    keyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    models: [
      { id: 'qwen-plus', name: 'Qwen Plus', description: '均衡性能' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', description: '速度快' },
      { id: 'qwen-max', name: 'Qwen Max', description: '最强能力' },
    ]
  },
  {
    name: '智谱 GLM',
    url: 'https://open.bigmodel.cn/api/paas/v4',
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '免费快速' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '性能均衡' },
      { id: 'glm-4-long', name: 'GLM-4 Long', description: '长文本' },
    ]
  },
  {
    name: '豆包',
    url: 'https://ark.cn-beijing.volces.com/api/v3',
    keyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    models: [
      { id: 'doubao-1.5-pro-256k', name: 'Doubao 1.5 Pro', description: '旗舰模型' },
      { id: 'doubao-1.5-lite-32k', name: 'Doubao 1.5 Lite', description: '轻量快速' },
    ]
  },
  {
    name: 'Moonshot (Kimi)',
    url: 'https://api.moonshot.cn/v1',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', description: '8K上下文' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', description: '32K上下文' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', description: '128K长文本' },
    ]
  },
  {
    name: 'GPT (OpenAI)',
    url: 'https://api.openai.com/v1',
    keyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '性价比高' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '推理能力强' },
    ]
  },
  {
    name: 'Claude (Anthropic)',
    url: 'https://api.anthropic.com/v1',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '最新模型' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '快速高效' },
    ]
  },
  {
    name: '自定义',
    url: '',
    keyUrl: '',
    models: []
  }
];

export const DEFAULT_CONFIG = {
  url: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
};
