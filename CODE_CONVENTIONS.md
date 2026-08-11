# Washouse — Code Conventions & Component Library

Guide for maintaining consistency across the codebase. Use when building new features or modules.

---

## File Organization

### Folder Structure
```
src/
├── context/          # React Context providers (state management)
├── pages/            # Route components (full pages)
├── layouts/          # Layout wrappers (Header, Sidebar, etc.)
├── components/       # Reusable UI components
│   ├── ui/          # Generic UI (Button, Modal, etc.)
│   ├── admin/       # Admin-specific (tables, modals)
│   ├── services/    # Service/order workflow
│   └── clients/     # Client management
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── assets/          # Static files (images, icons)
└── styles/          # CSS (Tailwind config, globals)
```

### File Naming

| Type | Naming | Example |
|------|--------|---------|
| Components | PascalCase | `MachineCard.jsx`, `AdminDashboard.jsx` |
| Pages | PascalCase | `HostDashboard.jsx`, `ReportsPage.jsx` |
| Contexts | PascalCase + Context suffix | `AuthContext.jsx`, `SalesContext.jsx` |
| Hooks | camelCase + use prefix | `useMetrics.js`, `useAuth.js` |
| Utils | camelCase | `formatCurrency.js`, `exportUtils.js` |
| Types/Constants | UPPER_SNAKE_CASE | `BRANCH_LICENSES`, `STATUS_OPTIONS` |
| CSS/Tailwind | No files (inline via `className=`) | N/A |

---

## Component Patterns

### 1. Functional Component (Standard)

```javascript
export default function ComponentName({ prop1, prop2, ...props }) {
  // State
  const [state, setState] = useState(null);

  // Hooks
  const { contextData } = useContext(SomeContext);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleClick = () => {
    // Logic
  };

  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### 2. Reusable UI Component (with CVA Variants)

```javascript
import { cva } from 'class-variance-authority';
import clsx from 'clsx';

const buttonVariants = cva(
  // Base styles
  'px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all duration-300',
  {
    variants: {
      variant: {
        primary: 'bg-washouse-blue text-white hover:shadow-lg shadow-blue-500/20',
        outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100'
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export default function Button({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### 3. Modal Component (with Framer Motion)

```javascript
import { motion, AnimatePresence } from 'framer-motion';

export default function MyModal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 4. Context Hook (State Management)

```javascript
import { createContext, useContext, useState, useCallback } from 'react';
import { useStorage } from './StorageContext';

const MyContext = createContext();

export function MyProvider({ children }) {
  const { supabase } = useStorage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('my_table')
        .select('*');
      if (error) throw error;
      setData(result || []);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addItem = useCallback(async (item) => {
    const { data: created, error } = await supabase
      .from('my_table')
      .insert([item])
      .select();
    if (error) throw error;
    setData([...data, created[0]]);
    return created[0];
  }, [data, supabase]);

  return (
    <MyContext.Provider value={{ data, loading, addItem }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

---

## Tailwind Styling Patterns

### 1. Card/Glass Morphism

```html
<div className="glass-card p-8 rounded-3xl border border-white/60 shadow-lg backdrop-blur-md">
  {/* Content */}
</div>
```

Utility: `glass-card` defined in Tailwind config (or inline):
```css
@apply bg-white/80 backdrop-blur-md shadow-lg rounded-3xl;
```

### 2. Button Primary

```html
<button className="px-6 py-3 rounded-2xl bg-washouse-blue text-white font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all active:scale-95">
  Click Me
</button>
```

Or use `<Button variant="primary">`.

### 3. Status Badges

```html
<!-- Available (Green) -->
<span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest border border-emerald-100">
  Available
</span>

<!-- Running (Blue) -->
<span className="px-3 py-1.5 rounded-full bg-blue-50 text-washouse-blue text-xs font-black uppercase tracking-widest border border-blue-100 animate-pulse">
  Running
</span>

<!-- Finished (Orange) -->
<span className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-widest border border-orange-100">
  Finished
</span>
```

### 4. Input Fields

```html
<input
  type="text"
  placeholder="Enter value"
  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 font-black uppercase tracking-widest focus:ring-2 focus:ring-washouse-blue focus:border-transparent transition-all"
/>
```

### 5. Responsive Grid

```html
<!-- 1 column on mobile, 2 on tablet, 3 on desktop -->
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

### 6. Animated Container

```html
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  className="space-y-4"
>
  {/* Content */}
</motion.div>
```

### 7. KPI/Stat Card

```html
<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
    Label
  </p>
  <p className="text-3xl font-black text-washouse-navy font-outfit">
    Value
  </p>
  <p className="text-xs text-gray-500 mt-2">
    Description
  </p>
</div>
```

---

## Color Palette (Tailwind)

### Custom Colors (Extend in tailwind.config.js)

```javascript
colors: {
  'washouse-blue': '#0090D7',
  'washouse-navy': '#1e293b',
  'washouse-subtle': '#f8fafc',
}
```

### Status Colors (Semantic)

- **Available:** `emerald-500` / `emerald-50`
- **Running:** `washouse-blue` / `blue-50`
- **Finished:** `orange-500` / `orange-50`
- **Maintenance:** `slate-400` / `slate-100`
- **Alert:** `red-500` / `red-50`
- **Success:** `green-500` / `green-50`

### Neutral Scale

```
Gray-50   (lightest background)
Gray-100  (light backgrounds, borders)
Gray-200  (borders, dividers)
Gray-400  (secondary text)
Gray-600  (body text)
Gray-900  (headings)
Black     (highest contrast)
```

### Shadows

```
shadow-sm     (minimal, UI borders)
shadow-md     (cards)
shadow-lg     (modals, dropdowns)
shadow-xl     (emphasized cards)
shadow-2xl    (modals, highlighted)

// With color tint:
shadow-blue-500/20   (blue tint, 20% opacity)
shadow-red-500/10    (red tint, 10% opacity)
```

---

## Typography

### Font Classes

```javascript
// Use Outfit font (sans-serif, rounded)
className="font-outfit"

// Font weights
font-normal      // 400
font-bold        // 700
font-black       // 900

// Sizes & styles
text-xs         // 12px
text-sm         // 14px
text-base       // 16px
text-lg         // 18px
text-xl         // 20px
text-2xl        // 24px
text-3xl        // 30px
text-5xl        // 48px (large headings)
text-6xl        // 60px (hero)

// Letter spacing (kerning)
tracking-tighter   // -0.05em (headings)
tracking-tight     // -0.025em
tracking-normal    // 0
tracking-wide      // 0.025em
tracking-widest    // 0.1em (uppercase labels)

// Line height
leading-none       // 1
leading-tight      // 1.25
leading-normal     // 1.5
leading-loose      // 1.75
```

### Typography Hierarchy

**Page Title (H1)**
```html
<h1 className="text-5xl font-black text-washouse-navy font-outfit tracking-tighter">
  Page Title
</h1>
```

**Section Title (H2)**
```html
<h2 className="text-2xl font-black text-washouse-navy font-outfit tracking-tight">
  Section Title
</h2>
```

**Card Title (H3)**
```html
<h3 className="text-lg font-black text-washouse-navy font-outfit">
  Card Title
</h3>
```

**Label (small caps)**
```html
<p className="text-xs font-black text-gray-400 uppercase tracking-widest">
  LABEL TEXT
</p>
```

**Body Text**
```html
<p className="text-sm font-normal text-gray-600">
  Body paragraph text with normal weight.
</p>
```

---

## Common Components Library

### Button.jsx

```javascript
<Button variant="primary" size="md" onClick={handleClick} disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

Variants: `primary`, `outline`, `ghost`, `secondary`  
Sizes: `sm`, `md`, `lg`

### Modal.jsx

```javascript
<Modal isOpen={isOpen} onClose={handleClose}>
  <h2>Title</h2>
  <p>Content</p>
  <Button onClick={handleClose}>Close</Button>
</Modal>
```

### Tooltip.jsx

```javascript
<Tooltip content="Help text" position="top">
  <span>Hover me</span>
</Tooltip>
```

Position: `top`, `bottom`, `left`, `right`

### Tabs.jsx

```javascript
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>
```

### KpiCard.jsx

```javascript
<KpiCard
  title="Metric Name"
  value={formatCurrency(1234)}
  icon={TrendingUp}
  change="+15.2%"
  changeType="positive"
  description="Supporting text"
/>
```

ChangeType: `positive`, `negative`, `neutral`

### StatusBadge.jsx

```javascript
<StatusBadge status="available" size="md" />
```

Status: `available`, `running`, `finished`, `maintenance`  
Sizes: `sm`, `md`, `lg`

### MachineCard.jsx

```javascript
<MachineCard
  id="machine_001"
  name="Lavadora 1"
  type="lavadora"
  status="running"
  timeLeft={25}
  onAction={handleAction}
  onToggleMaintenance={handleMaintenance}
  variant="default" // or "compact"
/>
```

### ExpenseModal.jsx

```javascript
<ExpenseModal
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
  initialData={expense}
/>
```

### EquipmentControlModal.jsx

```javascript
<EquipmentControlModal
  isOpen={isOpen}
  machine={selectedMachine}
  onClose={handleClose}
  onStartCycle={handleStartCycle}
/>
```

---

## API Integration Patterns

### Fetch Data with Error Handling

```javascript
const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('branch_id', branchId);

    if (error) throw error;
    setData(data || []);
  } catch (err) {
    console.error('Failed to fetch:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [supabase, branchId]);
```

### Create/Update with Optimistic UI

```javascript
const handleAddItem = async (item) => {
  // Optimistic update (instant UI feedback)
  setItems([...items, { ...item, id: 'temp_id' }]);

  try {
    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select();

    if (error) throw error;

    // Replace temp with real data
    setItems(items.map(i => i.id === 'temp_id' ? data[0] : i));
  } catch (err) {
    // Revert optimistic update on error
    setItems(items.filter(i => i.id !== 'temp_id'));
    setError(err.message);
  }
};
```

### Real-time Subscriptions

```javascript
useEffect(() => {
  const channel = supabase
    .channel('orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `branch_id=eq.${branchId}`
    }, (payload) => {
      console.log('Order changed:', payload);
      // Update local state
      if (payload.eventType === 'INSERT') {
        setOrders([...orders, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setOrders(orders.map(o => o.id === payload.new.id ? payload.new : o));
      }
    })
    .subscribe();

  return () => channel.unsubscribe();
}, [supabase, branchId, orders]);
```

---

## State Management Patterns

### Use Context for Global State

```javascript
import { useSales } from '../context/SalesContext';

export default function MyComponent() {
  const { sales, createSale } = useSales();

  return (
    <div>
      {sales.map(sale => (
        <div key={sale.id}>{sale.description}</div>
      ))}
      <button onClick={() => createSale({ /* ... */ })}>
        Add Sale
      </button>
    </div>
  );
}
```

### Use local useState for Component State

```javascript
const [formData, setFormData] = useState({
  name: '',
  email: ''
});

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};
```

### Use useCallback to Prevent Unnecessary Re-renders

```javascript
const handleSubmit = useCallback(async () => {
  const { data, error } = await supabase
    .from('items')
    .insert([formData]);
  if (!error) setFormData({});
}, [formData, supabase]);
```

---

## Error Handling & User Feedback

### Toast/Alert Patterns

```javascript
const [error, setError] = useState(null);

if (error) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      <strong>Error:</strong> {error}
      <button onClick={() => setError(null)} className="ml-2 font-bold">
        Dismiss
      </button>
    </div>
  );
}
```

### Loading States

```javascript
{loading ? (
  <div className="p-4 text-center">
    <p className="text-gray-500">Loading...</p>
  </div>
) : (
  // Content
)}
```

### Empty States

```javascript
{data.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-gray-400 font-black uppercase tracking-widest">
      No data yet
    </p>
  </div>
) : (
  // List
)}
```

---

## Performance Best Practices

1. **Memoize Components:** Use `React.memo()` for frequently re-rendered UI
   ```javascript
   export default React.memo(function MyComponent(props) { ... });
   ```

2. **useCallback for Functions:** Prevent unnecessary child re-renders
   ```javascript
   const handleClick = useCallback(() => { ... }, [dependency]);
   ```

3. **useMemo for Expensive Calculations:** Cache computed values
   ```javascript
   const total = useMemo(() => items.reduce((a, b) => a + b.price, 0), [items]);
   ```

4. **Conditional Rendering:** Use ternary or `&&` to avoid rendering hidden elements
   ```javascript
   {isVisible && <Component />}
   ```

5. **Key Prop on Lists:** Ensure stable keys (IDs, not indices)
   ```javascript
   {items.map(item => <Item key={item.id} {...item} />)}
   ```

---

## Code Comments

### When to Comment

- **Complex Logic:** Explain *why*, not what
  ```javascript
  // Batch updates to reduce re-renders during rapid changes
  const batchedUpdate = useMemo(() => { ... }, [deps]);
  ```

- **Non-obvious Constraints:** Document assumptions
  ```javascript
  // PIN must be exactly 4 digits (enforced by backend validation)
  const pin = '1234';
  ```

- **Workarounds:** Explain temporary solutions
  ```javascript
  // TODO: Replace with Supabase Auth when available
  // Currently using RPC verify_pin due to environment constraints
  ```

### Avoid Over-Commenting

❌ Bad:
```javascript
// Increment i by 1
i++;
```

✓ Good:
```javascript
// Skip deleted items in final tally
i++;
```

---

## Linting & Formatting

### ESLint Config
```
@eslint/js
eslint-plugin-react-hooks
eslint-plugin-react-refresh
```

### Run Checks
```bash
npm run lint
```

### Fix Auto-fixable Issues
```bash
npm run lint -- --fix
```

### No Semicolons
Vite default (Prettier-style, no trailing `;`).

---

## Git Commit Message Style

**Format:** `<type>: <subject>`

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure (no logic change)
- `perf:` Performance improvement
- `docs:` Documentation
- `style:` Formatting, no logic change
- `test:` Test-related

**Examples:**
```
feat: add order status notifications
fix: handle empty sales data in reports
refactor: simplify machine state logic
docs: update API schema reference
```

---

## Testing (If Applicable)

### Unit Test Pattern (Vitest)

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Quick Checklist for New Features

- [ ] File in correct folder (`pages/`, `components/`, `context/`)
- [ ] Named with correct convention (PascalCase for components)
- [ ] Uses existing UI components where possible (Button, Modal, etc.)
- [ ] Tailwind classes for styling (no inline CSS)
- [ ] Responsive breakpoints tested (`sm:`, `md:`, `lg:`)
- [ ] Integrates with correct Context (if data needed)
- [ ] Error handling with try/catch for async operations
- [ ] Loading state shown during data fetch
- [ ] Empty state handled (no results)
- [ ] Accessible (alt text, aria labels if needed)
- [ ] No console errors (lint passes: `npm run lint`)
- [ ] Commit message follows convention
