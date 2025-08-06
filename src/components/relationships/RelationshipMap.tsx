'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { Person, Relationship, RelationshipType, NetworkConfig } from '@/types/relationship';

interface RelationshipMapProps {
  people: Person[];
  relationships: Relationship[];
  centerPersonId: string;
  onPersonSelect: (person: Person) => void;
  onPersonEdit: (person: Person) => void;
  onRelationshipEdit: (relationship: Relationship) => void;
  onAddPerson: (parentId?: string) => void;
  onAddRelationship: (fromId: string, toId: string) => void;
  config: NetworkConfig;
  onConfigChange: (config: NetworkConfig) => void;
}

interface PersonNode {
  id: string;
  person: Person;
  x: number;
  y: number;
  generation: number;
  relationships: Relationship[];
}

const RELATIONSHIP_COLORS = {
  // 家庭关系 - 暖色调
  parent: '#e74c3c',
  child: '#e74c3c',
  sibling: '#f39c12',
  spouse: '#e91e63',
  grandparent: '#8e44ad',
  grandchild: '#8e44ad',
  uncle: '#3498db',
  aunt: '#3498db',
  cousin: '#16a085',
  nephew: '#16a085',
  niece: '#16a085',
  'in-law': '#95a5a6',
  // 社会关系 - 冷色调
  friend: '#2ecc71',
  colleague: '#34495e',
  neighbor: '#27ae60',
  teacher: '#9b59b6',
  student: '#9b59b6',
  mentor: '#d35400',
  protege: '#d35400',
  partner: '#f1c40f',
  acquaintance: '#bdc3c7',
  other: '#7f8c8d',
};

const RELATIONSHIP_LABELS = {
  parent: '父/母',
  child: '子/女',
  sibling: '兄弟姐妹',
  spouse: '配偶',
  grandparent: '祖父母/外祖父母',
  grandchild: '孙子女/外孙子女',
  uncle: '叔伯/舅舅',
  aunt: '姑姑/阿姨',
  cousin: '堂/表兄弟姐妹',
  nephew: '侄子',
  niece: '侄女',
  'in-law': '姻亲',
  friend: '朋友',
  colleague: '同事',
  neighbor: '邻居',
  teacher: '老师',
  student: '学生',
  mentor: '导师',
  protege: '学徒',
  partner: '伙伴',
  acquaintance: '熟人',
  other: '其他',
};

export function RelationshipMap({
  people,
  relationships,
  centerPersonId,
  onPersonSelect,
  onPersonEdit,
  onRelationshipEdit,
  onAddPerson,
  onAddRelationship,
  config,
  onConfigChange,
}: RelationshipMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<PersonNode[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [draggedPerson, setDraggedPerson] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);

  // 计算人物节点的位置
  const calculateLayout = useCallback(() => {
    const centerPerson = people.find(p => p.id === centerPersonId);
    if (!centerPerson) return [];

    const personNodes: PersonNode[] = [];
    const visited = new Set<string>();
    
    // 根据布局类型计算位置
    switch (config.layout) {
      case 'family-tree':
        return calculateFamilyTreeLayout();
      case 'circle':
        return calculateCircleLayout();
      case 'force-directed':
        return calculateForceDirectedLayout();
      case 'timeline':
        return calculateTimelineLayout();
      default:
        return calculateFamilyTreeLayout();
    }

    function calculateFamilyTreeLayout(): PersonNode[] {
      const nodes: PersonNode[] = [];
      const centerX = 400;
      const centerY = 300;
      const levelHeight = 120;
      const personWidth = 80;

      // 添加中心人物
      nodes.push({
        id: centerPersonId,
        person: centerPerson!,
        x: centerX,
        y: centerY,
        generation: 0,
        relationships: relationships.filter(r => r.fromPersonId === centerPersonId || r.toPersonId === centerPersonId)
      });

      visited.add(centerPersonId);

      // 按代际计算位置
      for (let gen = 1; gen <= config.showGenerations; gen++) {
        const currentGenPeople = getGenerationPeople(gen);
        const spacing = Math.max(personWidth + 20, 800 / (currentGenPeople.length + 1));

        currentGenPeople.forEach((person, index) => {
          if (!visited.has(person.id)) {
            const x = (index + 1) * spacing - 400 + centerX;
            const y = centerY - gen * levelHeight; // 上一代在上方
            
            nodes.push({
              id: person.id,
              person,
              x,
              y,
              generation: gen,
              relationships: relationships.filter(r => r.fromPersonId === person.id || r.toPersonId === person.id)
            });

            visited.add(person.id);
          }
        });

        // 下一代
        const nextGenPeople = getGenerationPeople(-gen);
        nextGenPeople.forEach((person, index) => {
          if (!visited.has(person.id)) {
            const x = (index + 1) * spacing - 400 + centerX;
            const y = centerY + gen * levelHeight; // 下一代在下方
            
            nodes.push({
              id: person.id,
              person,
              x,
              y,
              generation: -gen,
              relationships: relationships.filter(r => r.fromPersonId === person.id || r.toPersonId === person.id)
            });

            visited.add(person.id);
          }
        });
      }

      return nodes;
    }

    function calculateCircleLayout(): PersonNode[] {
      const nodes: PersonNode[] = [];
      const centerX = 400;
      const centerY = 300;
      const radius = 200;

      // 中心人物
      nodes.push({
        id: centerPersonId,
        person: centerPerson!,
        x: centerX,
        y: centerY,
        generation: 0,
        relationships: relationships.filter(r => r.fromPersonId === centerPersonId || r.toPersonId === centerPersonId)
      });

      // 其他人物围成圆圈
      const otherPeople = people.filter(p => p.id !== centerPersonId).slice(0, 20); // 最多显示20个人
      const angleStep = (2 * Math.PI) / otherPeople.length;

      otherPeople.forEach((person, index) => {
        const angle = index * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        nodes.push({
          id: person.id,
          person,
          x,
          y,
          generation: 1,
          relationships: relationships.filter(r => r.fromPersonId === person.id || r.toPersonId === person.id)
        });
      });

      return nodes;
    }

    function calculateForceDirectedLayout(): PersonNode[] {
      // 简化的力导向布局
      const nodes: PersonNode[] = [];
      const positions = new Map<string, { x: number; y: number }>();

      // 初始随机位置
      people.forEach(person => {
        positions.set(person.id, {
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100
        });
      });

      // 中心人物固定在中心
      positions.set(centerPersonId, { x: 400, y: 300 });

      // 创建节点
      people.forEach(person => {
        const pos = positions.get(person.id)!;
        nodes.push({
          id: person.id,
          person,
          x: pos.x,
          y: pos.y,
          generation: person.id === centerPersonId ? 0 : 1,
          relationships: relationships.filter(r => r.fromPersonId === person.id || r.toPersonId === person.id)
        });
      });

      return nodes;
    }

    function calculateTimelineLayout(): PersonNode[] {
      const nodes: PersonNode[] = [];
      const sortedPeople = [...people].sort((a, b) => {
        const aDate = a.birth || new Date(1900, 0, 1);
        const bDate = b.birth || new Date(1900, 0, 1);
        return aDate.getTime() - bDate.getTime();
      });

      const timelineWidth = 700;
      const startX = 50;
      const y = 300;

      sortedPeople.forEach((person, index) => {
        const x = startX + (index / (sortedPeople.length - 1)) * timelineWidth;
        
        nodes.push({
          id: person.id,
          person,
          x,
          y: y + (Math.random() - 0.5) * 100, // 轻微垂直偏移避免重叠
          generation: 0,
          relationships: relationships.filter(r => r.fromPersonId === person.id || r.toPersonId === person.id)
        });
      });

      return nodes;
    }

    function getGenerationPeople(generation: number): Person[] {
      // 获取特定代际的人物
      const relatedPeople: Person[] = [];
      
      if (generation > 0) {
        // 上一代：父母、祖父母等
        const parentTypes: RelationshipType[] = ['parent', 'grandparent', 'uncle', 'aunt'];
        relationships.forEach(rel => {
          if (rel.toPersonId === centerPersonId && parentTypes.includes(rel.type)) {
            const person = people.find(p => p.id === rel.fromPersonId);
            if (person) relatedPeople.push(person);
          }
        });
      } else if (generation < 0) {
        // 下一代：子女、孙子女等
        const childTypes: RelationshipType[] = ['child', 'grandchild', 'nephew', 'niece'];
        relationships.forEach(rel => {
          if (rel.fromPersonId === centerPersonId && childTypes.includes(rel.type)) {
            const person = people.find(p => p.id === rel.toPersonId);
            if (person) relatedPeople.push(person);
          }
        });
      }

      return relatedPeople;
    }
  }, [people, relationships, centerPersonId, config]);

  // 更新节点位置
  useEffect(() => {
    const newNodes = calculateLayout();
    setNodes(newNodes);
  }, [calculateLayout]);

  // 处理人物点击
  const handlePersonClick = (person: Person, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPerson(person.id);
    onPersonSelect(person);
  };

  // 处理关系连线点击
  const handleRelationshipClick = (relationship: Relationship, event: React.MouseEvent) => {
    event.stopPropagation();
    onRelationshipEdit(relationship);
  };

  // 拖拽处理
  const handleMouseDown = (personId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setDraggedPerson(personId);
    
    const node = nodes.find(n => n.id === personId);
    if (node) {
      setDragOffset({
        x: event.clientX - node.x,
        y: event.clientY - node.y
      });
    }
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (draggedPerson) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (event.clientX - rect.left - dragOffset.x) / zoom;
        const y = (event.clientY - rect.top - dragOffset.y) / zoom;
        
        setNodes(prev => prev.map(node => 
          node.id === draggedPerson ? { ...node, x, y } : node
        ));
      }
    }
  }, [draggedPerson, dragOffset, zoom]);

  const handleMouseUp = useCallback(() => {
    setDraggedPerson(null);
  }, []);

  useEffect(() => {
    if (draggedPerson) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedPerson, handleMouseMove, handleMouseUp]);

  // 缩放功能
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setViewBox({ x: 0, y: 0, width: 800, height: 600 });
  };

  // 渲染关系连线
  const renderRelationships = () => {
    return relationships.map(relationship => {
      const fromNode = nodes.find(n => n.id === relationship.fromPersonId);
      const toNode = nodes.find(n => n.id === relationship.toPersonId);
      
      if (!fromNode || !toNode) return null;

      const color = RELATIONSHIP_COLORS[relationship.type] || '#95a5a6';
      const strokeWidth = relationship.isClose ? 3 : 2;
      const opacity = config.showRelationshipTypes.includes(relationship.type) ? 1 : 0.3;

      return (
        <g key={relationship.id}>
          <line
            x1={fromNode.x}
            y1={fromNode.y}
            x2={toNode.x}
            y2={toNode.y}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => handleRelationshipClick(relationship, e)}
          />
          {/* 关系标签 */}
          <text
            x={(fromNode.x + toNode.x) / 2}
            y={(fromNode.y + toNode.y) / 2}
            fill={color}
            fontSize="10"
            textAnchor="middle"
            className="pointer-events-none"
            opacity={opacity}
          >
            {RELATIONSHIP_LABELS[relationship.type]}
          </text>
        </g>
      );
    });
  };

  // 渲染人物节点
  const renderPeople = () => {
    return nodes.map(node => {
      const isSelected = selectedPerson === node.id;
      const isCenter = node.id === centerPersonId;
      const radius = isCenter ? 35 : 25;
      const strokeWidth = isSelected ? 3 : isCenter ? 2 : 1;
      
      return (
        <g key={node.id} className="cursor-pointer">
          {/* 人物头像圆圈 */}
          <circle
            cx={node.x}
            cy={node.y}
            r={radius}
            fill={node.person.avatar ? 'url(#avatar-' + node.id + ')' : (isCenter ? '#3498db' : '#ecf0f1')}
            stroke={isSelected ? '#e74c3c' : isCenter ? '#2980b9' : '#bdc3c7'}
            strokeWidth={strokeWidth}
            className="hover:stroke-blue-500 transition-colors"
            onClick={(e) => handlePersonClick(node.person, e)}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
          />
          
          {/* 头像图片（如果有的话） */}
          {node.person.avatar && (
            <defs>
              <pattern
                id={`avatar-${node.id}`}
                x="0%"
                y="0%"
                height="100%"
                width="100%"
                viewBox="0 0 512 512"
              >
                <image
                  x="0%"
                  y="0%"
                  width="512"
                  height="512"
                  xlinkHref={node.person.avatar}
                />
              </pattern>
            </defs>
          )}
          
          {/* 人物姓名 */}
          <text
            x={node.x}
            y={node.y + radius + 15}
            fill="#2c3e50"
            fontSize="12"
            fontWeight={isCenter ? 'bold' : 'normal'}
            textAnchor="middle"
            className="pointer-events-none"
          >
            {node.person.name}
          </text>
          
          {/* 生卒年份 */}
          {(node.person.birth || node.person.death) && (
            <text
              x={node.x}
              y={node.y + radius + 28}
              fill="#7f8c8d"
              fontSize="9"
              textAnchor="middle"
              className="pointer-events-none"
            >
              {node.person.birth?.getFullYear() || '?'} - {node.person.death?.getFullYear() || (node.person.isDeceased ? '?' : '')}
            </text>
          )}
          
          {/* 添加关系按钮 */}
          {isSelected && (
            <circle
              cx={node.x + radius - 5}
              cy={node.y - radius + 5}
              r="8"
              fill="#27ae60"
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:fill-green-600"
              onClick={(e) => {
                e.stopPropagation();
                onAddRelationship(centerPersonId, node.id);
              }}
            />
          )}
        </g>
      );
    });
  };

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">人物关系地图</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">布局:</span>
            <select
              value={config.layout}
              onChange={(e) => onConfigChange({ ...config, layout: e.target.value as any })}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="family-tree">家族树</option>
              <option value="circle">圆形布局</option>
              <option value="force-directed">力导向</option>
              <option value="timeline">时间线</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.3}
          >
            -
          </Button>
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
          >
            重置
          </Button>
          <Button
            size="sm"
            onClick={() => onAddPerson()}
          >
            + 添加人物
          </Button>
        </div>
      </div>

      {/* 关系地图主体 */}
      <div className="relative w-full" style={{ height: 'calc(100% - 73px)' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
          className="bg-gray-50"
          onClick={() => setSelectedPerson(null)}
        >
          {/* 网格背景 */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 关系连线 */}
          {renderRelationships()}

          {/* 人物节点 */}
          {renderPeople()}
        </svg>

        {/* 图例 */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">关系类型</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(RELATIONSHIP_LABELS).slice(0, 8).map(([type, label]) => (
              <div key={type} className="flex items-center space-x-1">
                <div
                  className="w-3 h-0.5"
                  style={{ backgroundColor: RELATIONSHIP_COLORS[type as RelationshipType] }}
                ></div>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 操作提示 */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">开始建立人物关系</h3>
              <p className="text-gray-500 mb-4">添加重要的人物并建立他们之间的关系</p>
              <Button onClick={() => onAddPerson()}>
                添加第一个人物
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}