// lib/with-auth-required.tsx
import { ReactNode } from "react";
import { useAuthStore } from "./auth-store";

/**
 * HOC to wrap components that require authentication
 * Shows a message if user is not authenticated
 */
export function withAuthRequired<P extends object>(
  Component: React.ComponentType<P>,
  fallbackMessage: string = "Please sign in to access this feature"
) {
  return function AuthProtectedComponent(props: P) {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center p-4 bg-purple-950/30 border border-purple-500/20 rounded-lg">
          <p className="text-gray-400 text-sm">{fallbackMessage}</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Simple button wrapper that requires auth
 */
interface AuthButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

export function AuthButton({
  onClick,
  children,
  className = "",
  disabled = false,
  ...rest
}: AuthButtonProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <button
        disabled={true}
        className={`${className} opacity-50 cursor-not-allowed`}
        title="Please sign in to save changes"
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
