import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { fetchAndFlattenData, generateCSV, validateQueryFields, DEFAULT_LIMIT } from './utils/api';
import { ColumnSelector } from './components/ColumnSelector';
import { QueryFieldSelector } from './components/QueryFieldSelector';
import { RowExplosionWarningModal } from './components/RowExplosionWarningModal';

// Many-to-many fields that can cause row explosion
// Note: citations and competitors are pre-flattened in the export, so they don't cause row explosion
const MANY_TO_MANY_FIELDS = {
  responses: ['tags', 'key_topics'],
  query: ['ai_platform', 'tag', 'prompt_topic', 'competitor_id'],
};

function App() {
  const [activeTab, setActiveTab] = useState<'responses' | 'query'>('query');
  const [apiKey, setApiKey] = useState('');
  const [brandId, setBrandId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fetchAll, setFetchAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiCall, setShowApiCall] = useState(false);
  const [apiCallUrl, setApiCallUrl] = useState('');
  const [showRowExplosionWarning, setShowRowExplosionWarning] = useState(false);
  
  const manyToManyWarning = (
  <div className="border-t pt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
    <div className="flex gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-amber-900 mb-2">Many-to-many fields can create extra rows</h4>
        <p className="text-sm text-amber-800 mb-2">
          Some fields can have multiple values per response or prompt. Exporting them may multiply rows (row explosion).
          Common examples include <strong>tags</strong>, <strong>key_topics</strong>, <strong>prompt_topic</strong>, and other multi-value fields.
        </p>
        <p className="text-sm text-amber-800">
          Learn how to model these safely in spreadsheets and BI tools:{' '}
          <a
            href="https://helpcenter.scrunchai.com/en/articles/13133378-modeling-tags-from-the-responses-api-and-avoiding-row-explosion"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-amber-900"
          >
            Row explosion guide
          </a>
        </p>
      </div>
    </div>
  </div>
);


  const generateApiCallUrl = () => {
    if (!brandId || !startDate || !endDate) {
      return '';
    }

    const baseUrl = `https://api.scrunchai.com/v1/${brandId}/${activeTab}`;
    const params = new URLSearchParams();
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    params.append('limit', String(DEFAULT_LIMIT));
    params.append('offset', '0');

    if (selectedFields.length > 0) {
      params.append('fields', selectedFields.join(','));
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const handleShowApiCall = () => {
    const url = generateApiCallUrl();
    setApiCallUrl(url);
    setShowApiCall(true);
  };

  const getSelectedManyToManyFields = (): string[] => {
    const manyToManyList = MANY_TO_MANY_FIELDS[activeTab];
    if (activeTab === 'responses') {
      // For responses, check selectedColumns (or all columns if none selected)
      const columnsToCheck = selectedColumns.length > 0 ? selectedColumns : [];
      // If no columns selected, user gets all columns including many-to-many
      if (columnsToCheck.length === 0) {
        return manyToManyList; // All many-to-many fields will be included
      }
      // Only tags and key_topics cause row explosion (citations/competitors are pre-flattened)
      return columnsToCheck.filter(col => manyToManyList.includes(col));
    } else {
      // For query, check selectedFields
      return selectedFields.filter(field => manyToManyList.includes(field));
    }
  };

  const handleExportClick = () => {
    setError('');
    setSuccess('');

    if (!apiKey || !brandId || !startDate || !endDate) {
      setError('API Key, Brand ID, Start Date, and End Date are required');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End Date must be after Start Date');
      return;
    }

    if (activeTab === 'query') {
      const validation = validateQueryFields(selectedFields);
      if (!validation.valid) {
        setError(validation.error || 'Invalid field selection');
        return;
      }
    }

    // Check for multiple many-to-many fields
    const selectedManyToMany = getSelectedManyToManyFields();
    if (selectedManyToMany.length > 1) {
      setShowRowExplosionWarning(true);
      return;
    }

    // No warning needed, proceed with export
    performExport();
  };

  const handleConfirmExport = () => {
    setShowRowExplosionWarning(false);
    performExport();
  };

  const handleCancelExport = () => {
    setShowRowExplosionWarning(false);
  };

  const performExport = async () => {
    setProgress(0);
    setLoading(true);

    try {
      const data = await fetchAndFlattenData({
        apiKey,
        brandId,
        startDate,
        endDate,
        fetchAll,
        endpoint: activeTab,
        fields: activeTab === 'query' ? selectedFields : undefined,
        onProgress: (loaded, total) => {
          setProgress(Math.round((loaded / total) * 100));
        },
      });

      if (data.length === 0) {
        setError('No data found for the selected date range and fields.');
        setLoading(false);
        return;
      }

      const columnsToUse = activeTab === 'responses'
        ? (selectedColumns.length > 0 ? selectedColumns : undefined)
        : undefined;
      const csv = generateCSV(data, columnsToUse);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filename = activeTab === 'responses'
        ? `scrunch-responses-${Date.now()}.csv`
        : `scrunch-query-${Date.now()}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Successfully exported ${data.length} records`);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <RowExplosionWarningModal
        isOpen={showRowExplosionWarning}
        onConfirm={handleConfirmExport}
        onCancel={handleCancelExport}
        selectedFields={getSelectedManyToManyFields()}
      />
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <a href="/">
              <img src={`${import.meta.env.BASE_URL}scrunch-logo.svg`} alt="Scrunch" className="h-8" />
            </a>
            <span className="text-sm text-gray-600">API Exporter</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6" style={{ backgroundColor: '#e8ffb5' }}>
            <div className="flex items-center gap-3 mb-6">
              <Download className="w-8 h-8 text-gray-800" />
              <h1 className="text-3xl font-bold text-gray-800">Scrunch API Exporter</h1>
            </div>

            <div className="flex gap-4 border-b border-gray-300">
              <button
                onClick={() => {
                  setActiveTab('query');
                  setShowApiCall(false);
                  setApiCallUrl('');
                }}
                className={`px-4 py-2 font-semibold transition-all ${
                  activeTab === 'query'
                    ? 'text-gray-800 border-b-2 border-gray-800 pb-2'
                    : 'text-gray-600 hover:text-gray-800 pb-2'
                }`}
              >
                Query
              </button>
              <button
                onClick={() => {
                  setActiveTab('responses');
                  setShowApiCall(false);
                  setApiCallUrl('');
                }}
                className={`px-4 py-2 font-semibold transition-all ${
                  activeTab === 'responses'
                    ? 'text-gray-800 border-b-2 border-gray-800 pb-2'
                    : 'text-gray-600 hover:text-gray-800 pb-2'
                }`}
              >
                Responses
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter brand ID"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Date Range <span className="text-red-500">*</span></h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Result Range</h3>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fetchMode"
                    checked={!fetchAll}
                    onChange={() => setFetchAll(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">First 1000 rows <span className="text-gray-500">(default)</span></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fetchMode"
                    checked={fetchAll}
                    onChange={() => setFetchAll(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">All results <span className="text-gray-500">(may take longer)</span></span>
                </label>
              </div>
            </div>

            {activeTab === 'responses' && (
              <>
                {manyToManyWarning}
                <div className="border-t pt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Responses endpoint access</h4>
                      <p className="text-sm text-blue-800">
                        Some Scrunch plans do not include access to the Responses API. If you think you should have access, or you want to request it, email{' '}
                        <a href="mailto:support@scrunchai.com" className="underline font-semibold hover:text-blue-900">
                          support@scrunchai.com
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
            
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Select Columns</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Leave empty to include all columns. Or select specific columns for your export.
                  </p>
                  <ColumnSelector selectedColumns={selectedColumns} onSelectionChange={setSelectedColumns} />
                </div>
              </>
            )}

            {activeTab === 'query' && (
              <>
                {manyToManyWarning}
                
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Select Fields</h3>
                  <p className="text-xs text-gray-600 mb-4">Select dimensions to group by and metrics to aggregate. At least one <strong>metric</strong> is required.</p>
                  <QueryFieldSelector
                    selectedFields={selectedFields}
                    onSelectionChange={setSelectedFields}
                  />
                </div>
              </>
            )}

            {activeTab === 'responses' && (
  <>

    <div className="border-t pt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900 mb-2">Data limitations</h4>
          <p className="text-sm text-amber-800 mb-2">
            This export includes the first <strong>5 citations</strong> and first <strong>5 competitors</strong> from each response. For responses with additional citations or competitors, or for complete response analysis:
          </p>
          <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
            <li>Call the Scrunch API directly for full response data</li>
            <li>Review the full response object in the Scrunch app</li>
          </ul>
          <p className="text-xs text-amber-700 mt-3">
            Learn more:{' '}
            <a
              href="https://developers.scrunch.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-amber-900"
            >
              developers.scrunch.com
            </a>
          </p>
        </div>
      </div>
    </div>
  </>
)}

            {loading && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Exporting...</p>
                  <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="border-t pt-6 flex gap-2">
              <button
                onClick={handleShowApiCall}
                className="px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                Show API Call
              </button>
            </div>

            {showApiCall && apiCallUrl && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="text-gray-700 mb-3 font-semibold">API Call (first page):</div>
                <p className="text-xs text-gray-600 mb-3">Pagination is handled automatically for "All results" mode. Add Authorization header with your API key.</p>
                <div className="bg-white p-3 rounded border border-gray-200 mb-3 break-all font-mono text-xs text-gray-900">
                  {apiCallUrl}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`curl -H "Authorization: Bearer YOUR_API_KEY" "${apiCallUrl}"`);
                    alert('curl command copied to clipboard');
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                  Copy as curl
                </button>
              </div>
            )}

            <button
              onClick={handleExportClick}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3.5 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export to CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
