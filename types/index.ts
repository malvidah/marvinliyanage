export interface Page {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface PageSummary {
  title: string;
  slug: string;
} 