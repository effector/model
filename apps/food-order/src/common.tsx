import clsx from 'clsx';
import { ReactNode } from 'react';

export const Radio = ({
  name,
  checked,
  onClick,
}: {
  name: string;
  checked: boolean;
  onClick: () => void;
}) => (
  <label className="flex items-center space-x-3 cursor-pointer">
    <input
      type="radio"
      name={name}
      className="hidden"
      checked={checked}
      onClick={onClick}
    />
    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
      <svg
        className={clsx(!checked && 'hidden', 'w-4 h-4 text-teal-500')}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  </label>
);

export const Title = ({
  text,
  goBack,
}: {
  text: string;
  goBack: () => void;
}) => (
  <div className="p-4 flex items-center">
    <button className="text-xl font-bold mr-2" onClick={() => goBack()}>
      &larr;
    </button>
    <h1 className="text-3xl font-bold">{text}</h1>
  </div>
);

export const AddToOrder = ({
  onClick = () => {},
  children,
  disabled = false,
}: {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) => (
  <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200">
    <button
      onClick={() => onClick()}
      disabled={disabled}
      className={clsx(
        'w-full text-white py-3 rounded-lg',
        disabled ? 'bg-gray-300' : 'bg-teal-500'
      )}
    >
      {children}
    </button>
  </div>
);
