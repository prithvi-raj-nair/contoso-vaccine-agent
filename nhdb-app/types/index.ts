import { ObjectId } from 'mongodb';

// Village
export interface Village {
  _id?: ObjectId;
  villageId: string;      // "V001"-"V007"
  name: string;
  createdAt: Date;
}

// Parent
export interface Parent {
  _id?: ObjectId;
  govtId: string;
  name: string;
  dateOfBirth: Date;
  villageId: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Child
export interface Child {
  _id?: ObjectId;
  govtId?: string;
  name: string;
  dateOfBirth: Date;
  parentId: ObjectId;
  villageId: string;
  createdAt: Date;
  updatedAt: Date;
}

// VaccinationVisit
export interface VaccinationVisit {
  _id?: ObjectId;
  childId: ObjectId;
  visitDate: Date;
  vaccineGiven: 'A' | 'B' | 'C' | 'none_required' | 'not_available';
  notes?: string;
  createdAt: Date;
}

// VaccinationStatus (computed)
export interface VaccinationStatus {
  vaccinesGiven: string[];
  nextVaccineDue: string | null;
  dueStatus: 'overdue' | 'due' | 'upcoming' | 'complete';
  dueWindow?: { start: Date; end: Date };
}

// API Response types
export interface ParentWithChildren extends Parent {
  children: Child[];
}

export interface ChildWithStatus extends Child {
  vaccinationStatus: VaccinationStatus;
  vaccinationHistory: VaccinationVisit[];
  parentName?: string;
  villageName?: string;
}

// Form types
export interface CreateParentInput {
  govtId: string;
  name: string;
  dateOfBirth: string;
  villageId: string;
  phoneNumber?: string;
}

export interface CreateChildInput {
  name: string;
  dateOfBirth: string;
  parentId: string;
  villageId: string;
  govtId?: string;
}

export interface CreateVaccinationInput {
  childId: string;
  visitDate: string;
  vaccineGiven: 'A' | 'B' | 'C' | 'none_required' | 'not_available';
  notes?: string;
}

// Report types
export interface VaccineDemand {
  villageId: string;
  villageName: string;
  startDate: string;
  endDate: string;
  demand: {
    A: number;
    B: number;
    C: number;
  };
  totalChildren: number;
  childrenNeedingVaccines: number;
}

export interface VillageDropoutRate {
  villageId: string;
  villageName: string;
  childrenStarted: number;
  childrenCompleted: number;
  dropoutRate: number;
}

export interface MonthlyDropoutReport {
  month: string;
  villages: VillageDropoutRate[];
}

export interface VaccineWastageDetails {
  expected: number;
  actual: number;
  wasted: number;
  rate: number;
}

export interface MonthlyWastageReport {
  month: string;
  wastage: {
    A: VaccineWastageDetails;
    B: VaccineWastageDetails;
    C: VaccineWastageDetails;
  };
}
