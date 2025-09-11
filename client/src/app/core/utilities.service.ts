import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {
    private debounceTimer: any;

    generateSchemaFromObject(obj: any): any {
        if (Array.isArray(obj)) {
          return { type: 'array', items: this.generateSchemaFromObject(obj[0] || {}) };
        } 
        if (typeof obj === 'object' && obj !== null) {
          return {
            type: 'object',
            properties: Object.fromEntries(
              Object.entries(obj).map(([key, value]) => [key, this.generateSchemaFromObject(value)])
            ),
            required: Object.keys(obj)
          };
        }
        return { type: typeof obj };
      }
    
      createProxy<T extends object>(obj: T, onChange: () => void): T {
        return new Proxy(obj, {
          get: (target, prop, receiver) => {
            const value = Reflect.get(target, prop, receiver);
            
            // Ensure nested objects are also proxied
            if (typeof value === 'object' && value !== null) {
              return this.createProxy(value, onChange); 
            }
            return value;
          },
          set: (target, prop, value) => {
            const currentValue = Reflect.get(target, prop);
            // Only update and trigger onChange if the value has changed
            if (currentValue !== value) {
              Reflect.set(target, prop, value);
              
              // Debounce change detection
              clearTimeout(this.debounceTimer);
              this.debounceTimer = setTimeout(() => onChange(), 500);
            }
            return true;
          }
        });
      }
}