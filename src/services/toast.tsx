import React from 'react';
import { toast as hotToast } from 'react-hot-toast';

export type ToastOptions = {
  title?: string;
  description: string;
  status: 'success' | 'error' | 'info' | 'warning';
};

const toast = ({ title, description, status }: ToastOptions) => {
  const message = title ? `${title}\n${description}` : description;

  switch (status) {
    case 'success':
      return hotToast.success(message);
    case 'error':
      return hotToast.error(message);
    case 'info':
      return hotToast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
            </div>
          </div>
        </div>
      ));
    case 'warning':
      return hotToast(message, {
        icon: '⚠️',
        style: {
          borderRadius: '10px',
          background: '#FEF3C7',
          color: '#92400E',
        },
      });
    default:
      return hotToast(message);
  }
};

export default toast;
