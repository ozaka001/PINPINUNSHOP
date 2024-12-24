import React from 'react';
import { X } from 'lucide-react';

interface PaymentSlipModalProps {
  slipUrl: string;
  onClose: () => void;
}

const PaymentSlipModal: React.FC<PaymentSlipModalProps> = ({ slipUrl, onClose }) => {
  if (!slipUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Payment Slip</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <img
            src={slipUrl}
            alt="Payment Slip"
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentSlipModal;
