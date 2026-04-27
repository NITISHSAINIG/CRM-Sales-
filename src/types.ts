export type UserRole = 'admin' | 'salesperson';

export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  region: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  settings?: UserSettings;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  assignedTo: string;
  status: 'active' | 'converted' | 'inactive';
  createdAt: any;
}

export interface Deal {
  id: string;
  leadId: string;
  leadName: string;
  value: number;
  stage: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  expectedCloseDate: string;
  createdAt: any;
  updatedAt: any;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'meeting' | 'email' | 'note';
  description: string;
  timestamp: any;
  createdBy: string;
}
