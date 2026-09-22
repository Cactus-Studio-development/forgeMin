export interface IDocument {
  id: string;
  projectId: string;
  repoId?: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  contentUrl?: string;
  summary?: string;
  keyTakeaways?: string[];
  metrics?: Array<{ label: string; value: string }>;
  category?: string;
  status?: 'PROCESSED' | 'PROCESSING' | 'ERROR';
  uploadedAt: Date;
}

export class DocumentAttachment implements IDocument {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly fileName: string,
    public readonly fileType: string,
    public readonly fileSize?: number,
    public readonly contentUrl?: string,
    public readonly repoId?: string,
    public readonly uploadedAt: Date = new Date(),
    public readonly summary?: string,
    public readonly keyTakeaways?: string[],
    public readonly metrics?: Array<{ label: string; value: string }>,
    public readonly category?: string,
    public readonly status: 'PROCESSED' | 'PROCESSING' | 'ERROR' = 'PROCESSED',
  ) {}
}
