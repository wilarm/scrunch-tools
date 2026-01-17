import { useState } from 'react';
import { Eye, Edit2, Plus, X, RefreshCw, Loader2 } from 'lucide-react';
import { BrandSubmissionState, Persona, Competitor, EnrichmentStatus } from '../types/brand';

interface PreviewTableProps {
  brands: BrandSubmissionState[];
  onUpdate: (id: string, updates: Partial<BrandSubmissionState>, fieldName?: string) => void;
  onRetryEnrich: (id: string) => void;
}

export function PreviewTable({ brands, onUpdate, onRetryEnrich }: PreviewTableProps) {
  const [editingModal, setEditingModal] = useState<{
    brandId: string;
    field: 'personas' | 'competitors';
  } | null>(null);

  if (brands.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No brands to preview. Add websites and configure templates above.</p>
      </div>
    );
  }

  const getBrand = (id: string) => brands.find(b => b.id === id);

  return (
    <>
      <div className="bg-white border-t border-white border-b border-white">
        <div className="px-6 py-4 border-b border-white bg-white">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Brand Preview</h2>
            <span className="ml-auto text-sm text-gray-600">{brands.length} brands</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Enrichment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">
                  Website
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">
                  Alt Names
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">
                  Alt Websites
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[300px]">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                  Personas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">
                  Key Topics
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                  Competitors
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white bg-white">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 bg-white">
                  <td className="px-4 py-3 bg-white">
                    <StatusBadge status={brand.status} errorMessage={brand.errorMessage} />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <EnrichmentBadge
                      status={brand.enrichmentStatus}
                      errorMessage={brand.enrichmentError}
                      onRetry={() => onRetryEnrich(brand.id)}
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <input
                      type="text"
                      value={brand.website}
                      onChange={(e) => onUpdate(brand.id, { website: e.target.value }, 'website')}
                      className="w-full px-2 py-1 text-sm border border-white bg-white rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <input
                      type="text"
                      value={brand.name}
                      onChange={(e) => onUpdate(brand.id, { name: e.target.value }, 'name')}
                      className="w-full px-2 py-1 text-sm border border-white bg-white rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <TagInput
                      values={brand.alternative_names}
                      onChange={(values) => onUpdate(brand.id, { alternative_names: values }, 'alternative_names')}
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <TagInput
                      values={brand.alternative_websites}
                      onChange={(values) => onUpdate(brand.id, { alternative_websites: values }, 'alternative_websites')}
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <textarea
                      value={brand.description}
                      onChange={(e) => onUpdate(brand.id, { description: e.target.value }, 'description')}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-white bg-white rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <button
                      onClick={() => setEditingModal({ brandId: brand.id, field: 'personas' })}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      {brand.personas.length} persona{brand.personas.length !== 1 ? 's' : ''}
                    </button>
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <TagInput
                      values={brand.key_topics}
                      onChange={(values) => onUpdate(brand.id, { key_topics: values }, 'key_topics')}
                    />
                  </td>
                  <td className="px-4 py-3 bg-white">
                    <button
                      onClick={() => setEditingModal({ brandId: brand.id, field: 'competitors' })}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      {brand.competitors.length} competitor{brand.competitors.length !== 1 ? 's' : ''}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingModal && (
        <EditModal
          brand={getBrand(editingModal.brandId)!}
          field={editingModal.field}
          onClose={() => setEditingModal(null)}
          onSave={(updates) => {
            onUpdate(editingModal.brandId, updates, editingModal.field);
            setEditingModal(null);
          }}
        />
      )}
    </>
  );
}

function StatusBadge({ status, errorMessage }: { status: string; errorMessage?: string }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-700',
    loading: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="group relative">
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
      {errorMessage && (
        <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

function EnrichmentBadge({
  status,
  errorMessage,
  onRetry,
}: {
  status: EnrichmentStatus;
  errorMessage?: string;
  onRetry: () => void;
}) {
  const styles = {
    not_enriched: 'bg-gray-100 text-gray-600',
    enriching: 'bg-blue-100 text-blue-700',
    enriched: 'bg-green-100 text-green-700',
    enrich_error: 'bg-red-100 text-red-700',
  };

  const labels = {
    not_enriched: 'not enriched',
    enriching: 'enriching...',
    enriched: 'enriched',
    enrich_error: 'error',
  };

  return (
    <div className="group relative flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
        {status === 'enriching' && (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        {labels[status]}
      </span>
      {status === 'enrich_error' && (
        <>
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
          {errorMessage && (
            <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
              {errorMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TagInput({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim()) {
      onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {values.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
          >
            {tag}
            <button
              onClick={() => removeTag(index)}
              className="hover:text-blue-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type and press Enter"
          className="flex-1 px-2 py-1 text-xs border border-white bg-white rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          onClick={addTag}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EditModal({
  brand,
  field,
  onClose,
  onSave,
}: {
  brand: BrandSubmissionState;
  field: 'personas' | 'competitors';
  onClose: () => void;
  onSave: (updates: Partial<BrandSubmissionState>) => void;
}) {
  const [localData, setLocalData] = useState(
    field === 'personas' ? [...brand.personas] : [...brand.competitors]
  );

  const handleSave = () => {
    onSave({ [field]: localData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {field === 'personas' ? 'Personas' : 'Competitors'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {field === 'personas' ? (
            <PersonasEditor
              personas={localData as Persona[]}
              onChange={setLocalData}
            />
          ) : (
            <CompetitorsEditor
              competitors={localData as Competitor[]}
              onChange={setLocalData}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonasEditor({ personas, onChange }: { personas: Persona[]; onChange: (personas: Persona[]) => void }) {
  const add = () => {
    onChange([...personas, { name: '', description: '' }]);
  };

  const remove = (index: number) => {
    onChange(personas.filter((_, i) => i !== index));
  };

  const update = (index: number, field: keyof Persona, value: string) => {
    const updated = [...personas];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {personas.map((persona, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
          <button
            onClick={() => remove(index)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-3 pr-8">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={persona.name}
                onChange={(e) => update(index, 'name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={persona.description}
                onChange={(e) => update(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2 text-sm text-blue-600 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Persona
      </button>
    </div>
  );
}

function CompetitorsEditor({ competitors, onChange }: { competitors: Competitor[]; onChange: (competitors: Competitor[]) => void }) {
  const add = () => {
    onChange([...competitors, { name: '', alternative_names: [], websites: [] }]);
  };

  const remove = (index: number) => {
    onChange(competitors.filter((_, i) => i !== index));
  };

  const update = (index: number, updates: Partial<Competitor>) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {competitors.map((competitor, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
          <button
            onClick={() => remove(index)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-3 pr-8">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={competitor.name}
                onChange={(e) => update(index, { name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alternative Names</label>
              <TagInput
                values={competitor.alternative_names}
                onChange={(values) => update(index, { alternative_names: values })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Websites</label>
              <TagInput
                values={competitor.websites}
                onChange={(values) => update(index, { websites: values })}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2 text-sm text-blue-600 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Competitor
      </button>
    </div>
  );
}
