import { CheckCircle2, Circle, Loader2, ExternalLink, Copy, AlertCircle } from 'lucide-react';
import type { GenerationStep } from '../types';
import { useState } from 'react';

interface ProgressTrackerProps {
  step: GenerationStep;
  error?: string;
  slideLink?: string;
}

const STEPS = [
  { key: 'authenticating' as const, label: 'Authenticating with Google' },
  { key: 'fetching' as const, label: 'Fetching brand metrics' },
  { key: 'creating' as const, label: 'Creating slides' },
  { key: 'done' as const, label: 'Complete' },
];

export default function ProgressTracker({ step, error, slideLink }: ProgressTrackerProps) {
  const [copied, setCopied] = useState(false);

  if (step === 'idle') {
    return null;
  }

  if (step === 'error') {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-900 mb-1">Generation Failed</div>
            <div className="text-xs text-red-700">{error || 'An unknown error occurred'}</div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  const copyLink = async () => {
    if (slideLink) {
      await navigator.clipboard.writeText(slideLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="space-y-3">
        {STEPS.map((s, index) => {
          const isComplete = index < currentStepIndex || step === 'done';
          const isCurrent = index === currentStepIndex && step !== 'done';
          const isUpcoming = index > currentStepIndex;

          return (
            <div key={s.key} className="flex items-center gap-3">
              {isComplete && (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
              {isCurrent && (
                <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
              )}
              {isUpcoming && (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isComplete
                    ? 'text-green-900 font-medium'
                    : isCurrent
                    ? 'text-blue-900 font-semibold'
                    : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}

        {step === 'done' && slideLink && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-sm font-semibold text-blue-900 mb-2">
              Your slides are ready!
            </div>
            <div className="flex gap-2">
              <a
                href={slideLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Open in Google Slides
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                title="Copy link"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
