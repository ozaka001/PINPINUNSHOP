export interface ToastOptions {
  description: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
}

const defaultOptions: Partial<ToastOptions> = {
  duration: 3000,
  position: 'top'
};

function showToast(options: ToastOptions) {
  const finalOptions = { ...defaultOptions, ...options };
  
  // Create toast element
  const toastElement = document.createElement('div');
  toastElement.className = `fixed ${finalOptions.position === 'top' ? 'top-4' : 'bottom-4'} right-4 p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out opacity-0 translate-y-2`;
  
  // Set background color based on status
  switch (finalOptions.status) {
    case 'success':
      toastElement.classList.add('bg-green-500');
      break;
    case 'error':
      toastElement.classList.add('bg-red-500');
      break;
    case 'warning':
      toastElement.classList.add('bg-yellow-500');
      break;
    case 'info':
      toastElement.classList.add('bg-blue-500');
      break;
  }
  
  // Set content
  toastElement.textContent = finalOptions.description;
  
  // Add to DOM
  document.body.appendChild(toastElement);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toastElement.classList.remove('opacity-0', 'translate-y-2');
  });
  
  // Remove after duration
  setTimeout(() => {
    toastElement.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 300);
  }, finalOptions.duration);
}

const toast = {
  show: showToast,
  success: (description: string) => showToast({ description, status: 'success' }),
  error: (description: string) => showToast({ description, status: 'error' }),
  warning: (description: string) => showToast({ description, status: 'warning' }),
  info: (description: string) => showToast({ description, status: 'info' })
};

export default toast;
