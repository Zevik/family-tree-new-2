export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthDateGregorian?: string;
  birthDateHebrew?: string;
  deathDateGregorian?: string;
  deathDateHebrew?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  marriageDate?: string;
  marriageDateHebrew?: string;
  email?: string;
  phone?: string;
  hidden?: boolean;
  primaryDateFormat?: 'hebrew' | 'gregorian' | 'both';
  notifyOnBirthday?: boolean;
}

export interface PersonWithRelations extends Person {
  father?: {
    id: string;
    name: string;
  };
  mother?: {
    id: string;
    name: string;
  };
  spouse?: {
    id: string;
    name: string;
    marriageDate?: string;
    marriageDateHebrew?: string;
  };
  children?: {
    id: string;
    name: string;
  }[];
  siblings?: {
    id: string;
    name: string;
    isHalfSibling: boolean;
    commonParent?: 'father' | 'mother';
  }[];
}

export interface RelationshipType {
  value: 'child' | 'sibling' | 'spouse' | 'parent';
  label: string;
}

export interface ParentType {
  value: 'father' | 'mother';
  label: string;
}

export interface DateFormatType {
  value: 'hebrew' | 'gregorian' | 'both';
  label: string;
} 