import { Brand, TemplateConfig, Persona, PrimaryLocation, BrandSubmissionState } from '../types/brand';

export function parseWebsites(input: string): string[] {
  const websites = input
    .split(/[\n,]+/)
    .map(url => url.trim())
    .filter(url => url.length > 0);

  return websites;
}

export function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}

export function generateStubData(website: string): {
  name: string;
  alternativeNames: string[];
  competitors: Array<{ name: string; alternative_names: string[]; websites: string[] }>;
  primaryLocation: string;
} {
  const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const brandName = domain.split('.')[0];
  const capitalizedName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  return {
    name: capitalizedName,
    alternativeNames: [],
    competitors: [],
    primaryLocation: 'San Francisco, CA',
  };
}

export function applyTemplate(
  website: string,
  template: TemplateConfig
): Brand {
  const stubData = generateStubData(website);

  const placeholderData = {
    primary_location: stubData.primaryLocation,
    name: stubData.name,
  };

  const description = replacePlaceholders(template.descriptionTemplate, placeholderData);

  const personas: Persona[] = template.personasTemplate.map(p => ({
    name: p.name,
    description: replacePlaceholders(p.description, placeholderData),
  }));

  return {
    website,
    name: stubData.name,
    alternative_names: stubData.alternativeNames,
    alternative_websites: [],
    description,
    personas,
    key_topics: [...template.keyTopics],
    competitors: stubData.competitors,
  };
}

export function generateBrands(
  websites: string[],
  template: TemplateConfig
): Brand[] {
  return websites.map(website => applyTemplate(website, template));
}

export function formatPrimaryLocation(location?: PrimaryLocation): string {
  if (!location) return '';

  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  if (location.country && parts.length < 2) parts.push(location.country);

  return parts.join(', ') || 'Unknown Location';
}

export function reapplyTemplatesWithLocation(
  brand: BrandSubmissionState,
  template: TemplateConfig,
  location: PrimaryLocation
): { description: string; personas: Persona[] } {
  const placeholderData = {
    primary_location: formatPrimaryLocation(location),
    name: brand.name,
  };

  const description = replacePlaceholders(template.descriptionTemplate, placeholderData);

  const personas: Persona[] = template.personasTemplate.map(p => ({
    name: p.name,
    description: replacePlaceholders(p.description, placeholderData),
  }));

  return { description, personas };
}
