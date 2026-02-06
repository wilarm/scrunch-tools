export function parsePrompts(input: string, allowCommaSeparation: boolean = false): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  const lines = input.split('\n');
  const prompts: string[] = [];

  for (const line of lines) {
    if (allowCommaSeparation) {
      const commaSeparated = line.split(',');
      for (const item of commaSeparated) {
        const trimmed = item.trim();
        if (trimmed) {
          prompts.push(trimmed);
        }
      }
    } else {
      const trimmed = line.trim();
      if (trimmed) {
        prompts.push(trimmed);
      }
    }
  }

  return prompts;
}

export function parseBrandIds(input: string): number[] {
  if (!input || !input.trim()) {
    return [];
  }

  const lines = input.split('\n');
  const ids: number[] = [];

  for (const line of lines) {
    const commaSeparated = line.split(',');
    for (const item of commaSeparated) {
      const trimmed = item.trim();
      if (trimmed) {
        const id = parseInt(trimmed, 10);
        if (!isNaN(id)) {
          ids.push(id);
        }
      }
    }
  }

  return ids;
}

export function replacePromptVariables(
  prompt: string,
  brandName: string,
  primaryLocation?: { city: string; region: string; country: string } | string,
  customVariables?: Record<string, string>
): string {
  let result = prompt.replace(/\{\{name\}\}/g, brandName);
  result = result.replace(/\{\{brand_name\}\}/g, brandName);

  if (primaryLocation) {
    let locationString: string;

    if (typeof primaryLocation === 'string') {
      // Handle string format (e.g., "Miami, FL")
      locationString = primaryLocation;
    } else {
      // Handle object format with city, region — omit country code
      locationString = [
        primaryLocation.city,
        primaryLocation.region,
      ]
        .filter(Boolean)
        .join(', ');
    }

    result = result.replace(/\{\{primary_location\}\}/g, locationString);
  }

  if (customVariables) {
    for (const [key, value] of Object.entries(customVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  }

  return result;
}
