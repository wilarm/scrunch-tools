import { useState, useMemo } from 'react';
import { Send, ChevronDown, ChevronUp, ArrowLeft, Check, Building2, MessageSquare, Settings } from 'lucide-react';
import { ApiKeyInput } from './components/ApiKeyInput';
import { WebsiteInput } from './components/WebsiteInput';
import { TemplateConfigComponent } from './components/TemplateConfig';
import { PreviewTable } from './components/PreviewTable';
import { PromptInput } from './components/PromptInput';
import { BrandIdInput } from './components/BrandIdInput';
import { PromptPreviewTable, PromptVariant } from './components/PromptPreviewTable';
import { CustomVariablesInput } from './components/CustomVariablesInput';
import { VariationSidebar } from './components/VariationSidebar';
import { AdvancedOptionsSidebar } from './components/AdvancedOptionsSidebar';
import { AdvancedVariablesSidebar } from './components/AdvancedVariablesSidebar';
import { BrandSubmissionState, TemplateConfig, PromptStage, PromptPlatform, PromptSubmissionState } from './types/brand';
import { parseWebsites, generateBrands, reapplyTemplatesWithLocation } from './utils/brandGenerator';
import { createBrand, createPrompt } from './utils/api';
import { enrichWebsitesWithConcurrency } from './utils/enrichment';
import { parsePrompts, parseBrandIds, replacePromptVariables } from './utils/promptParser';
import { enrichPromptVariants, updateVariantsWithEnrichment } from './utils/promptEnrichment';
import { expandTemplatePrompt, containsAllVariablesToken, validatePromptVariables } from './utils/variableExpansion';

type WorkflowType = 'none' | 'brands' | 'prompts';

function App() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('none');
  const [apiKey, setApiKey] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [template, setTemplate] = useState<TemplateConfig>({
    descriptionTemplate: '',
    personasTemplate: [],
    keyTopics: [],
  });
  const [brands, setBrands] = useState<BrandSubmissionState[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [applyToEditedFields, setApplyToEditedFields] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    config: true,
    preview: true,
    prompts: true,
  });
  const [promptInput, setPromptInput] = useState('');
  const [brandIdInput, setBrandIdInput] = useState('');
  const [promptTags, setPromptTags] = useState('');
  const [promptStage, setPromptStage] = useState<PromptStage | ''>('');
  const [promptPlatforms, setPromptPlatforms] = useState<PromptPlatform[]>(['chatgpt']);
  const [promptVariants, setPromptVariants] = useState<PromptVariant[]>([]);
  const [hasGeneratedPrompts, setHasGeneratedPrompts] = useState(false);
  const [isSubmittingPrompts, setIsSubmittingPrompts] = useState(false);
  const [isEnrichingPrompts, setIsEnrichingPrompts] = useState(false);
  const [isConfigDropdownOpen, setIsConfigDropdownOpen] = useState(false);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [promptVariations, setPromptVariations] = useState<Record<string, string[]>>({});
  const [sidebarPrompt, setSidebarPrompt] = useState<string | null>(null);
  const [variationInput, setVariationInput] = useState('');
  const [allowCommaSeparation, setAllowCommaSeparation] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [perPromptTags, setPerPromptTags] = useState('');
  const [perPromptStages, setPerPromptStages] = useState('');
  const [brandConfigBrandId, setBrandConfigBrandId] = useState<number | null>(null);
  const [brandOverrides, setBrandOverrides] = useState<Record<number, { name?: string; location?: string }>>({});
  const [showAdvancedVariables, setShowAdvancedVariables] = useState(false);
  const [perBrandNames, setPerBrandNames] = useState('');
  const [perBrandLocations, setPerBrandLocations] = useState('');

  const websites = useMemo(() => parseWebsites(websiteInput), [websiteInput]);
  const prompts = useMemo(() => parsePrompts(promptInput, allowCommaSeparation), [promptInput, allowCommaSeparation]);
  const brandIds = useMemo(() => parseBrandIds(brandIdInput), [brandIdInput]);

  const toggleSection = (section: 'config' | 'preview' | 'prompts') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleGeneratePreview = () => {
    const generatedBrands = generateBrands(websites, template);
    const brandsWithState: BrandSubmissionState[] = generatedBrands.map((brand, index) => ({
      ...brand,
      id: `brand-${Date.now()}-${index}`,
      status: 'pending',
      enrichmentStatus: 'not_enriched',
      userEditedFields: new Set<string>(),
    }));
    setBrands(brandsWithState);
    setHasGenerated(true);
    setExpandedSections({ config: false, preview: true });
  };

  const handleUpdateBrand = (id: string, updates: Partial<BrandSubmissionState>, fieldName?: string) => {
    setBrands(prev =>
      prev.map(brand => {
        if (brand.id !== id) return brand;

        const updatedBrand = { ...brand, ...updates };

        if (fieldName && fieldName !== 'enrichmentStatus' && fieldName !== 'enrichmentError') {
          const newEditedFields = new Set(brand.userEditedFields);
          newEditedFields.add(fieldName);
          updatedBrand.userEditedFields = newEditedFields;
        }

        return updatedBrand;
      })
    );
  };

  const handleEnrichRows = async () => {
    setIsEnriching(true);

    const websitesToEnrich = brands
      .filter(b => b.enrichmentStatus === 'not_enriched' || b.enrichmentStatus === 'enrich_error')
      .map(b => b.website);

    setBrands(prev =>
      prev.map(b =>
        websitesToEnrich.includes(b.website)
          ? { ...b, enrichmentStatus: 'enriching' }
          : b
      )
    );

    await enrichWebsitesWithConcurrency(
      websitesToEnrich,
      3,
      (website, result, error) => {
        setBrands(prev =>
          prev.map(brand => {
            if (brand.website !== website) return brand;

            if (error) {
              return {
                ...brand,
                enrichmentStatus: 'enrich_error',
                enrichmentError: error,
              };
            }

            if (!result) return brand;

            const updates: Partial<BrandSubmissionState> = {
              enrichmentStatus: 'enriched',
              primaryLocation: result.primary_location,
            };

            if (applyToEditedFields || !brand.userEditedFields.has('name')) {
              updates.name = result.name;
            }

            if (applyToEditedFields || !brand.userEditedFields.has('alternative_names')) {
              updates.alternative_names = result.alternative_names;
            }

            if (applyToEditedFields || !brand.userEditedFields.has('competitors')) {
              updates.competitors = result.competitors.map(c => ({
                name: c.name,
                alternative_names: [],
                websites: c.websites,
                confidence: c.confidence,
              }));
            }

            const templated = reapplyTemplatesWithLocation(brand, template, result.primary_location);

            if (applyToEditedFields || !brand.userEditedFields.has('description')) {
              updates.description = templated.description;
            }

            if (applyToEditedFields || !brand.userEditedFields.has('personas')) {
              updates.personas = templated.personas;
            }

            return { ...brand, ...updates };
          })
        );
      }
    );

    setIsEnriching(false);
  };

  const handleRetryEnrich = async (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;

    setBrands(prev =>
      prev.map(b => (b.id === brandId ? { ...b, enrichmentStatus: 'enriching', enrichmentError: undefined } : b))
    );

    await enrichWebsitesWithConcurrency(
      [brand.website],
      1,
      (website, result, error) => {
        setBrands(prev =>
          prev.map(b => {
            if (b.id !== brandId) return b;

            if (error) {
              return {
                ...b,
                enrichmentStatus: 'enrich_error',
                enrichmentError: error,
              };
            }

            if (!result) return b;

            const updates: Partial<BrandSubmissionState> = {
              enrichmentStatus: 'enriched',
              primaryLocation: result.primary_location,
            };

            if (applyToEditedFields || !b.userEditedFields.has('name')) {
              updates.name = result.name;
            }

            if (applyToEditedFields || !b.userEditedFields.has('alternative_names')) {
              updates.alternative_names = result.alternative_names;
            }

            if (applyToEditedFields || !b.userEditedFields.has('competitors')) {
              updates.competitors = result.competitors.map(c => ({
                name: c.name,
                alternative_names: [],
                websites: c.websites,
                confidence: c.confidence,
              }));
            }

            const templated = reapplyTemplatesWithLocation(b, template, result.primary_location);

            if (applyToEditedFields || !b.userEditedFields.has('description')) {
              updates.description = templated.description;
            }

            if (applyToEditedFields || !b.userEditedFields.has('personas')) {
              updates.personas = templated.personas;
            }

            return { ...b, ...updates };
          })
        );
      }
    );
  };

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Scrunch API key');
      return;
    }

    const invalidBrands = brands.filter(
      b => !b.name?.trim() || !b.website?.trim() || !b.description?.trim()
    );

    if (invalidBrands.length > 0) {
      alert(
        `${invalidBrands.length} brand(s) are missing required fields (name, website, or description). Please fix them before submitting.`
      );
      return;
    }

    setIsSubmitting(true);

    const brandsToSubmit = brands.filter(b => b.status !== 'success');

    for (const brand of brandsToSubmit) {
      setBrands(prev =>
        prev.map(b => (b.id === brand.id ? { ...b, status: 'loading', errorMessage: undefined } : b))
      );

      try {
        const result = await createBrand(apiKey, brand);
        setBrands(prev =>
          prev.map(b => (b.id === brand.id ? { ...b, status: 'success', brandApiId: result.id } : b))
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setBrands(prev =>
          prev.map(b =>
            b.id === brand.id
              ? {
                ...b,
                status: 'error',
                errorMessage,
              }
              : b
          )
        );
      }
    }

    setIsSubmitting(false);

    setBrands(prev => {
      const successfulBrandIds = prev
        .filter(b => b.status === 'success' && b.brandApiId)
        .map(b => b.brandApiId as string);

      if (successfulBrandIds.length > 0) {
        setBrandIdInput(successfulBrandIds.join('\n'));
      }

      return prev;
    });
  };

  const handleRetryFailed = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Scrunch API key');
      return;
    }

    setIsSubmitting(true);

    const failedBrands = brands.filter(b => b.status === 'error');

    for (const brand of failedBrands) {
      setBrands(prev =>
        prev.map(b => (b.id === brand.id ? { ...b, status: 'loading', errorMessage: undefined } : b))
      );

      try {
        const result = await createBrand(apiKey, brand);
        setBrands(prev =>
          prev.map(b => (b.id === brand.id ? { ...b, status: 'success', brandApiId: result.id } : b))
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setBrands(prev =>
          prev.map(b =>
            b.id === brand.id
              ? {
                ...b,
                status: 'error',
                errorMessage,
              }
              : b
          )
        );
      }
    }

    setIsSubmitting(false);

    setBrands(prev => {
      const successfulBrandIds = prev
        .filter(b => b.status === 'success' && b.brandApiId)
        .map(b => b.brandApiId as string);

      if (successfulBrandIds.length > 0) {
        setBrandIdInput(successfulBrandIds.join('\n'));
      }

      return prev;
    });
  };

  const handleOpenVariationSidebar = (prompt: string) => {
    setSidebarPrompt(prompt);
    const existingVariations = promptVariations[prompt] || [];
    setVariationInput(existingVariations.join('\n'));
  };

  const handleCloseSidebar = () => {
    setSidebarPrompt(null);
    setVariationInput('');
  };

  const handleUpdateVariant = (variantId: string, updates: Partial<PromptVariant>) => {
    setPromptVariants(prev =>
      prev.map(variant => {
        if (variant.id !== variantId) return variant;

        const updated = { ...variant, ...updates };

        // If manual overrides are provided, reprocess the prompt with them
        if (updates.manualBrandName !== undefined || updates.manualPrimaryLocation !== undefined) {
          const brandName = updates.manualBrandName ?? variant.manualBrandName ?? variant.brandName;
          const primaryLocation = updates.manualPrimaryLocation ?? variant.manualPrimaryLocation;

          updated.processedPrompt = replacePromptVariables(
            variant.seedPrompt,
            brandName,
            primaryLocation,
            customVariables
          );
        }

        return updated;
      })
    );
  };

  const handleOpenBrandConfig = (brandId: number) => {
    setBrandConfigBrandId(brandId);
  };

  const handleCloseBrandConfig = () => {
    setBrandConfigBrandId(null);
  };

  const handleApplyBrandOverrides = (brandId: number, name?: string, location?: string) => {
    // Store the overrides
    setBrandOverrides(prev => ({
      ...prev,
      [brandId]: { name, location }
    }));

    // Apply to all variants for this brand
    setPromptVariants(prev =>
      prev.map(variant => {
        if (variant.brandId !== brandId) return variant;

        const brandName = name || variant.brandName;
        const primaryLocation = location || variant.manualPrimaryLocation;

        return {
          ...variant,
          manualBrandName: name,
          manualPrimaryLocation: location,
          processedPrompt: replacePromptVariables(
            variant.seedPrompt,
            brandName,
            primaryLocation,
            customVariables
          ),
        };
      })
    );

    handleCloseBrandConfig();
  };

  const handleUpdateVariations = (variations: string[]) => {
    if (sidebarPrompt) {
      setPromptVariations(prev => ({
        ...prev,
        [sidebarPrompt]: variations
      }));
    }
  };

  const handleGeneratePromptPreview = () => {
    const targetBrandIds: number[] = brandIds.length > 0
      ? brandIds
      : brands.filter(b => b.brandApiId).map(b => b.brandApiId!);

    if (targetBrandIds.length === 0) {
      alert('Please generate and submit brands first, or enter brand IDs manually.');
      return;
    }

    if (prompts.length === 0) {
      alert('Please enter at least one seed prompt.');
      return;
    }

    for (const prompt of prompts) {
      const validation = validatePromptVariables(prompt);
      if (!validation.valid) {
        alert(`Validation error: ${validation.error}`);
        return;
      }
    }

    if (promptPlatforms.length === 0) {
      alert('Please select at least one platform.');
      return;
    }

    // Parse per-prompt advanced options
    const perPromptTagsArray = perPromptTags
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const perPromptStagesArray = perPromptStages
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Validate advanced options length if provided
    if (perPromptTagsArray.length > 0 && perPromptTagsArray.length !== prompts.length) {
      alert(`Per-prompt tags count (${perPromptTagsArray.length}) must match prompts count (${prompts.length})`);
      return;
    }

    if (perPromptStagesArray.length > 0 && perPromptStagesArray.length !== prompts.length) {
      alert(`Per-prompt stages count (${perPromptStagesArray.length}) must match prompts count (${prompts.length})`);
      return;
    }

    // Parse per-brand advanced variables
    const perBrandNamesArray = perBrandNames
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const perBrandLocationsArray = perBrandLocations
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Validate per-brand variables length if provided
    const effectiveBrandCount = brandIds.length > 0 ? brandIds.length : brands.length;

    if (perBrandNamesArray.length > 0 && perBrandNamesArray.length !== effectiveBrandCount) {
      alert(`Per-brand names count (${perBrandNamesArray.length}) must match brand count (${effectiveBrandCount})`);
      return;
    }

    if (perBrandLocationsArray.length > 0 && perBrandLocationsArray.length !== effectiveBrandCount) {
      alert(`Per-brand locations count (${perBrandLocationsArray.length}) must match brand count (${effectiveBrandCount})`);
      return;
    }

    const tagsArray = promptTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const expandedPrompts: string[] = [];
    const promptIndexMap: number[] = []; // Track original prompt index for each expanded prompt
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (containsAllVariablesToken(prompt)) {
        const variations = promptVariations[prompt] || [];
        const expanded = expandTemplatePrompt(prompt, variations);
        expandedPrompts.push(...expanded);
        // Map all expanded variations to the same original prompt index
        for (let j = 0; j < expanded.length; j++) {
          promptIndexMap.push(i);
        }
      } else {
        expandedPrompts.push(prompt);
        promptIndexMap.push(i);
      }
    }

    const variants: PromptVariant[] = [];
    let variantIndex = 0;

    for (let i = 0; i < targetBrandIds.length; i++) {
      const brandId = targetBrandIds[i];
      const brand = brands.find(b => b.brandApiId === brandId);

      // Map manual overrides to brands
      // If manually entering IDs, the overrides match that list's order
      // If using the brands table, we match the original row order
      const brandIndex = brandIds.length > 0
        ? i
        : brands.findIndex(b => b.brandApiId === brandId);

      const manualBrandName = (brandIndex >= 0 && perBrandNamesArray.length > brandIndex)
        ? perBrandNamesArray[brandIndex]
        : undefined;

      const manualPrimaryLocation = (brandIndex >= 0 && perBrandLocationsArray.length > brandIndex)
        ? perBrandLocationsArray[brandIndex]
        : undefined;

      for (let expandedIndex = 0; expandedIndex < expandedPrompts.length; expandedIndex++) {
        const seedPrompt = expandedPrompts[expandedIndex];
        const originalPromptIndex = promptIndexMap[expandedIndex];

        // Determine tags and stage for this prompt
        let promptSpecificTags: string[] = tagsArray;
        let promptSpecificStage: PromptStage | undefined = promptStage ? (promptStage as PromptStage) : undefined;

        // Override with per-prompt values if provided
        if (perPromptTagsArray.length > 0) {
          promptSpecificTags = perPromptTagsArray[originalPromptIndex]
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
        }

        if (perPromptStagesArray.length > 0) {
          const stageValue = perPromptStagesArray[originalPromptIndex];
          promptSpecificStage = stageValue ? (stageValue as PromptStage) : undefined;
        }

        for (const platform of promptPlatforms) {
          const brandName = manualBrandName || brand?.name;
          const primaryLocation = manualPrimaryLocation || brand?.primaryLocation;

          const processedPrompt = (brand || manualBrandName || manualPrimaryLocation)
            ? replacePromptVariables(seedPrompt, brandName, primaryLocation, customVariables)
            : seedPrompt;

          variants.push({
            id: `variant-${Date.now()}-${variantIndex++}`,
            brandId,
            brandName: brand?.name || `Brand ${brandId}`,
            brandWebsite: brand?.website || '',
            seedPrompt,
            processedPrompt,
            platform,
            stage: promptSpecificStage,
            tags: promptSpecificTags,
            manualBrandName: manualBrandName,
            manualPrimaryLocation: manualPrimaryLocation,
            status: 'pending',
          });
        }
      }
    }

    setPromptVariants(variants);
    setHasGeneratedPrompts(true);
    setExpandedSections(prev => ({ ...prev, prompts: true }));
  };

  const handleSubmitPrompts = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Scrunch API key');
      return;
    }

    if (promptVariants.length === 0) {
      alert('Please generate prompt preview first.');
      return;
    }

    setIsSubmittingPrompts(true);

    type PromptGroup = {
      brandId: number;
      processedPrompt: string;
      stage?: PromptStage;
      tags: string[];
      platforms: PromptPlatform[];
      variantIds: string[];
    };

    const groupedPrompts = promptVariants.reduce((acc, variant) => {
      const key = `${variant.brandId}-${variant.processedPrompt}`;

      if (!acc[key]) {
        acc[key] = {
          brandId: variant.brandId,
          processedPrompt: variant.processedPrompt,
          stage: variant.stage,
          tags: variant.tags,
          platforms: [],
          variantIds: [],
        };
      }

      acc[key].platforms.push(variant.platform);
      acc[key].variantIds.push(variant.id);

      return acc;
    }, {} as Record<string, PromptGroup>);

    for (const group of Object.values(groupedPrompts)) {
      setPromptVariants(prev =>
        prev.map(v => group.variantIds.includes(v.id) ? { ...v, status: 'loading' } : v)
      );

      try {
        await createPrompt(apiKey, group.brandId, {
          text: group.processedPrompt,
          stage: group.stage || 'Other',
          platforms: group.platforms,
          ...(group.tags.length > 0 && { tags: group.tags }),
        });

        setPromptVariants(prev =>
          prev.map(v => group.variantIds.includes(v.id) ? { ...v, status: 'success' } : v)
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setPromptVariants(prev =>
          prev.map(v =>
            group.variantIds.includes(v.id)
              ? { ...v, status: 'error', errorMessage }
              : v
          )
        );
      }
    }

    setIsSubmittingPrompts(false);
  };

  const handleEnrichPrompts = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Scrunch API key');
      return;
    }

    if (promptVariants.length === 0) {
      alert('Please generate prompt preview first.');
      return;
    }

    setIsEnrichingPrompts(true);

    try {
      await enrichPromptVariants(
        apiKey,
        promptVariants,
        (progress) => {
          setPromptVariants(prev =>
            updateVariantsWithEnrichment(
              prev,
              progress.brandId,
              progress.status,
              progress.name,
              progress.primaryLocation,
              customVariables,
              progress.error,
              progress.confidence
            )
          );
        }
      );
    } catch (error) {
      alert(`Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setIsEnrichingPrompts(false);
  };

  const canGenerate = websites.length > 0;
  const canSubmit = brands.length > 0 && !isSubmitting;
  const allCompleted = brands.length > 0 && brands.every(b => b.status === 'success' || b.status === 'error');

  const successCount = brands.filter(b => b.status === 'success').length;
  const failCount = brands.filter(b => b.status === 'error').length;
  const totalCount = brands.length;
  const hasFailures = failCount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {activeWorkflow !== 'none' && (
                <button
                  onClick={() => setActiveWorkflow('none')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <a href="/">
                <img src={`${import.meta.env.BASE_URL}scrunch-logo.svg`} alt="Scrunch" className="h-8" />
              </a>
              <span className="text-sm text-gray-600">Bulk configuration tool</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsConfigDropdownOpen(!isConfigDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                title="API Configuration"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>
              {isConfigDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsConfigDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">API Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-900 mb-2">
                          Scrunch API Key
                        </label>
                        <input
                          id="api-key"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your Scrunch API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activeWorkflow === 'none' ? (
          <div className="py-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                What would you like to set up in Scrunch?
              </h1>
              <p className="text-gray-500 text-lg">
                You can do both.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => setActiveWorkflow('brands')}
                className="group bg-white rounded-xl border border-gray-200 p-6 text-left transition-all hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-7 h-7 text-gray-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1.5">
                      Configure brands in bulk
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Set up a brand configuration template with dynamic variables specific to each brand.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                  Get started
                  <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                </div>
              </button>

              <button
                onClick={() => setActiveWorkflow('prompts')}
                className="group bg-white rounded-xl border border-gray-200 p-6 text-left transition-all hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-7 h-7 text-gray-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1.5">
                      Add prompts in bulk
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Set up prompts with dynamic variables specific to each brand.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                  Get started
                  <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeWorkflow === 'brands' && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection('config')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h2 className="text-lg font-semibold text-gray-900">Configure Brands in Bulk</h2>
                    {expandedSections.config ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.config && (
                    <div className="p-6 space-y-6">
                      <WebsiteInput
                        value={websiteInput}
                        onChange={setWebsiteInput}
                        websiteCount={websites.length}
                      />

                      <TemplateConfigComponent template={template} onChange={setTemplate} />

                      <div className="flex justify-end">
                        <button
                          onClick={handleGeneratePreview}
                          disabled={!canGenerate}
                          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${canGenerate
                            ? 'bg-[hsl(var(--brand))] text-white hover:opacity-90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                          Generate Preview
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {hasGenerated && (
                  <div className="space-y-4">
                    <button
                      onClick={() => toggleSection('preview')}
                      className="w-full bg-card rounded-lg shadow-sm border border-border px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
                    >
                      <h2 className="text-lg font-semibold text-foreground">Preview & Edit</h2>
                      {expandedSections.preview ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>

                    {expandedSections.preview && (
                      <div className="bg-white rounded-lg shadow-sm border border-white overflow-hidden">
                        <PreviewTable
                          brands={brands}
                          onUpdate={handleUpdateBrand}
                          onRetryEnrich={handleRetryEnrich}
                        />

                        <div className="bg-white border-t border-white p-6 space-y-4">
                          <div className="flex items-center justify-end gap-3">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={applyToEditedFields}
                                onChange={(e) => setApplyToEditedFields(e.target.checked)}
                                className="rounded border-input text-[hsl(var(--brand))] focus:ring-ring"
                              />
                              <span className="text-foreground">Apply enrichment to edited fields</span>
                            </label>
                            <button
                              onClick={handleEnrichRows}
                              disabled={isEnriching}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${!isEnriching
                                ? 'bg-[hsl(var(--brand))] text-white hover:opacity-90'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                            >
                              {isEnriching ? 'Enriching...' : 'Enrich Rows'}
                            </button>
                          </div>

                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">Ready to Submit</h3>
                                {allCompleted ? (
                                  <div className="mt-1">
                                    {successCount === totalCount ? (
                                      <p className="text-sm text-[hsl(var(--positive))] font-medium">
                                        Successfully created {successCount} of {totalCount} brand{totalCount !== 1 ? 's' : ''}
                                      </p>
                                    ) : hasFailures ? (
                                      <div className="space-y-1">
                                        <p className="text-sm text-[hsl(var(--middle))] font-medium">
                                          Created {successCount} of {totalCount} brand{totalCount !== 1 ? 's' : ''}. {failCount} failed.
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Review errors in the table below and retry failed submissions.
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-[hsl(var(--destructive))] font-medium">
                                        All {totalCount} brand{totalCount !== 1 ? 's' : ''} failed. Check errors below.
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {brands.length} brand{brands.length !== 1 ? 's' : ''} will be created
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {allCompleted && hasFailures && (
                                  <button
                                    onClick={handleRetryFailed}
                                    disabled={isSubmitting}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${!isSubmitting
                                      ? 'bg-[hsl(var(--middle))] text-white hover:opacity-90'
                                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                                      }`}
                                  >
                                    <Send className="w-4 h-4" />
                                    Retry Failed ({failCount})
                                  </button>
                                )}
                                <button
                                  onClick={handleSubmit}
                                  disabled={!canSubmit || (allCompleted && !hasFailures)}
                                  className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${canSubmit && !(allCompleted && !hasFailures)
                                    ? 'bg-[hsl(var(--brand))] text-white hover:opacity-90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                    }`}
                                >
                                  <Send className="w-4 h-4" />
                                  {isSubmitting ? 'Creating Brands...' : 'Create Brands'}
                                </button>
                              </div>
                            </div>
                            {isSubmitting && (
                              <div className="mt-4 text-sm text-muted-foreground">
                                Processing brands... Do not close this page.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeWorkflow === 'prompts' && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection('prompts')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h2 className="text-lg font-semibold text-gray-900">Add Prompts in Bulk</h2>
                    {expandedSections.prompts ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.prompts && (
                    <div className="p-6 space-y-6">
                      <BrandIdInput
                        value={brandIdInput}
                        onChange={setBrandIdInput}
                        brandIdCount={brandIds.length}
                      />

                      <PromptInput
                        value={promptInput}
                        onChange={setPromptInput}
                        promptCount={prompts.length}
                        platformCount={promptPlatforms.length}
                        customVariables={customVariables}
                        promptVariations={promptVariations}
                        onOpenVariationSidebar={handleOpenVariationSidebar}
                        allowCommaSeparation={allowCommaSeparation}
                        onAllowCommaSeparationChange={setAllowCommaSeparation}
                      />

                      <CustomVariablesInput
                        variables={customVariables}
                        onChange={setCustomVariables}
                      />

                      <div className="border-t border-gray-200 my-8"></div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-6">
                          <div>
                            <label htmlFor="prompt-tags" className="block text-sm font-medium text-foreground mb-2">
                              Tags <span className="text-muted-foreground text-xs">(optional, applies to all prompts)</span>
                            </label>
                            <input
                              id="prompt-tags"
                              type="text"
                              value={promptTags}
                              onChange={(e) => setPromptTags(e.target.value)}
                              placeholder="Enter tags (comma-separated)"
                              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none bg-background text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Example: industry, product type, campaign name
                            </p>
                          </div>

                          <div>
                            <label htmlFor="prompt-stage" className="block text-sm font-medium text-foreground mb-2">
                              Stage <span className="text-muted-foreground text-xs">(optional, applies to all prompts)</span>
                            </label>
                            <select
                              id="prompt-stage"
                              value={promptStage}
                              onChange={(e) => setPromptStage(e.target.value as PromptStage | '')}
                              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none bg-background text-foreground"
                            >
                              <option value="">Select a stage</option>
                              <option value="Awareness">Awareness</option>
                              <option value="Evaluation">Evaluation</option>
                              <option value="Comparison">Comparison</option>
                              <option value="Advice">Advice</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options (per-prompt configuration)
                            </button>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setShowAdvancedVariables(!showAdvancedVariables)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              {showAdvancedVariables ? 'Hide' : 'Show'} Advanced Variables (per-brand configuration)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Platforms
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['chatgpt', 'claude', 'perplexity', 'google_ai_overviews', 'meta', 'google_ai_mode', 'google_gemini', 'copilot'] as PromptPlatform[]).map((platform) => (
                              <label key={platform} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={promptPlatforms.includes(platform)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPromptPlatforms([...promptPlatforms, platform]);
                                    } else {
                                      setPromptPlatforms(promptPlatforms.filter(p => p !== platform));
                                    }
                                  }}
                                  className="rounded border-input text-[hsl(var(--brand))] focus:ring-ring"
                                />
                                <span className="text-foreground capitalize">{platform.replace(/_/g, ' ')}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Generate Preview</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {prompts.length * promptPlatforms.length} prompt variant{(prompts.length * promptPlatforms.length) !== 1 ? 's' : ''} × {brandIds.length > 0 ? brandIds.length : successCount} brand{(brandIds.length > 0 ? brandIds.length : successCount) !== 1 ? 's' : ''} = {prompts.length * promptPlatforms.length * (brandIds.length > 0 ? brandIds.length : successCount)} total
                            </p>
                          </div>
                          <button
                            onClick={handleGeneratePromptPreview}
                            disabled={prompts.length === 0 || promptPlatforms.length === 0}
                            className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${prompts.length > 0 && promptPlatforms.length > 0
                              ? 'bg-[hsl(var(--brand))] text-white hover:opacity-90'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                              }`}
                          >
                            Generate Preview
                          </button>
                        </div>
                      </div>

                      {hasGeneratedPrompts && promptVariants.length > 0 && (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-foreground">
                                Prompt Preview ({promptVariants.length} variants)
                              </h3>
                            </div>
                            <PromptPreviewTable
                              variants={promptVariants}
                              onUpdateVariant={handleUpdateVariant}
                              onOpenBrandConfig={handleOpenBrandConfig}
                            />
                          </div>

                          <div className="bg-card rounded-lg border border-border p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">Enrich with Brand Data</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Fetch brand names and primary locations from your organization
                                </p>
                              </div>
                              <button
                                onClick={handleEnrichPrompts}
                                disabled={isEnrichingPrompts}
                                className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${!isEnrichingPrompts
                                  ? 'bg-[hsl(var(--brand))] text-white hover:opacity-90'
                                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                                  }`}
                              >
                                {isEnrichingPrompts ? 'Enriching...' : 'Enrich Prompts'}
                              </button>
                            </div>
                            {isEnrichingPrompts && (
                              <div className="mt-4 text-sm text-muted-foreground">
                                Enriching prompts with brand data... Do not close this page.
                              </div>
                            )}
                          </div>

                          <div className="bg-card rounded-lg border border-border p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">Submit All Prompts</h3>
                                {(() => {
                                  const successCount = promptVariants.filter(v => v.status === 'success').length;
                                  const errorCount = promptVariants.filter(v => v.status === 'error').length;
                                  const allCompleted = promptVariants.every(v => v.status === 'success' || v.status === 'error');

                                  return allCompleted ? (
                                    <div className="mt-1">
                                      {successCount === promptVariants.length ? (
                                        <p className="text-sm text-[hsl(var(--positive))] font-medium">
                                          Successfully created {successCount} of {promptVariants.length} prompt{promptVariants.length !== 1 ? 's' : ''}
                                        </p>
                                      ) : errorCount > 0 ? (
                                        <p className="text-sm text-[hsl(var(--middle))] font-medium">
                                          Created {successCount} of {promptVariants.length} prompt{promptVariants.length !== 1 ? 's' : ''}. {errorCount} failed.
                                        </p>
                                      ) : (
                                        <p className="text-sm text-[hsl(var(--destructive))] font-medium">
                                          All {promptVariants.length} prompt{promptVariants.length !== 1 ? 's' : ''} failed. Check errors above.
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Review the variants above and submit when ready
                                    </p>
                                  );
                                })()}
                              </div>
                              <button
                                onClick={handleSubmitPrompts}
                                disabled={isSubmittingPrompts || promptVariants.every(v => v.status === 'success' || v.status === 'error')}
                                className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${!isSubmittingPrompts && !promptVariants.every(v => v.status === 'success' || v.status === 'error')
                                  ? 'bg-[hsl(var(--brand))] text-white hover:opacity-90'
                                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                                  }`}
                              >
                                <Send className="w-4 h-4" />
                                {isSubmittingPrompts ? 'Creating Prompts...' : 'Submit All Prompts'}
                              </button>
                            </div>
                            {isSubmittingPrompts && (
                              <div className="mt-4 text-sm text-muted-foreground">
                                Processing prompts... Do not close this page.
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )
        }
      </main >

      {sidebarPrompt && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={handleCloseSidebar}
          />
          <VariationSidebar
            templatePrompt={sidebarPrompt}
            variations={promptVariations[sidebarPrompt] || []}
            onVariationsChange={handleUpdateVariations}
            onClose={handleCloseSidebar}
          />
        </>
      )}

      {
        brandConfigBrandId !== null && (() => {
          const brand = promptVariants.find(v => v.brandId === brandConfigBrandId);
          const overrides = brandOverrides[brandConfigBrandId] || {};
          return brand ? (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={handleCloseBrandConfig}
              />
              <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Per-Brand Configuration</h2>
                  <p className="text-sm text-gray-500 mt-1">Override settings for {brand.brandName}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name Override
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={overrides.name || ''}
                      placeholder={brand.brandName}
                      id="brand-name-override"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use enriched name</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Location Override
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={overrides.location || ''}
                      placeholder="e.g., Miami, FL"
                      id="brand-location-override"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use enriched location</p>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => {
                      const nameInput = document.getElementById('brand-name-override') as HTMLInputElement;
                      const locationInput = document.getElementById('brand-location-override') as HTMLInputElement;
                      handleApplyBrandOverrides(
                        brandConfigBrandId,
                        nameInput?.value || undefined,
                        locationInput?.value || undefined
                      );
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Apply to All Variants
                  </button>
                  <button
                    onClick={handleCloseBrandConfig}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : null;
        })()
      }

      {
        showAdvancedOptions && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setShowAdvancedOptions(false)}
            />
            <AdvancedOptionsSidebar
              promptCount={prompts.length}
              perPromptTags={perPromptTags}
              perPromptStages={perPromptStages}
              onPerPromptTagsChange={setPerPromptTags}
              onPerPromptStagesChange={setPerPromptStages}
              onClose={() => setShowAdvancedOptions(false)}
            />
          </>
        )
      }

      {
        showAdvancedVariables && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setShowAdvancedVariables(false)}
            />
            <AdvancedVariablesSidebar
              brandCount={brandIds.length > 0 ? brandIds.length : brands.length}
              perBrandNames={perBrandNames}
              perBrandLocations={perBrandLocations}
              onPerBrandNamesChange={setPerBrandNames}
              onPerBrandLocationsChange={setPerBrandLocations}
              onClose={() => setShowAdvancedVariables(false)}
            />
          </>
        )
      }
    </div >
  );
}

export default App;
