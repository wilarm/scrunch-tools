export const ALL_VARIABLES_TOKEN = '{{multiple}}';

export function extractVariables(prompt: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    matches.push(match[0]);
  }

  return matches;
}

export function containsAllVariablesToken(prompt: string): boolean {
  return prompt.includes(ALL_VARIABLES_TOKEN);
}

export function validatePromptVariables(prompt: string): { valid: boolean; error?: string } {
  const variables = extractVariables(prompt);

  if (variables.length === 0) {
    return { valid: true };
  }

  if (variables.length > 1) {
    return {
      valid: false,
      error: 'Only one variable token is allowed per prompt'
    };
  }

  if (variables.length === 1 && variables[0] !== ALL_VARIABLES_TOKEN) {
    if (containsAllVariablesToken(prompt)) {
      return {
        valid: false,
        error: `Only ${ALL_VARIABLES_TOKEN} is supported. No other variables can be used with it.`
      };
    }
  }

  return { valid: true };
}

export function parseVariationInput(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  const lines = input.split('\n');
  const values: string[] = [];

  for (const line of lines) {
    const commaSeparated = line.split(',');
    for (const item of commaSeparated) {
      const trimmed = item.trim();
      if (trimmed) {
        values.push(trimmed);
      }
    }
  }

  return values;
}

export function expandTemplatePrompt(template: string, variations: string[]): string[] {
  if (!containsAllVariablesToken(template)) {
    return [template];
  }

  if (variations.length === 0) {
    return [template];
  }

  return variations.map(variation =>
    template.replace(ALL_VARIABLES_TOKEN, variation)
  );
}
