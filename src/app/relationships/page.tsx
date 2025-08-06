'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { RelationshipMap } from '@/components/relationships/RelationshipMap';
import { PersonModal } from '@/components/relationships/PersonModal';
import { RelationshipModal } from '@/components/relationships/RelationshipModal';
import { generateId } from '@/lib/utils';
import type { Person, Relationship, RelationshipType, NetworkConfig } from '@/types/relationship';

export default function RelationshipsPage() {
  const { user, loading } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  // 模态框状态
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [pendingRelationship, setPendingRelationship] = useState<{ fromId: string; toId: string } | null>(null);

  // 地图配置
  const [config, setConfig] = useState<NetworkConfig>({
    centerPersonId: '',
    showGenerations: 2,
    showRelationshipTypes: ['parent', 'child', 'sibling', 'spouse', 'friend', 'colleague'] as RelationshipType[],
    layout: 'family-tree',
    groupBy: 'relationship',
  });

  // 加载数据
  const loadData = async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      // 这里应该从数据库加载，目前使用模拟数据
      const mockPeople: Person[] = [
        {
          id: 'person-1',
          name: '张明',
          nickname: '小明',
          birth: new Date('1950-03-15'),
          birthPlace: '北京',
          currentPlace: '北京',
          occupation: '退休教师',
          description: '一位和蔼可亲的老教师，教书育人40年',
          isMainUser: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'person-2',
          name: '李芳',
          nickname: '芳芳',
          birth: new Date('1952-08-20'),
          birthPlace: '上海',
          currentPlace: '北京',
          occupation: '退休护士',
          description: '张明的妻子，温柔贤惠',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'person-3',
          name: '张伟',
          birth: new Date('1975-12-10'),
          birthPlace: '北京',
          currentPlace: '深圳',
          occupation: '软件工程师',
          description: '张明的儿子，在深圳工作',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'person-4',
          name: '张丽',
          birth: new Date('1980-05-18'),
          birthPlace: '北京',
          currentPlace: '北京',
          occupation: '医生',
          description: '张明的女儿，在北京行医',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRelationships: Relationship[] = [
        {
          id: 'rel-1',
          fromPersonId: 'person-1',
          toPersonId: 'person-2',
          type: 'spouse',
          description: '相知相伴50年的夫妻',
          startDate: new Date('1975-01-01'),
          isClose: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rel-2',
          fromPersonId: 'person-1',
          toPersonId: 'person-3',
          type: 'child',
          description: '长子，很有出息',
          startDate: new Date('1975-12-10'),
          isClose: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rel-3',
          fromPersonId: 'person-1',
          toPersonId: 'person-4',
          type: 'child',
          description: '小女儿，父亲的贴心小棉袄',
          startDate: new Date('1980-05-18'),
          isClose: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setPeople(mockPeople);
      setRelationships(mockRelationships);
      
      // 设置主角为中心人物
      const mainUser = mockPeople.find(p => p.isMainUser);
      if (mainUser) {
        setConfig(prev => ({ ...prev, centerPersonId: mainUser.id }));
      }

    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // 处理人物相关操作
  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
  };

  const handlePersonEdit = (person: Person) => {
    setSelectedPerson(person);
    setShowPersonModal(true);
  };

  const handleAddPerson = (parentId?: string) => {
    setSelectedPerson(null);
    setShowPersonModal(true);
  };

  const handlePersonSave = (personData: Partial<Person>) => {
    if (selectedPerson) {
      // 编辑现有人物
      setPeople(prev => prev.map(person => 
        person.id === selectedPerson.id 
          ? { ...person, ...personData, updatedAt: new Date() }
          : person
      ));
    } else {
      // 添加新人物
      const newPerson: Person = {
        id: generateId(),
        ...personData,
        name: personData.name || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Person;
      
      setPeople(prev => [...prev, newPerson]);
      
      // 如果是第一个人物，设为中心
      if (people.length === 0) {
        setConfig(prev => ({ ...prev, centerPersonId: newPerson.id }));
      }
    }
    
    setShowPersonModal(false);
    setSelectedPerson(null);
  };

  const handlePersonDelete = (personId: string) => {
    // 删除人物及相关关系
    setPeople(prev => prev.filter(person => person.id !== personId));
    setRelationships(prev => prev.filter(rel => 
      rel.fromPersonId !== personId && rel.toPersonId !== personId
    ));
    
    setShowPersonModal(false);
    setSelectedPerson(null);
    
    // 如果删除的是中心人物，选择新的中心
    if (config.centerPersonId === personId) {
      const remainingPeople = people.filter(p => p.id !== personId);
      if (remainingPeople.length > 0) {
        setConfig(prev => ({ ...prev, centerPersonId: remainingPeople[0].id }));
      }
    }
  };

  // 处理关系相关操作
  const handleRelationshipEdit = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setShowRelationshipModal(true);
  };

  const handleAddRelationship = (fromId: string, toId: string) => {
    setPendingRelationship({ fromId, toId });
    setSelectedRelationship(null);
    setShowRelationshipModal(true);
  };

  const handleRelationshipSave = (relationshipData: Partial<Relationship>) => {
    if (selectedRelationship) {
      // 编辑现有关系
      setRelationships(prev => prev.map(rel => 
        rel.id === selectedRelationship.id 
          ? { ...rel, ...relationshipData, updatedAt: new Date() }
          : rel
      ));
    } else {
      // 添加新关系
      const newRelationship: Relationship = {
        id: generateId(),
        ...relationshipData,
        fromPersonId: relationshipData.fromPersonId || pendingRelationship?.fromId || '',
        toPersonId: relationshipData.toPersonId || pendingRelationship?.toId || '',
        type: relationshipData.type || 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Relationship;
      
      setRelationships(prev => [...prev, newRelationship]);
    }
    
    setShowRelationshipModal(false);
    setSelectedRelationship(null);
    setPendingRelationship(null);
  };

  const handleRelationshipDelete = (relationshipId: string) => {
    setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
    setShowRelationshipModal(false);
    setSelectedRelationship(null);
  };

  // 导出功能
  const handleExport = () => {
    const exportData = {
      people,
      relationships,
      exportDate: new Date(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `人物关系_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600">您需要登录后才能管理人物关系</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
              >
                ← 返回工作台
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">👥 人物关系</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {people.length} 个人物，{relationships.length} 段关系
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={people.length === 0}
              >
                📤 导出数据
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddPerson()}
              >
                + 添加人物
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dataLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载关系数据中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm" style={{ height: '70vh' }}>
            <RelationshipMap
              people={people}
              relationships={relationships}
              centerPersonId={config.centerPersonId}
              onPersonSelect={handlePersonSelect}
              onPersonEdit={handlePersonEdit}
              onRelationshipEdit={handleRelationshipEdit}
              onAddPerson={handleAddPerson}
              onAddRelationship={handleAddRelationship}
              config={config}
              onConfigChange={setConfig}
            />
          </div>
        )}

        {/* 人物详情面板 */}
        {selectedPerson && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                  {selectedPerson.avatar ? (
                    <img
                      src={selectedPerson.avatar}
                      alt={selectedPerson.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedPerson.name}
                    {selectedPerson.nickname && (
                      <span className="text-sm text-gray-500 ml-2">({selectedPerson.nickname})</span>
                    )}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedPerson.occupation && <p>职业：{selectedPerson.occupation}</p>}
                    {selectedPerson.birth && (
                      <p>
                        出生：{selectedPerson.birth.getFullYear()}年
                        {selectedPerson.birthPlace && ` · ${selectedPerson.birthPlace}`}
                      </p>
                    )}
                    {selectedPerson.currentPlace && <p>现居：{selectedPerson.currentPlace}</p>}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(prev => ({ ...prev, centerPersonId: selectedPerson.id }))}
                >
                  设为中心
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePersonEdit(selectedPerson)}
                >
                  编辑
                </Button>
              </div>
            </div>

            {selectedPerson.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">简介</h4>
                <p className="text-gray-600 text-sm">{selectedPerson.description}</p>
              </div>
            )}

            {selectedPerson.stories && selectedPerson.stories.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">相关故事</h4>
                <div className="space-y-2">
                  {selectedPerson.stories.map((story, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-md text-sm text-gray-700">
                      {story}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 模态框 */}
      <PersonModal
        isOpen={showPersonModal}
        person={selectedPerson || undefined}
        onClose={() => {
          setShowPersonModal(false);
          setSelectedPerson(null);
        }}
        onSave={handlePersonSave}
        onDelete={handlePersonDelete}
      />

      <RelationshipModal
        isOpen={showRelationshipModal}
        relationship={selectedRelationship || undefined}
        people={people}
        fromPersonId={pendingRelationship?.fromId}
        toPersonId={pendingRelationship?.toId}
        onClose={() => {
          setShowRelationshipModal(false);
          setSelectedRelationship(null);
          setPendingRelationship(null);
        }}
        onSave={handleRelationshipSave}
        onDelete={handleRelationshipDelete}
      />
    </div>
  );
}