'use client';

import { useState, useEffect, useRef } from 'react';
import { useFamilyData } from '@/lib/hooks/useFamilyData';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { PersonWithRelations } from '@/models/Person';

interface SearchBarProps {
  onPersonSelect: (personId: string) => void;
}

export default function SearchBar({ onPersonSelect }: SearchBarProps) {
  const { data } = useFamilyData();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; details: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add click outside listener to close search results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!data || searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.trim().toLowerCase();
    const results = data
      .filter(person => 
        person.firstName.toLowerCase().includes(term) || 
        person.lastName.toLowerCase().includes(term) ||
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(term) ||
        (person.email && person.email.toLowerCase().includes(term)) ||
        (person.phone && person.phone.includes(term))
      )
      .map(person => ({
        id: person.id,
        name: `${person.firstName} ${person.lastName}`,
        details: getPersonDetails(person)
      }));

    setSearchResults(results);
    setShowResults(true);
  }, [searchTerm, data]);

  const getPersonDetails = (person: PersonWithRelations): string => {
    const details = [];
    
    if (person.birthDateGregorian) {
      details.push(`נולד/ה: ${person.birthDateGregorian}`);
    }
    
    if (person.father) {
      details.push(`אבא: ${person.father.name}`);
    }
    
    if (person.mother) {
      details.push(`אמא: ${person.mother.name}`);
    }
    
    if (person.spouse) {
      details.push(`בן/בת זוג: ${person.spouse.name}`);
    }
    
    if (person.children && person.children.length > 0) {
      details.push(`ילדים: ${person.children.length}`);
    }
    
    return details.join(' | ');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleSelectPerson = (personId: string) => {
    setSearchTerm('');
    setShowResults(false);
    onPersonSelect(personId);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          className="input pr-10 pl-10 w-full"
          placeholder="חפש אדם לפי שם, אימייל או טלפון..."
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => setShowResults(true)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        {searchTerm && (
          <button
            className="absolute inset-y-0 left-0 flex items-center pl-3"
            onClick={handleClearSearch}
            aria-label="נקה חיפוש"
          >
            <FaTimes className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((result) => (
            <li 
              key={result.id}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelectPerson(result.id)}
            >
              <div className="font-medium">{result.name}</div>
              {result.details && (
                <div className="text-xs text-gray-500 mt-1 truncate">{result.details}</div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showResults && searchTerm && searchResults.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center">
          <p className="text-gray-500">לא נמצאו תוצאות עבור "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
} 