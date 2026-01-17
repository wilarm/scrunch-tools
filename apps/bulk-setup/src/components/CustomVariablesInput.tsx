import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface CustomVariablesInputProps {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}

export function CustomVariablesInput({ variables, onChange }: CustomVariablesInputProps) {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      return;
    }

    const sanitizedName = newVarName.trim().toLowerCase().replace(/\s+/g, '_');

    onChange({
      ...variables,
      [sanitizedName]: newVarValue.trim(),
    });

    setNewVarName('');
    setNewVarValue('');
  };

  const handleRemoveVariable = (name: string) => {
    const newVariables = { ...variables };
    delete newVariables[name];
    onChange(newVariables);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddVariable();
    }
  };

  const variableEntries = Object.entries(variables);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          Custom Variables <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
      </div>

      {variableEntries.length > 0 && (
        <div className="space-y-2">
          {variableEntries.map(([name, value]) => (
            <div
              key={name}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200"
            >
              <code className="px-2 py-1 bg-white text-gray-800 rounded text-xs font-mono border border-gray-200">
                {`{{${name}}}`}
              </code>
              <span className="text-sm text-gray-600">=</span>
              <span className="text-sm text-gray-900 flex-1">{value || '(empty)'}</span>
              <button
                onClick={() => handleRemoveVariable(name)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remove variable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Variable name (e.g., industry_name)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <input
          type="text"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Value"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <button
          onClick={handleAddVariable}
          disabled={!newVarName.trim()}
          className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
            newVarName.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Add variable"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Add custom variables to use in your prompts. Variables will be formatted as{' '}
        <code className="px-1 py-0.5 bg-gray-100 text-gray-800 rounded">{'{{variable_name}}'}</code>
      </p>
    </div>
  );
}
