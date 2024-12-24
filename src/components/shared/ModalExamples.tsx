import { Button } from './Button.js';
import { Modal } from './Modal.js';
import { useModal } from '../../hooks/useModal.js';

export function ModalExamples() {
  const simpleModal = useModal();
  const successModal = useModal();
  const confirmModal = useModal();

  return (
    <div className="space-y-4">
      {/* Simple Modal */}
      <Button onClick={simpleModal.open}>Open Simple Modal</Button>
      <Modal isOpen={simpleModal.isOpen} onClose={simpleModal.close} title="Simple Modal">
        <p className="text-gray-600">
          This is a simple modal with just some text content.
        </p>
      </Modal>

      {/* Success Modal */}
      <Button onClick={successModal.open}>Open Success Modal</Button>
      <Modal 
        isOpen={successModal.isOpen} 
        onClose={successModal.close}
        size="sm"
        showClose={false}
      >
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">Your action was completed successfully.</p>
          <Button onClick={successModal.close} className="w-full">
            Continue
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Button onClick={confirmModal.open}>Open Confirm Modal</Button>
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={confirmModal.close}
        title="Confirm Action"
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to perform this action? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={confirmModal.close} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmModal.close} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}