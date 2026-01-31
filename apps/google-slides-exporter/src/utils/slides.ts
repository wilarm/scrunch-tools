import type { TemplateInfo, SlideGenerationResult } from '../types';

// Make Google API calls directly from the frontend (not through edge function)
// This is necessary because OAuth tokens are tied to the user's browser origin

export async function validateTemplate(
  accessToken: string,
  templateId: string
): Promise<TemplateInfo> {
  // Get presentation to validate access and extract info
  const response = await fetch(
    `https://slides.googleapis.com/v1/presentations/${templateId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to access template: ${error}`);
  }

  const presentation = await response.json();
  const placeholders = extractPlaceholders(presentation);
  const slideCount = presentation.slides?.length || 0;

  return {
    placeholders,
    slideCount,
  };
}

export async function generateSlides(params: {
  accessToken: string;
  templateId: string;
  slideName: string;
  replacements: Record<string, string>;
}): Promise<SlideGenerationResult> {
  const { accessToken, templateId, slideName, replacements } = params;

  // Step 1: Get the template presentation to read its structure
  console.log('Reading template:', templateId);
  const templateResponse = await fetch(
    `https://slides.googleapis.com/v1/presentations/${templateId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!templateResponse.ok) {
    const error = await templateResponse.text();
    throw new Error(`Cannot access template: ${error}`);
  }

  const template = await templateResponse.json();
  console.log('Template read successfully');

  // Step 2: Create a new blank presentation
  console.log('Creating new presentation');
  const createResponse = await fetch(
    'https://slides.googleapis.com/v1/presentations',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: slideName,
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create presentation: ${error}`);
  }

  const newPresentation = await createResponse.json();
  const deckId = newPresentation.presentationId;
  console.log('New presentation created:', deckId);

  // Step 3: Copy slides from template using Drive API batch method
  console.log('Copying slides from template');

  // We need to use a different approach - copy via Drive API with supportsAllDrives
  const copyWithDriveResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: slideName,
      }),
    }
  );

  if (!copyWithDriveResponse.ok) {
    const error = await copyWithDriveResponse.text();

    // If Drive API still fails, fall back to manual slide recreation
    console.log('Drive copy failed, using manual approach');

    // Delete the default blank slide
    const deleteRequests = [];
    if (newPresentation.slides && newPresentation.slides.length > 0) {
      deleteRequests.push({
        deleteObject: {
          objectId: newPresentation.slides[0].objectId,
        },
      });
    }

    if (deleteRequests.length > 0) {
      await fetch(
        `https://slides.googleapis.com/v1/presentations/${deckId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests: deleteRequests }),
        }
      );
    }

    // Copy each slide from template to new presentation
    for (let i = 0; i < (template.slides || []).length; i++) {
      const slideId = template.slides[i].objectId;

      // Use the presentations.pages.get and create approach
      const copySlideResponse = await fetch(
        `https://slides.googleapis.com/v1/presentations/${templateId}/pages/${slideId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!copySlideResponse.ok) continue;

      const slideData = await copySlideResponse.json();

      // Create a new slide in the target presentation
      const createSlideResponse = await fetch(
        `https://slides.googleapis.com/v1/presentations/${deckId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              createSlide: {
                insertionIndex: i,
              }
            }]
          }),
        }
      );

      if (!createSlideResponse.ok) {
        console.error('Failed to create slide', i);
        continue;
      }
    }

    // Now replace placeholders in the new presentation
    const replaceRequests = Object.entries(replacements).map(([placeholder, value]) => ({
      replaceAllText: {
        containsText: {
          text: placeholder,
          matchCase: false,
        },
        replaceText: value,
      },
    }));

    const replaceResponse = await fetch(
      `https://slides.googleapis.com/v1/presentations/${deckId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: replaceRequests }),
      }
    );

    if (!replaceResponse.ok) {
      const replaceError = await replaceResponse.text();
      throw new Error(`Failed to replace text: ${replaceError}`);
    }

    console.log('Presentation generated successfully (manual method)');

    return {
      deckId,
      link: `https://docs.google.com/presentation/d/${deckId}/edit`,
    };
  }

  // If Drive copy succeeded, use that presentation
  const copiedDeck = await copyWithDriveResponse.json();
  const copiedDeckId = copiedDeck.id;
  console.log('Template copied successfully via Drive API:', copiedDeckId);

  // Replace placeholders in the copied presentation
  const replaceRequests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: {
        text: placeholder,
        matchCase: false,
      },
      replaceText: value,
    },
  }));

  console.log('Replacing placeholders');
  const replaceResponse = await fetch(
    `https://slides.googleapis.com/v1/presentations/${copiedDeckId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: replaceRequests }),
    }
  );

  if (!replaceResponse.ok) {
    const error = await replaceResponse.text();
    throw new Error(`Failed to replace text: ${error}`);
  }

  console.log('Presentation generated successfully');

  // Step 5: Return result (use copied deck ID, not the blank one we created)
  return {
    deckId: copiedDeckId,
    link: `https://docs.google.com/presentation/d/${copiedDeckId}/edit`,
  };
}

function extractPlaceholders(presentation: any): string[] {
  const placeholders = new Set<string>();
  const placeholderRegex = /\{\{[^}]+\}\}/g;

  const slides = presentation.slides || [];
  for (const slide of slides) {
    const elements = slide.pageElements || [];
    for (const element of elements) {
      const textElements = element.shape?.text?.textElements || [];
      for (const textElement of textElements) {
        const content = textElement.textRun?.content || '';
        const matches = content.match(placeholderRegex);
        if (matches) {
          matches.forEach((match: string) => placeholders.add(match));
        }
      }
    }
  }

  return Array.from(placeholders).sort();
}

export function extractTemplateId(input: string): string {
  // Handle full Google Slides URL
  const urlMatch = input.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Assume it's already a template ID
  return input.trim();
}
