// Google Sheets API utilities for chart creation

export interface ChartData {
  label: string;
  value: number;
}

export interface DonutChartConfig {
  title: string;
  data: ChartData[];
  sheetName: string;
  primaryColor?: string;  // Hex color for value 1
  secondaryColor?: string; // Hex color for value 2 (other)
}

export interface ChartPosition {
  slideObjectId: string;
  x: number;  // EMU (English Metric Units)
  y: number;
  width: number;
  height: number;
}

// Convert hex color to RGB object for Google API
function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255,
  };
}

// Create a new Google Sheet
export async function createSheet(
  accessToken: string,
  name: string
): Promise<{ id: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: name,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create spreadsheet: ${error}`);
  }

  const data = await response.json();
  return {
    id: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

// Add a new sheet (tab) to an existing spreadsheet
export async function addSheetTab(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<number> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add sheet tab: ${error}`);
  }

  const data = await response.json();
  return data.replies[0].addSheet.properties.sheetId;
}

// Populate sheet with data
export async function populateSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  data: ChartData[]
): Promise<void> {
  // Prepare rows: header + data rows
  const rows = [
    ['Metric', 'Value'],
    ...data.map(item => [item.label, item.value]),
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:B${rows.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to populate sheet data: ${error}`);
  }
}

// Create a donut chart in the sheet
export async function createDonutChart(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  config: DonutChartConfig
): Promise<number> {
  const primaryColor = hexToRgb(config.primaryColor || '#97bb3b');
  const secondaryColor = hexToRgb(config.secondaryColor || '#dfded2');

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addChart: {
              chart: {
                spec: {
                  pieChart: {
                    legendPosition: 'NO_LEGEND', // No legend (correct enum value)
                    pieHole: 0.75, // 75% donut hole
                    domain: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: sheetId,
                            startRowIndex: 0,
                            endRowIndex: config.data.length + 1,
                            startColumnIndex: 0,
                            endColumnIndex: 1,
                          },
                        ],
                      },
                    },
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: sheetId,
                            startRowIndex: 0,
                            endRowIndex: config.data.length + 1,
                            startColumnIndex: 1,
                            endColumnIndex: 2,
                          },
                        ],
                      },
                    },
                    // Apply custom colors to pie slices (inside pieChart)
                    slices: [
                      { color: primaryColor },
                      { color: secondaryColor },
                    ],
                  },
                },
                position: {
                  overlayPosition: {
                    anchorCell: {
                      sheetId: sheetId,
                      rowIndex: 0,
                      columnIndex: 3,
                    },
                  },
                },
              },
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create chart: ${error}`);
  }

  const data = await response.json();
  return data.replies[0].addChart.chart.chartId;
}

// Get all charts from a spreadsheet
export async function getSpreadsheetCharts(
  accessToken: string,
  spreadsheetId: string
): Promise<Array<{ chartId: number; sheetId: number; title: string }>> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.charts,sheets.properties`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get spreadsheet charts: ${error}`);
  }

  const data = await response.json();
  const charts: Array<{ chartId: number; sheetId: number; title: string }> = [];

  for (const sheet of data.sheets || []) {
    const sheetId = sheet.properties.sheetId;
    const sheetTitle = sheet.properties.title;

    for (const chart of sheet.charts || []) {
      charts.push({
        chartId: chart.chartId,
        sheetId: sheetId,
        title: sheetTitle,
      });
    }
  }

  return charts;
}

// Link a Sheets chart into a Slides presentation
export async function linkChartToSlide(
  accessToken: string,
  presentationId: string,
  spreadsheetId: string,
  chartId: number,
  position: ChartPosition
): Promise<void> {
  const response = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            createSheetsChart: {
              objectId: `chart_${chartId}_${Date.now()}`,
              spreadsheetId: spreadsheetId,
              chartId: chartId,
              linkingMode: 'LINKED',
              elementProperties: {
                pageObjectId: position.slideObjectId,
                size: {
                  width: { magnitude: position.width, unit: 'EMU' },
                  height: { magnitude: position.height, unit: 'EMU' },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: position.x,
                  translateY: position.y,
                  unit: 'EMU',
                },
              },
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to link chart to slide: ${error}`);
  }
}

// Helper function to convert inches to EMU (English Metric Units)
// 1 inch = 914400 EMU
export function inchesToEmu(inches: number): number {
  return Math.round(inches * 914400);
}

// Helper function to create complete chart workflow
export async function createAndLinkDonutChart(
  accessToken: string,
  spreadsheetId: string,
  presentationId: string,
  config: DonutChartConfig,
  position: ChartPosition
): Promise<void> {
  // Step 1: Add sheet tab
  const sheetId = await addSheetTab(accessToken, spreadsheetId, config.sheetName);

  // Step 2: Populate data
  await populateSheetData(accessToken, spreadsheetId, config.sheetName, config.data);

  // Step 3: Create chart
  const chartId = await createDonutChart(accessToken, spreadsheetId, sheetId, config);

  // Step 4: Link to slide
  await linkChartToSlide(accessToken, presentationId, spreadsheetId, chartId, position);
}
