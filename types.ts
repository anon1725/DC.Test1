
export enum StaffType {
  JAWWAL = 'jawwal',
  NON_JAWWAL = 'non-jawwal'
}

export enum TicketStatus {
  OPEN = 'open',
  LOCKED = 'locked'
}

export interface AdditionalStaff {
  id: string;
  type: StaffType;
  name: string;
  idNumber?: string;
}

export interface AccessFormData {
  primaryName: string;
  company: string;
  department: string;
  purpose: string;
  rack: string;
  hasEquipment: boolean;
  equipmentList: string;
  notes: string;
  additionalStaff: AdditionalStaff[];
}

export interface EditLog {
  timestamp: number;
  action: string;
}

export interface Ticket extends AccessFormData {
  id: string;
  refId: string;
  timestamp: number;
  status: TicketStatus;
  history: EditLog[];
}
