<div className="absolute top-4 right-4 flex items-center space-x-2">
  <button 
    className="p-2 rounded-full bg-purple-600 text-white"
    onClick={handleSave}
  >
    <CheckIcon className="h-5 w-5" />
  </button>
  
  <button 
    className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600"
    onClick={handleDelete}
  >
    <TrashIcon className="h-5 w-5" />
  </button>
</div> 