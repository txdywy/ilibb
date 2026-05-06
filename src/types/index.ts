export interface Library {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  opening_hours: string;
  is_free: boolean;
  requires_reservation: boolean;
  requires_id: boolean;
  requires_card: boolean;
  facilities: string[]; // e.g., ["Wi-Fi", "Study Room", "Children's Area", "24h"]
  phone?: string;
  website?: string;
  source_url: string;
  evidence_text: string;
  update_time: string;
  score?: {
    total: number;
    details: {
      free_credibility: number;
      opening_hours: number;
      accessibility: number;
      environment: number;
      surrounding: number;
      facilities: number;
      special: number;
    };
    recommendation: string;
  };
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: 'gov' | 'map' | 'social';
  last_fetched: string;
}
