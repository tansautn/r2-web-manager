# TTPT Bot CLI Tools

CLI tools để quản lý handlers.

## Installation

Có 3 cách để sử dụng CLI tools:

### 1. Install Globally (Windows)

```bash
cd cli
npm install
npm link  # Tạo global symlink

# Sau đó có thể sử dụng từ bất kỳ đâu
ttpt add:webhook start
```

### 2. Sử dụng với npx (từ thư mục gốc)

```bash
# Cài đặt dependencies
cd cli && npm install && cd ..

# Windows (Git Bash)
npx tsx ./cli/index.ts add:webhook start

# Linux/Mac
npx ttpt add:webhook start
```

### 3. Sử dụng với npx (từ thư mục cli)

```bash
cd cli
npm install

# Windows (Git Bash)
npx tsx index.ts add:webhook start

# Linux/Mac
npx ttpt add:webhook start
```

## Basic Usage

### Webhook Handlers

Tạo một webhook handler mới (Telegram command):

```bash
ttpt add:webhook start
# => src/webhook_handlers/start.ts
```

### API Handlers

Tạo một API endpoint handler mới:

```bash
ttpt add:api users --method GET
# => src/handlers/users.ts
```

## Template System

Templates được lưu trong thư mục `src/cli/generators/stubs/`:

```
stubs/
├── webhook.stub.ts      # Template cho webhook handlers
├── api.stub.ts          # Template cho API handlers
├── api-generated.stub.ts     # Template cho API registry
└── api-generated.d.stub.ts   # Template cho API types
```

### Available Placeholders

#### Webhook Handlers
- `{{name}}`: Tên command (lowercase)
- `{{Name}}`: Tên command (capitalized)

Ví dụ:
```typescript
const logger = createLogger('{{name}}Command', LogScope.WEBHOOK);
export async function handle{{Name}}(context: TelegramContext, bot: Bot) {
  // ...
}
```

#### API Handlers
- `{{name}}`: Tên endpoint (lowercase)
- `{{Name}}`: Tên endpoint (capitalized)
- `{{method}}`: HTTP method (GET, POST, etc.)

Ví dụ:
```typescript
logger.info('Processing {{method}} /{{name}}');
export async function handle{{Name}}(context: Context) {
  // ...
}
```

## Advanced Usage

### Custom Templates

1. **Thêm Placeholders Mới**

```typescript
// src/cli/generators/webhook.ts
const handlerContent = processTemplate(template, {
  name: handlerName,
  Name: capitalize(handlerName),
  description: options.description || 'No description provided',  // thêm placeholder mới
  timestamp: new Date().toISOString()
});
```

Trong template:
```typescript
/**
 * {{description}}
 * Generated at: {{timestamp}}
 */
export async function handle{{Name}}() {
  // ...
}
```

2. **Conditional Content**

Sử dụng function trong `processTemplate`:

```typescript
// src/cli/generators/utils.ts
export function processTemplate(template: string, data: TemplateData): string {
  // Process conditionals first
  template = template.replace(
    /\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs,
    (_, condition, content) => {
      return data[condition] ? content : '';
    }
  );

  // Process regular placeholders
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in data) {
      return data[key];
    }
    return match;
  });
}
```

Trong template:
```typescript
{{#if hasDescription}}
/**
 * {{description}}
 */
{{/if}}
export async function handle{{Name}}() {
  // ...
}
```

3. **Template Inheritance**

Tạo base template và extend nó:

```typescript
// stubs/base.stub.ts
import { createLogger, LogScope } from '../utils/logger';

const logger = createLogger('{{name}}{{type}}', LogScope.{{scope}});

export async function handle{{Name}}() {
  // ... common logic
}

// stubs/webhook.stub.ts
{{> base.stub.ts}}  // include base template

export async function handle{{Name}}(context: TelegramContext, bot: Bot) {
  // ... webhook specific logic
}
```

4. **Custom Formatters**

```typescript
// src/cli/generators/utils.ts
export interface TemplateFormatter {
  [key: string]: (value: string) => string;
}

export function processTemplate(
  template: string, 
  data: TemplateData,
  formatters: TemplateFormatter = {}
): string {
  return template.replace(/\{\{(\w+)(?::(\w+))?\}\}/g, (match, key, formatter) => {
    if (!(key in data)) return match;
    
    const value = data[key];
    if (formatter && formatter in formatters) {
      return formatters[formatter](value);
    }
    return value;
  });
}

// Usage
const formatters = {
  upper: (s: string) => s.toUpperCase(),
  camel: (s: string) => s.replace(/-([a-z])/g, g => g[1].toUpperCase())
};

const result = processTemplate(template, data, formatters);
```

Trong template:
```typescript
const COMMAND = '{{name:upper}}';  // convert to uppercase
const funcName = '{{name:camel}}'; // convert to camelCase
```

### Best Practices

1. **Template Organization**
   - Giữ templates đơn giản và tập trung vào một mục đích
   - Sử dụng comments để giải thích các placeholders
   - Tách logic phức tạp thành các helper functions

2. **Versioning Templates**
   - Lưu templates trong version control
   - Document các thay đổi trong templates
   - Cân nhắc backward compatibility

3. **Error Handling**
   - Validate template data trước khi processing
   - Cung cấp default values cho optional placeholders
   - Log template processing errors

4. **Testing**
   - Unit test cho template processing
   - Snapshot test cho generated code
   - Integration test với actual handlers

5. **Maintenance**
   - Review và update templates định kỳ
   - Collect feedback từ team về template usage
   - Keep templates aligned với coding standards 