# Development Instructions for UI (Base)

This repository is a shared/base React UI used as a starting point for projects in this workspace. Some identifiers may still be branded (e.g., package names) — treat them as placeholders unless the current project explicitly standardizes them.

Follow these instructions when working on this codebase.

## Tech Stack

### Core Framework
- **React** with **Vite** as the build tool
- **TypeScript** for all code - use `.tsx` for components, `.ts` for utilities
- Use functional components exclusively
- Prefer **React Hooks** over class components

### State Management & Data Fetching
- **TanStack Query** (React Query) for server state management and data fetching
- **TanStack React Router** for file-based routing and navigation
- **Zustand** for global client state management (prefer over Context API for complex state)
- **Axios** for HTTP requests (use with TanStack Query)
- Use React hooks for local component state (`useState`, `useReducer`)

### Validation
- **Zod** for schema validation
- Use Zod schemas for form validation, API response validation, and type inference

### Date/Time Handling
- **Day.js** for all datetime operations
- Do NOT use native JavaScript Date objects
- Import dayjs functions as needed: `import dayjs from 'dayjs'`

### UI Components
- **Radix UI** for accessible, unstyled component primitives
- Use Radix UI components as base and style with Tailwind CSS
- Prefer Radix UI over custom implementations for complex components (dialogs, dropdowns, tooltips, etc.)

### Styling
- **Tailwind CSS** for all styling
- Use utility classes, avoid inline styles
- Create reusable components for common patterns
- Style Radix UI components with Tailwind classes

## Code Style & Conventions

### Component Structure
1. Use functional components with hooks
2. **Prefer creating reusable components** - Extract common UI patterns into reusable components
3. Prefer custom hooks for reusable logic
4. Keep components small and focused
5. Extract complex logic into custom hooks
6. Create components for repeated UI patterns (buttons, cards, inputs, etc.)

### File Organization
- **Routing**: Use **TanStack React Router** for file-based routing - routes are defined as files in `src/routes/` directory
- Components: `src/components/`
- Hooks: `src/hooks/`
- Utils: `src/utils/`
- Types/Schemas: `src/types/` or `src/schemas/`
  - **Prefer separating datatypes into different files** - Each type/interface/schema should be in its own file when possible, or grouped logically by domain
- API/Queries: `src/api/` or `src/queries/`
- Stores: `src/stores/` (Zustand stores)

#### Folder Structure

The UI code lives under `src/` and should follow this structure:

```
src/
  api/                # Axios API clients (thin endpoint wrappers)
  queries/            # TanStack Query query/mutation modules (keys, hooks, helpers)
  routes/             # TanStack React Router file-based routes (pages)
  components/         # Reusable UI components
    datatable/        # Datatable system (components + state hook + utils)
  stores/             # Zustand stores (global client state)
  schemas/            # Zod schemas (validation + inferred types)
  types/              # TypeScript-only types/interfaces (no runtime logic)
  hooks/              # Reusable hooks (not route-specific)
  utils/              # Shared utilities (e.g., `cn`, `dayjs`, permissions, guards)
  css/                # Legacy/component CSS (use Tailwind first; keep minimal)
  assets/             # Static images used by the app
  main.tsx            # App bootstrap / providers
  routeTree.gen.ts    # Generated route tree (DO NOT edit by hand)
```

Routing notes:
- Route files go in `src/routes/`. Nested folders create nested routes (e.g., `routes/devices/index.tsx`, `routes/devices/$deviceId.tsx`).
- Dynamic route params use `$param` naming (e.g., `$deviceId.tsx`).
- `src/routeTree.gen.ts` is generated; if routes change, regenerate it using the project’s TanStack Router generation workflow.

### Naming Conventions
- Prefer kebab-case for new files (e.g., `user-profile.tsx`, `use-user-data.ts`, `format-date.ts`).
- This repo contains some legacy/shared components using snake_case filenames (e.g., `confirmation_dialog.tsx`, `notification_toast.tsx`). Do **not** rename existing files; follow the local folder pattern when adding a sibling.
- Types/Interfaces: kebab-case (e.g., `user-types.ts`)
- Constants: UPPER_SNAKE_CASE

## Best Practices

### Using Axios
```typescript
import axios from 'axios';

// Create axios instance with base config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for auth, error handling, etc.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use with TanStack Query
export async function fetchUser(userId: string) {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
}
```

### Using TanStack Query with Axios
```typescript
// Example query hook using Axios
import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '@/api/users';

export function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
}
```

### Using Zustand
```typescript
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

// Usage in component
function UserProfile() {
  const { user, setUser } = useUserStore();
  // ...
}
```

### Using Zod for Validation
```typescript
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive(),
});

// Use for validation
const result = userSchema.safeParse(data);
if (result.success) {
  // TypeScript knows the type
  const user: z.infer<typeof userSchema> = result.data;
}
```

### Using Day.js
```typescript
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

// Always use dayjs instead of Date
const formatted = dayjs().format('YYYY-MM-DD');
const relative = dayjs(date).fromNow();
```

### Custom Hooks Pattern
```typescript
// Prefer extracting logic into custom hooks
export function useFormattedDate(date: string | Date) {
  return useMemo(() => {
    return dayjs(date).format('DD MMM YYYY');
  }, [date]);
}
```

### Using TanStack React Router
- Use TanStack React Router for file-based routing
- Create route files in `src/routes/` directory (e.g., `dashboard.tsx`, `users.tsx`)
- Use the `__root.tsx` file for the root layout
- Routes are automatically generated from the file structure
- Use `Link` component from `@tanstack/react-router` for navigation
- Access route params and search params using hooks: `useParams()`, `useSearch()`, `useNavigate()`

```typescript
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';

// Navigation example
function Navigation() {
  const navigate = useNavigate();
  
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/users">Users</Link>
      <button onClick={() => navigate({ to: '/settings' })}>Settings</button>
    </nav>
  );
}

// Route with params
function UserDetail() {
  const { userId } = useParams({ from: '/users/$userId' });
  const search = useSearch({ from: '/users/$userId' });
  // ...
}
```

### Using Radix UI
- Use Radix UI primitives for complex components (Dialog, DropdownMenu, Select, etc.)
- Style Radix UI components with Tailwind CSS
- Radix UI provides accessibility and behavior, Tailwind provides styling
- Import only needed components: `import * as Dialog from '@radix-ui/react-dialog'`

```typescript
import * as Dialog from '@radix-ui/react-dialog';

export function Modal({ children, open, onOpenChange }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg">
          {children}
          <Dialog.Close className="absolute top-4 right-4">×</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Tailwind CSS Usage
- Use Tailwind utility classes
- Create component variants using conditional classes
- Use `clsx` or `cn` utility for conditional classes
- Avoid custom CSS unless absolutely necessary
- Style Radix UI components with Tailwind classes

### Creating Reusable Components
- **Always create components for reusable UI patterns**
- Extract repeated JSX into components
- Make components flexible with props
- Use TypeScript interfaces for component props
- Create base components that can be composed

```typescript
// Example: Reusable Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick,
  disabled 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## Common Patterns

### Form Handling with Zod - Inline Validation

**Always use Zod for form validation with inline error display.** Validation errors must appear directly in the form below each field, not as notifications.

#### Pattern:
1. Use `safeParse()` to validate form data
2. Store validation errors in state (`Record<string, string>`)
3. Display errors inline below each field
4. Clear errors when fields change
5. Apply error styling to inputs (red border) when validation fails

```typescript
import { z } from 'zod';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  client_id: z.number().int().positive('Please select a client'),
});

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    client_id: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate using Zod safeParse
    const result = formSchema.safeParse(formData);
    
    if (!result.success) {
      // Map Zod errors to form errors
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setFormErrors(errors);
      return;
    }
    
    // Clear errors if validation passes
    setFormErrors({});
    
    // Proceed with submission
    // ... submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            clearFieldError('email');
          }}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.email
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {formErrors.email && (
          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
        )}
      </div>
      
      <div>
        <label>Password *</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            clearFieldError('password');
          }}
          className={`w-full px-3 py-2 border rounded ${
            formErrors.password
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {formErrors.password && (
          <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Rules:
- **Always validate on submit** using `safeParse()` - never use `parse()` which throws
- **Display errors inline** below each field, not as toast notifications
- **Clear errors** when the user starts typing/changing the field
- **Apply error styling** (red border) to inputs with errors
- **Use descriptive error messages** in Zod schema definitions
- **Reset errors** when form is closed or reset
- **Never show validation errors as notifications** - they must be inline in the form

### Date Display Component (Reusable Component Example)
```typescript
import dayjs from 'dayjs';

interface DateDisplayProps {
  date: string | Date;
  format?: string;
  className?: string;
}

export function DateDisplay({ 
  date, 
  format = 'DD MMM YYYY',
  className = '' 
}: DateDisplayProps) {
  return <span className={className}>{dayjs(date).format(format)}</span>;
}

// Usage: <DateDisplay date={user.createdAt} format="YYYY-MM-DD" />
```

### Query Hook with Error Handling
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/api/users';

export function useUsers() {
  const query = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

### Combining Zustand with TanStack Query
```typescript
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/stores/userStore';

export function useAuthenticatedUser() {
  const { user, setUser } = useUserStore();
  
  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    enabled: !user,
    onSuccess: (data) => {
      setUser(data);
    },
  });

  return { user, isLoading: query.isLoading };
}
```

### Popup Confirmation for Crucial Actions
**Always add confirmation dialogs for crucial actions** (delete, update, submit, etc.) using Radix UI Dialog:

```typescript
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'info',
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
          <Dialog.Title className="text-xl font-bold mb-2">{title}</Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-6">{description}</Dialog.Description>
          <div className="flex gap-3 justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-lg ${variantStyles[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Usage in component
function DeleteButton({ itemId }: { itemId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: deleteItem } = useMutation({
    mutationFn: () => deleteItemById(itemId),
    onSuccess: () => {
      // Show success notification (see notification pattern below)
    },
  });

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Delete
      </button>
      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteItem()}
      />
    </>
  );
}
```

### Loading Skeleton Pattern
**Always show loading skeleton UI** during data fetching or async operations:

```typescript
// Reusable Loading Skeleton Component
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

// Usage in component
function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {data?.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Popup Notification Pattern
**Always show popup notification** (toast/alert) upon success or failed action. Use Radix UI Toast or a notification system:

```typescript
import * as Toast from '@radix-ui/react-toast';
import { useState } from 'react';

// Notification Store (using Zustand)
interface NotificationStore {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
  }>;
  addNotification: (notification: Omit<NotificationStore['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Date.now().toString() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// Notification Component
export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white',
  };

  return (
    <Toast.Provider swipeDirection="right">
      {notifications.map((notification) => (
        <Toast.Root
          key={notification.id}
          className={`${typeStyles[notification.type]} rounded-lg p-4 shadow-lg`}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setTimeout(() => removeNotification(notification.id), 300);
            }
          }}
        >
          <Toast.Title className="font-bold">{notification.title}</Toast.Title>
          {notification.message && (
            <Toast.Description className="text-sm mt-1">
              {notification.message}
            </Toast.Description>
          )}
          <Toast.Close className="absolute top-2 right-2">×</Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed top-0 right-0 p-4 space-y-2 z-50" />
    </Toast.Provider>
  );
}

// Usage in mutations
function DeleteItemButton({ itemId }: { itemId: string }) {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { mutate: deleteItem, isPending } = useMutation({
    mutationFn: () => deleteItemById(itemId),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Item deleted',
        message: 'The item has been successfully deleted.',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Failed to delete the item. Please try again.',
      });
    },
  });

  return (
    <button
      onClick={() => deleteItem()}
      disabled={isPending}
      className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### Loading States on Actions
**Always put proper loading state on every action** - disable buttons, show loading indicators, update button text during async operations:

```typescript
// Button with loading state
function SubmitButton({ onSubmit }: { onSubmit: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {isLoading ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// Form with loading state
function UserForm({ userId }: { userId?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate: saveUser, isPending } = useMutation({
    mutationFn: (data: UserData) => saveUserData(userId, data),
    onSuccess: () => {
      // Show notification
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        saveUser(Object.fromEntries(formData) as UserData);
      }}
    >
      {/* Form fields */}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

// Action button with loading spinner
function ActionButton({ 
  onClick, 
  children, 
  variant = 'primary',
  isLoading 
}: { 
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

### Animation Transitions Pattern
**Always put simple animation transition for page changes and component appearance** - use CSS transitions and Tailwind animation utilities:

```typescript
// Page transition wrapper
import { Outlet } from '@tanstack/react-router';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {children}
    </div>
  );
}

// Component with fade-in animation
export function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {children}
    </div>
  );
}

// List item with stagger animation
export function AnimatedListItem({ 
  children, 
  index 
}: { 
  children: React.ReactNode;
  index: number;
}) {
  return (
    <div 
      className="animate-in fade-in slide-in-from-left-4 duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {children}
    </div>
  );
}

// Route component with page transition
export function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <PageTransition>
        <CardSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {data?.map((user, index) => (
          <AnimatedListItem key={user.id} index={index}>
            <UserCard user={user} />
          </AnimatedListItem>
        ))}
      </div>
    </PageTransition>
  );
}

// Modal/Dialog with animation
export function AnimatedDialog({ 
  open, 
  onOpenChange, 
  children 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Tailwind config for animations (add to tailwind.config.js)
// Make sure you have these animation utilities available:
// - animate-in
// - fade-in
// - slide-in-from-*
// - zoom-in-*
// - duration-*

// Example tailwind.config.js addition:
/*
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}
*/
```

## Important Rules

1. **Feature Development Checklist** - Always check API availability, existing features, existing components, and existing plugins before implementing
2. **Task Management** - Work on one task at a time, never attempt all tasks simultaneously
3. **Request Review** - Always ask for review after completing each task before proceeding
4. **Commit Confirmed Changes** - Always create a commit for confirmed/approved changes
5. **Commit Message Format** - Use `[TASK-XXX] Short description` format with task number prefix when available
6. **Ask Before Continuing** - Always ask for permission to continue to the next task unless explicitly told to continue
7. **Use TypeScript** - All code must be written in TypeScript, never JavaScript
8. **Always use hooks** - Prefer custom hooks for reusable logic
9. **Create reusable components** - Extract common UI patterns into reusable components
10. **Use Radix UI** - Use Radix UI primitives for complex accessible components (dialogs, dropdowns, etc.)
11. **Use Axios** - Use Axios for all HTTP requests, configure with interceptors
12. **Use Zustand** - Use Zustand for global client state, prefer over Context API
13. **Never use Date objects** - Always use dayjs for datetime operations
14. **Validate with Zod** - Use Zod schemas for all data validation
15. **Use TanStack Query** - For all server state and API calls (use with Axios)
16. **Use TanStack React Router** - Use TanStack React Router for file-based routing, organize routes as files in `src/routes/` directory
17. **Tailwind only** - Use Tailwind utility classes for styling, style Radix UI components with Tailwind
18. **Type safety** - Leverage Zod's type inference for TypeScript types, define proper interfaces for all props
19. **Separate datatypes** - Prefer separating datatypes into different files, grouping logically by domain
20. **Popup confirmations** - Always add popup confirmation dialog for every crucial action button clicked (delete, update, submit, etc.)
21. **Loading skeletons** - Always show loading skeleton UI during data fetching or async operations
22. **Popup notifications** - Always show popup notification (toast/alert) upon success or failed action
23. **Loading states on actions** - Put proper loading state on every action (buttons, forms, etc.) - disable buttons, show loading indicators, update button text during async operations
24. **Animation transitions** - Put simple animation transition for page changes and component appearance - use CSS transitions and Tailwind animation utilities for smooth user experience
25. **Animation on components** - Put simple animation transition for component appearance - use CSS transitions and Tailwind animation utilities for smooth user experience
26. **Reuse Existing Code** - Always check for existing features and update them instead of creating duplicates
27. **Reuse Existing Components** - Use existing components instead of creating new ones when possible
28. **Reuse Existing Packages** - Use existing plugins/packages instead of installing new ones when possible

## Feature Development Checklist

**Before implementing any feature, always check the following:**

1. **Check Backend API Availability**
   - Check if the required API endpoint(s) exist in the backend OpenAPI spec (`../be-nodejs/docs/04-api/openapi.yaml` in this workspace)
   - If the API does NOT exist:
     - Coordinate with backend team or create the API endpoint in the backend first
     - Ensure the API is documented in `../be-nodejs/docs/04-api/openapi.yaml`
   - If the API exists but needs modifications:
     - Update the API calls in the frontend accordingly
     - Ensure API documentation is updated

2. **Check Existing Features**
   - Search the codebase for existing implementations of similar features
   - Check existing routes, components, hooks, and stores
   - If a similar feature already exists:
     - **Update the existing feature** instead of creating a new one
     - Extend or modify the existing components/hooks rather than duplicating functionality
   - If no similar feature exists:
     - Proceed with creating a new feature following the established patterns

3. **Check Existing Components**
   - Before creating new UI components:
     - Check `src/components/` for existing reusable components that can be used or extended
     - Check if existing Radix UI components can be styled differently to meet the requirement
     - **Use existing components** instead of creating new ones when possible
   - Only create new components if:
     - No existing component can fulfill the requirement
     - The new component provides significantly different functionality
     - The requirement cannot be met with existing components

4. **Check Existing Plugins/Packages**
   - Before installing any new npm package or plugin:
     - Check `package.json` to see if a similar package is already installed
     - Check if existing packages can fulfill the requirement
     - **Use existing plugins/packages** instead of installing new ones when possible
   - Only install new packages if:
     - No existing package can fulfill the requirement
     - The new package provides significantly better functionality
     - The requirement cannot be met with existing tools

## Task Management and Commit Workflow

**When working on multiple tasks or a list of tasks, follow these guidelines:**

1. **Work Task by Task**
   - **Always work on one task at a time** - Never attempt to complete all tasks in a list simultaneously
   - Complete one task fully before moving to the next
   - This ensures focused work, better code quality, and easier review process

2. **Request Review for Each Task**
   - **Always ask for review** after completing each task
   - Present the changes made for the current task
   - Wait for confirmation/approval before proceeding to the next task
   - This allows for early feedback and prevents accumulating issues

3. **Commit Confirmed Changes**
   - **Always create a commit** for changes that have been confirmed/approved
   - Never commit unconfirmed or work-in-progress changes
   - Each task should result in at least one commit (or multiple logical commits if the task is large)

4. **Commit Message Format**
   - **Commit message format**: `[TASK-XXX] Short description of task`
   - If task number is available (e.g., TASK-123, ISSUE-456), use it as a prefix
   - If no task number is available, use a descriptive prefix like `[FEATURE]`, `[FIX]`, `[REFACTOR]`, etc.
   - Follow the task number with a short, clear description of what was done
   - Examples:
     - `[TASK-123] Add user profile page component`
     - `[TASK-456] Fix form validation error display`
     - `[FEATURE] Implement dark mode toggle`
     - `[FIX] Resolve routing issue in dashboard`

5. **Continue to Next Task**
   - **Always ask for permission** to continue to the next task unless explicitly told to continue without approval
   - After receiving review confirmation and creating the commit, ask: "Should I continue to the next task?"
   - Do not proceed to the next task automatically unless instructed to do so
   - This ensures proper workflow control and allows for prioritization changes

### Example Workflow:
```
1. Work on Task 1 → Complete implementation
2. Ask for review: "Task 1 is complete. Please review the changes."
3. Receive confirmation/feedback
4. Create commit: `[TASK-1] Add user profile page component`
5. Ask: "Should I continue to Task 2?"
6. Wait for approval before proceeding
7. Repeat for each subsequent task
```

## Development Workflow

1. **Follow Feature Development Checklist**: Complete all checks above before implementation
2. Write all code in TypeScript (`.tsx` for components, `.ts` for utilities)
3. Create components as functional components with TypeScript interfaces
4. **Create reusable components** for repeated UI patterns
5. Use Radix UI primitives for complex components (dialogs, dropdowns, tooltips, etc.)
6. Extract reusable logic into custom hooks
7. Use Zustand for global client state management
8. Use Axios for HTTP requests (configure with interceptors)
9. Use TanStack Query with Axios for server state and data fetching
10. Define Zod schemas for data validation
11. **Use TanStack React Router** for file-based routing - create route files in `src/routes/` directory
12. **Separate datatypes into different files**, grouping logically by domain
13. Style with Tailwind utility classes (including Radix UI components)
14. Use dayjs for all date/time formatting and calculations
15. **Add popup confirmation dialogs** for all crucial action buttons (delete, update, submit, etc.)
16. **Show loading skeletons** during data fetching and async operations
17. **Display popup notifications** (toast/alert) for success and error states after actions
18. **Put proper loading states on every action** - disable buttons, show loading indicators, update button text during async operations
19. **Add animation transitions** for page changes and component appearance - use CSS transitions and Tailwind animation utilities

## Example Component Template

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useUserStore } from '@/stores/userStore';
import { fetchData, updateData, deleteData } from '@/api/data';
import { useNotificationStore } from '@/stores/notificationStore';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

const dataSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  name: z.string(),
});

type Data = z.infer<typeof dataSchema>;

interface ExampleComponentProps {
  id: string;
}

export function ExampleComponent({ id }: ExampleComponentProps) {
  const { user } = useUserStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  // Query with loading skeleton
  const { data, isLoading } = useQuery({
    queryKey: ['example', id],
    queryFn: () => fetchData(id),
  });

  // Mutation with notifications
  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: (newName: string) => updateData(id, { name: newName }),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Update successful',
        message: 'The item has been updated successfully.',
      });
      setShowUpdateConfirm(false);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error.message || 'Failed to update the item. Please try again.',
      });
    },
  });

  const { mutate: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteData(id),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Delete successful',
        message: 'The item has been deleted successfully.',
      });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Failed to delete the item. Please try again.',
      });
    },
  });

  const formattedDate = useMemo(() => {
    if (!data) return null;
    return dayjs(data.createdAt).format('DD MMM YYYY');
  }, [data]);

  // Loading skeleton
  if (isLoading) {
    return <CardSkeleton />;
  }

  const validated = dataSchema.safeParse(data);
  if (!validated.success) {
    return <div className="text-red-500">Invalid data</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-xl font-bold">{validated.data.name}</h2>
      <p className="text-gray-600">{formattedDate}</p>
      
      {user && (
        <div className="mt-4 flex gap-2">
          {/* Update button with confirmation and loading state */}
          <button
            onClick={() => setShowUpdateConfirm(true)}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isUpdating && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isUpdating ? 'Updating...' : 'Update'}
          </button>

          {/* Delete button with confirmation and loading state */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isDeleting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {/* Update Confirmation Dialog */}
      <ConfirmationDialog
        open={showUpdateConfirm}
        onOpenChange={setShowUpdateConfirm}
        title="Update Item"
        description="Are you sure you want to update this item?"
        confirmLabel="Update"
        variant="info"
        onConfirm={() => updateItem('New Name')}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteItem()}
      />
    </div>
  );
}
```

