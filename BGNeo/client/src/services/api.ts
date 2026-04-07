/**
 * API 服务模块
 * 提供与后端交互的所有 API 接口
 */
import axios, { type AxiosRequestConfig, type AxiosInstance } from 'axios';

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// 常量定义
const TOKEN_COOKIE = 'admin_token';
const CACHE_TTL = 30_000; // 缓存过期时间（毫秒）
const CACHE_MAX_SIZE = 100; // 缓存最大条目数

// Cookie 工具类
const cookieUtils = {
  /**
   * 获取 Cookie 值
   * @param name Cookie 名称
   */
  get: (name: string): string | null => {
    const parts = (`; ${document.cookie}`).split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() ?? null : null;
  },
  
  /**
   * 设置 Cookie 值
   * @param name Cookie 名称
   * @param value Cookie 值
   * @param days 过期天数
   */
  set: (name: string, value: string, days: number): void => {
    const exp = new Date(Date.now() + days * 864e5).toUTCString();
    const isDev = import.meta.env.DEV;
    document.cookie = `${name}=${value};expires=${exp};path=/;SameSite=${isDev ? 'Lax' : 'Strict'}`;
  },
  
  /**
   * 删除 Cookie
   * @param name Cookie 名称
   */
  delete: (name: string): void => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
});

// CSRF 令牌和会话 ID
let csrfToken: string | null = null;
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/**
 * 获取存储的认证令牌
 */
function getStoredToken(): string | null {
  return cookieUtils.get(TOKEN_COOKIE);
}

/**
 * 获取 CSRF 令牌
 */
async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await axios.get(`${api.defaults.baseURL}/csrf-token`, {
      headers: { 'X-Session-Id': sessionId },
    });
    csrfToken = (res.data as { data?: { token?: string } })?.data?.token || null;
    return csrfToken || '';
  } catch {
    return '';
  }
}

// 请求拦截器
api.interceptors.request.use(async (config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!['get', 'head', 'options'].includes(config.method || '')) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
      config.headers['X-Session-Id'] = sessionId;
    }
  }

  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF')) {
      csrfToken = null;
      const originalConfig = err.config;
      if (originalConfig && !originalConfig._retry) {
        originalConfig._retry = true;
        await fetchCsrfToken();
        return api(originalConfig);
      }
    }
    const msg = err.response?.data?.message || err.message || '网络请求失败';
    return Promise.reject(new Error(msg));
  }
);

// 缓存和请求管理
const pendingRequests = new Map<string, Promise<unknown>>();
const cacheStore = new Map<string, { data: unknown; ttl: number; timestamp: number }>();

/**
 * 生成缓存键
 * @param config 请求配置
 */
function getCacheKey(config: { url?: string; params?: Record<string, unknown>; method?: string }): string {
  const token = getStoredToken() || '';
  return `${config.method || 'GET'}:${config.url}:${JSON.stringify(config.params || {})}:${token.slice(0, 8)}`;
}

/**
 * 获取缓存数据
 * @param key 缓存键
 */
function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * 设置缓存数据
 * @param key 缓存键
 * @param data 缓存数据
 * @param ttl 过期时间
 */
function setCache(key: string, data: unknown, ttl = CACHE_TTL): void {
  if (cacheStore.size >= CACHE_MAX_SIZE) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey) cacheStore.delete(oldestKey);
  }
  cacheStore.set(key, { data, ttl, timestamp: Date.now() });
}

// 增强 get 方法，添加缓存
const rawGet = api.get.bind(api);
(api as unknown as Record<string, unknown>).get = function cachedGet(url: string, config?: AxiosRequestConfig) {
  const key = getCacheKey({ url, ...config });
  const cached = getCached<unknown>(key);
  if (cached) return Promise.resolve(cached);

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<unknown>;
  }

  const promise = rawGet(url, config)
    .then((res: unknown) => {
      setCache(key, res);
      pendingRequests.delete(key);
      return res;
    })
    .catch((err: Error) => {
      pendingRequests.delete(key);
      throw err;
    });

  pendingRequests.set(key, promise);
  return promise;
};

/**
 * 使缓存失效
 * @param pattern 缓存键匹配模式
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) cacheStore.delete(key);
  }
}

// 类型定义
export interface ArticleListParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: number | string;
  tagId?: number | string;
  sort?: string;
}

export interface CommentCreateData {
  content: string;
  article_id: number;
  nickname?: string;
  email?: string;
  parent_id?: number;
}

// API 接口定义
export const articleApi = {
  getList: (params?: ArticleListParams) => api.get('/articles', { params }),
  getById: (id: number) => api.get(`/articles/${id}`),
  getBySlug: (slug: string) => api.get(`/articles/${slug}`),
  search: (keyword: string) => api.get('/articles/search', { params: { q: keyword } }),
  delete: (id: number) => {
    invalidateCache('/articles');
    return api.delete(`/articles/${id}`);
  },
  update: (id: number, data: Partial<Record<string, unknown>>) => {
    invalidateCache('/articles');
    return api.put(`/articles/${id}`, data);
  },
};

export const categoryApi = {
  getList: () => api.get('/categories'),
  getTree: () => api.get('/categories?tree=true'),
};

export const tagApi = {
  getList: () => api.get('/tags'),
};

export const commentApi = {
  getList: (articleId: number) => api.get(`/articles/${articleId}/comments`),
  create: (data: CommentCreateData) => {
    invalidateCache('/comments');
    return api.post('/comments', data);
  },
  getPending: (params?: Record<string, string | number>) => api.get('/comments/pending', { params }),
  getStats: () => api.get('/comments/stats'),
  review: (id: number, status: string) => {
    invalidateCache('/comments');
    return api.put(`/comments/${id}/status`, { status });
  },
  delete: (id: number) => {
    invalidateCache('/comments');
    return api.delete(`/comments/${id}`);
  },
  batchReview: (ids: number[], status: string) => {
    invalidateCache('/comments');
    return api.post('/comments/batch-review', { ids, status });
  },
};

export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; password: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => {
    csrfToken = null;
    cookieUtils.delete(TOKEN_COOKIE);
    return api.post('/auth/logout');
  },
  changePassword: (data: { oldPassword: string; newPassword: string }) => api.put('/auth/password', data),
};

export const settingApi = {
  get: () => api.get('/settings'),
  getProfile: () => api.get('/profile'),
  update: (data: Partial<Record<string, unknown>>) => {
    invalidateCache('/settings');
    return api.put('/settings', data);
  },
};

// 认证令牌管理
export function getAuthToken(): string | null {
  return cookieUtils.get(TOKEN_COOKIE);
}

export function setAuthToken(token: string): void {
  cookieUtils.set(TOKEN_COOKIE, token, 7);
}

export function clearAuthToken(): void {
  cookieUtils.delete(TOKEN_COOKIE);
}

export default api;
