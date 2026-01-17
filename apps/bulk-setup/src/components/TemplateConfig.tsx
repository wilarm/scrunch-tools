import { FileText, Plus, X } from 'lucide-react';
import { TemplateConfig, Persona } from '../types/brand';

interface TemplateConfigProps {
  template: TemplateConfig;
  onChange: (template: TemplateConfig) => void;
}

export function TemplateConfigComponent({ template, onChange }: TemplateConfigProps) {
  const addPersona = () => {
    onChange({
      ...template,
      personasTemplate: [
        ...template.personasTemplate,
        { name: '', description: '' },
      ],
    });
  };

  const removePersona = (index: number) => {
    onChange({
      ...template,
      personasTemplate: template.personasTemplate.filter((_, i) => i !== index),
    });
  };

  const updatePersona = (index: number, field: keyof Persona, value: string) => {
    const updated = [...template.personasTemplate];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...template, personasTemplate: updated });
  };

  const addKeyTopic = () => {
    onChange({
      ...template,
      keyTopics: [...template.keyTopics, ''],
    });
  };

  const removeKeyTopic = (index: number) => {
    onChange({
      ...template,
      keyTopics: template.keyTopics.filter((_, i) => i !== index),
    });
  };

  const updateKeyTopic = (index: number, value: string) => {
    const updated = [...template.keyTopics];
    updated[index] = value;
    onChange({ ...template, keyTopics: updated });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Template Configuration</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description Template
          </label>
          <textarea
            id="description"
            value={template.descriptionTemplate}
            onChange={(e) => onChange({ ...template, descriptionTemplate: e.target.value })}
            placeholder="Enter description template with placeholders like {{primary_location}}"
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Available placeholders: {'{{primary_location}}'}, {'{{name}}'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Personas Template
            </label>
            <button
              onClick={addPersona}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Persona
            </button>
          </div>
          <div className="space-y-3">
            {template.personasTemplate.map((persona, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 relative">
                <button
                  onClick={() => removePersona(index)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-3 pr-8">
                  <input
                    type="text"
                    value={persona.name}
                    onChange={(e) => updatePersona(index, 'name', e.target.value)}
                    placeholder="Persona name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <textarea
                    value={persona.description}
                    onChange={(e) => updatePersona(index, 'description', e.target.value)}
                    placeholder="Persona description (supports placeholders)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            ))}
            {template.personasTemplate.length === 0 && (
              <p className="text-sm text-gray-500 italic">No personas added yet</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Key Topics
            </label>
            <button
              onClick={addKeyTopic}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Topic
            </button>
          </div>
          <div className="space-y-2">
            {template.keyTopics.map((topic, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => updateKeyTopic(index, e.target.value)}
                  placeholder="Enter key topic"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                <button
                  onClick={() => removeKeyTopic(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {template.keyTopics.length === 0 && (
              <p className="text-sm text-gray-500 italic">No key topics added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
