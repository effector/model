import React from 'react';

export const CartIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export const PlusIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

export const PencilIcon = ({
  className = 'w-6 h-6',
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

interface MainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  price?: number;
  count?: number;
  variant?: 'pill' | 'full';
  icon?: React.ReactNode;
}

export const MainButton = ({
  label,
  price,
  count,
  variant = 'full',
  className = '',
  icon,
  children,
  ...props
}: MainButtonProps) => {
  const baseClasses =
    'bg-[var(--theme-color,#70a423)] text-white font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl hover:brightness-90 whitespace-nowrap rounded-full px-10 py-4';

  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {icon !== undefined ? icon : <CartIcon className="w-6 h-6" />}
      {label && <span className="text-lg">{label}</span>}
      {count !== undefined && (
        <span className="bg-white/20 px-3 py-1 rounded-xl text-sm font-bold">
          {count}
        </span>
      )}
      {price !== undefined && price !== null && (
        <span className="text-xl">{price} ₽</span>
      )}
      {children}
    </button>
  );
};
