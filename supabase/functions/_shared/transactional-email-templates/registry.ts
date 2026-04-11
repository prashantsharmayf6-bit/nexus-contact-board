/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as leadAssigned } from './lead-assigned.tsx'
import { template as leadShared } from './lead-shared.tsx'
import { template as welcomeMessage } from './welcome-message.tsx'
import { template as commentMention } from './comment-mention.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lead-assigned': leadAssigned,
  'lead-shared': leadShared,
  'welcome-message': welcomeMessage,
  'comment-mention': commentMention,
}
