import { WorkerMeshOutput, EvalResult } from './cad.worker';

class CADWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Lazy init
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./cad.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, payload, error } = e.data;
        const pending = this.pendingRequests.get(id);
        if (!pending) return;

        this.pendingRequests.delete(id);

        if (type === 'INIT_SUCCESS') {
          pending.resolve(true);
        } else if (type === 'INIT_ERROR') {
          pending.reject(new Error(error || 'Failed to initialize CAD Kernel'));
        } else if (type === 'EVAL_SUCCESS') {
          pending.resolve({ success: true, ...payload });
        } else if (type === 'EVAL_ERROR') {
          pending.resolve({ success: false, ...payload });
        } else if (type === 'EXPORT_SUCCESS') {
          pending.resolve(payload);
        } else if (type === 'EXPORT_ERROR') {
          pending.reject(new Error(payload?.error || 'Failed to export model'));
        }
      };
    }
    return this.worker;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        const id = 'init_' + Math.random().toString(36).substring(2, 9);
        this.pendingRequests.set(id, {
          resolve: () => {
            this.isInitialized = true;
            resolve();
          },
          reject,
        });
        this.getWorker().postMessage({ id, type: 'INIT' });
      });
    }
    return this.initPromise;
  }

  async evaluateCode(code: string): Promise<EvalResult> {
    await this.init();
    return new Promise((resolve) => {
      const id = 'eval_' + Math.random().toString(36).substring(2, 9);
      this.pendingRequests.set(id, { resolve, reject: resolve });
      this.getWorker().postMessage({ id, type: 'EVAL', payload: { code } });
    });
  }

  async exportModel(format: 'step' | 'stl'): Promise<{ blob: Blob; filename: string }> {
    await this.init();
    return new Promise((resolve, reject) => {
      const id = 'exp_' + Math.random().toString(36).substring(2, 9);
      this.pendingRequests.set(id, { resolve, reject });
      this.getWorker().postMessage({ id, type: 'EXPORT', payload: { format } });
    });
  }
}

export const cadClient = new CADWorkerClient();
export type { WorkerMeshOutput, EvalResult };
