'use client';

import { useEffect, useRef, useState } from 'react';
import { PersonWithRelations } from '@/models/Person';
import PersonCard from './PersonCard';
import { FaList, FaThLarge } from 'react-icons/fa';

interface FamilyTreeProps {
  people: PersonWithRelations[];
  selectedPersonId: string | null;
  onPersonSelect: (personId: string) => void;
}

export default function FamilyTree({ people, selectedPersonId, onPersonSelect }: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredPeople, setFilteredPeople] = useState<PersonWithRelations[]>(people);
  const [filterRelation, setFilterRelation] = useState<string>('all');

  useEffect(() => {
    setFilteredPeople(people);
  }, [people]);

  useEffect(() => {
    if (selectedPersonId) {
      scrollToCard(selectedPersonId);
      filterByRelation(filterRelation, selectedPersonId);
    } else {
      setFilteredPeople(people);
    }
  }, [selectedPersonId, filterRelation, people]);

  const scrollToCard = (personId: string) => {
    if (!containerRef.current) return;

    const cardElement = document.getElementById(`person-card-${personId}`);
    if (cardElement) {
      // Remove highlight from all cards
      const allCards = containerRef.current.querySelectorAll('.person-card');
      allCards.forEach(card => card.classList.remove('card-highlighted'));

      // Add highlight to selected card
      cardElement.classList.add('card-highlighted');

      // Scroll to the card
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  };

  const filterByRelation = (relation: string, personId: string) => {
    if (relation === 'all') {
      setFilteredPeople(people);
      return;
    }

    const selectedPerson = people.find(p => p.id === personId);
    if (!selectedPerson) {
      setFilteredPeople(people);
      return;
    }

    let filtered: PersonWithRelations[] = [];
    
    switch (relation) {
      case 'parents':
        filtered = people.filter(p => 
          p.id === selectedPerson.fatherId || 
          p.id === selectedPerson.motherId
        );
        break;
      case 'children':
        filtered = people.filter(p => 
          p.fatherId === selectedPerson.id || 
          p.motherId === selectedPerson.id
        );
        break;
      case 'siblings':
        filtered = people.filter(p => 
          p.id !== selectedPerson.id && (
            (p.fatherId && p.fatherId === selectedPerson.fatherId) || 
            (p.motherId && p.motherId === selectedPerson.motherId)
          )
        );
        break;
      case 'spouse':
        filtered = people.filter(p => 
          p.id === selectedPerson.spouseId
        );
        break;
      default:
        filtered = people;
    }

    // תמיד כולל את האדם הנבחר
    if (!filtered.some(p => p.id === selectedPerson.id)) {
      filtered.push(selectedPerson);
    }

    setFilteredPeople(filtered);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        {selectedPersonId && (
          <div className="flex-1 min-w-[200px]">
            <select
              className="select w-full"
              value={filterRelation}
              onChange={(e) => setFilterRelation(e.target.value)}
            >
              <option value="all">כל האנשים</option>
              <option value="parents">הורים</option>
              <option value="children">ילדים</option>
              <option value="siblings">אחים ואחיות</option>
              <option value="spouse">בן/בת זוג</option>
            </select>
          </div>
        )}
        
        <button
          className="btn btn-secondary"
          onClick={toggleViewMode}
          aria-label={viewMode === 'grid' ? 'עבור לתצוגת רשימה' : 'עבור לתצוגת רשת'}
        >
          {viewMode === 'grid' ? <FaList /> : <FaThLarge />}
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={`w-full overflow-auto ${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'flex flex-col gap-4'
        }`}
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {filteredPeople.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            isSelected={selectedPersonId === person.id}
            onSelect={onPersonSelect}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
} 