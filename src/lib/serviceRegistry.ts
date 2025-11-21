import fs from 'node:fs/promises';
import path from 'node:path';
import { ServiceDefinition, ServiceRuntime } from '../types';
import { SERVICES_DIR } from '../utils/paths';

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function injectEnv(template?: string) {
  if (!template) return template;
  return template.replace(/\$\{(.*?)\}/g, (_, key) => process.env[key] ?? '');
}

export class ServiceRegistry {
  private services = new Map<string, ServiceRuntime>();

  async init() {
    const entries = await fs.readdir(SERVICES_DIR, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const serviceDir = path.join(SERVICES_DIR, entry.name);
      const configPath = path.join(serviceDir, 'service.config.json');
      if (!(await pathExists(configPath))) continue;
      const raw = await fs.readFile(configPath, 'utf-8');
      let definition: ServiceDefinition;
      try {
        definition = JSON.parse(raw) as ServiceDefinition;
      } catch (error) {
        console.warn(`[serviceRegistry] ${configPath} 解析失败: ${(error as Error).message}`);
        continue;
      }
      if (!definition?.id) {
        console.warn(`[serviceRegistry] ${configPath} 缺少 id，已跳过`);
        continue;
      }
      const runtime = this.toRuntime(definition, serviceDir);
      this.services.set(runtime.id, runtime);
    }
    console.log(`[serviceRegistry] 已加载 ${this.services.size} 个服务`);
    return this.services;
  }

  private toRuntime(def: ServiceDefinition, serviceDir: string): ServiceRuntime {
    const proxyTarget = injectEnv(def.proxyTarget);
    const absHtmlPath = path.join(serviceDir, def.entryHtml);
    const absScriptPath = path.join(serviceDir, def.entryScript);
    const apiDocPath = path.join(serviceDir, 'API_DOCUMENT.md');
    const planPath = path.join(serviceDir, 'PLAN.md');
    const workblookPath = path.join(serviceDir, 'WORKBLOOK.md');
    return {
      ...def,
      requiredRoles: def.requiredRoles ?? [],
      proxyTarget: proxyTarget ?? def.proxyTarget,
      absHtmlPath,
      absScriptPath,
      apiDocPath,
      planPath,
      workblookPath,
    };
  }

  list() {
    return Array.from(this.services.values());
  }

  get(serviceId: string) {
    return this.services.get(serviceId);
  }

  async updateService(serviceId: string, updates: Partial<ServiceDefinition>) {
    const service = this.services.get(serviceId);
    if (!service) throw new Error('服务不存在');
    
    const serviceDir = path.dirname(path.dirname(service.absHtmlPath));
    const configPath = path.join(serviceDir, 'service.config.json');
    
    // 读取当前配置
    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw) as ServiceDefinition;
    
    // 更新允许修改的字段
    if (updates.name !== undefined) config.name = updates.name;
    if (updates.description !== undefined) config.description = updates.description;
    if (updates.requiredRoles !== undefined) config.requiredRoles = updates.requiredRoles;
    if (updates.proxyTarget !== undefined) config.proxyTarget = updates.proxyTarget;
    if (updates.proxyRewrite !== undefined) config.proxyRewrite = updates.proxyRewrite;
    
    // 写回文件
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // 重新加载到内存
    const runtime = this.toRuntime(config, serviceDir);
    this.services.set(serviceId, runtime);
    
    return runtime;
  }
}
