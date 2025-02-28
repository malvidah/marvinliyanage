import { CheckIcon, XIcon, TrashIcon } from '@heroicons/react/outline';

export default function EditingControls({ onSave, onDelete }) {
  return (
    <div className="flex items-center space-x-2">
      <button 
        className="p-2 rounded-full bg-purple-600 text-white"
        onClick={onSave}
        aria-label="Save changes"
      >
        <CheckIcon className="h-5 w-5" />
      </button>
      
      <button 
        className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600" 
        onClick={onDelete}
        aria-label="Delete page"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
} 