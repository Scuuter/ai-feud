'use client';

import { TVPreview } from '@/components/design-system/tv-preview';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 md:p-8">
      <TVPreview />
    </div>
  );
}
