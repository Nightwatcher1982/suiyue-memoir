// 人物关系相关的类型定义

export interface Person {
  id: string;
  name: string;
  nickname?: string;
  avatar?: string;
  birth?: Date;
  death?: Date;
  birthPlace?: string;
  currentPlace?: string;
  occupation?: string;
  description?: string;
  stories?: string[];
  photos?: string[];
  isMainUser?: boolean; // 是否是回忆录主角
  isDeceased?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType = 
  // 血缘关系
  | 'parent' | 'child' | 'sibling' | 'spouse' 
  | 'grandparent' | 'grandchild' | 'uncle' | 'aunt' | 'cousin'
  | 'nephew' | 'niece' | 'in-law'
  // 社会关系
  | 'friend' | 'colleague' | 'neighbor' | 'teacher' | 'student'
  | 'mentor' | 'protege' | 'partner' | 'acquaintance'
  // 特殊关系
  | 'other';

export interface Relationship {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isClose?: boolean; // 关系是否亲密
  sharedMemories?: string[]; // 共同回忆
  createdAt: Date;
  updatedAt: Date;
}

export interface RelationshipGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  personIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 关系网络的可视化配置
export interface NetworkConfig {
  centerPersonId: string;
  showGenerations: number; // 显示几代人
  showRelationshipTypes: RelationshipType[];
  layout: 'family-tree' | 'circle' | 'force-directed' | 'timeline';
  groupBy: 'relationship' | 'generation' | 'location' | 'time-period';
}

// 关系统计信息
export interface RelationshipStats {
  totalPeople: number;
  totalRelationships: number;
  generationRange: number;
  mostConnectedPerson: string;
  relationshipTypeDistribution: Record<RelationshipType, number>;
}

// 导入/导出格式
export interface RelationshipExport {
  people: Person[];
  relationships: Relationship[];
  groups: RelationshipGroup[];
  exportDate: Date;
  version: string;
}