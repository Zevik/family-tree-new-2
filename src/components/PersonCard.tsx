'use client';

import { useState } from 'react';
import { PersonWithRelations } from '@/models/Person';
import { FaPlus, FaUser, FaUsers, FaHeart, FaChild, FaChevronDown, FaChevronUp, FaPhone, FaEnvelope, FaBell, FaStar } from 'react-icons/fa';
import AddPersonForm from './AddPersonForm';
import { formatHebrewDate } from '@/utils/familyUtils';

interface PersonCardProps {
  person: PersonWithRelations;
  isSelected: boolean;
  onSelect: (personId: string) => void;
  viewMode: 'grid' | 'list';
}

export default function PersonCard({ person, isSelected, onSelect, viewMode }: PersonCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAddClick = () => {
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // פונקציה להצגת תאריך לפי הפורמט הראשי
  const renderDate = (gregorianDate?: string, hebrewDate?: string) => {
    if (!gregorianDate && !hebrewDate) return null;

    const primaryFormat = person.primaryDateFormat || 'gregorian';
    
    if (primaryFormat === 'hebrew' && hebrewDate) {
      return (
        <span>
          {formatHebrewDate(hebrewDate)}
          {gregorianDate && <span className="text-xs text-gray-500 mr-2">({gregorianDate})</span>}
        </span>
      );
    } else if (primaryFormat === 'both' && gregorianDate && hebrewDate) {
      return (
        <span>
          {gregorianDate} / {formatHebrewDate(hebrewDate)}
        </span>
      );
    } else {
      return (
        <span>
          {gregorianDate}
          {hebrewDate && <span className="text-xs text-gray-500 mr-2">({formatHebrewDate(hebrewDate)})</span>}
        </span>
      );
    }
  };

  // רינדור תצוגת רשימה
  if (viewMode === 'list') {
    return (
      <div 
        id={`person-card-${person.id}`}
        className={`person-card w-full border rounded-lg p-4 ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} hover:border-primary-300 transition-colors relative`}
        onClick={() => onSelect(person.id)}
      >
        {person.notifyOnBirthday && (
          <div className="absolute top-2 left-2 text-yellow-500">
            <FaStar />
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="text-lg font-bold">{person.firstName} {person.lastName}</h3>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
              {(person.birthDateGregorian || person.birthDateHebrew) && (
                <span>
                  {renderDate(person.birthDateGregorian, person.birthDateHebrew)}
                </span>
              )}
              {person.phone && (
                <span className="flex items-center gap-1">
                  <FaPhone className="text-xs" />
                  {person.phone}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-secondary rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                handleAddClick();
              }}
              aria-label="הוסף קרוב משפחה"
            >
              <FaPlus />
            </button>
            
            <button
              className="btn btn-ghost rounded-full p-2"
              onClick={toggleExpanded}
              aria-label={expanded ? 'הסתר פרטים' : 'הצג פרטים'}
            >
              {expanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {/* הורים */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <FaUser className="text-primary-500" />
                  הורים
                </h4>
                {person.father && (
                  <p className="text-sm">
                    <span className="font-semibold">אב: </span>
                    <button 
                      className="text-primary-600 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(person.father!.id);
                      }}
                    >
                      {person.father.name}
                    </button>
                  </p>
                )}
                {person.mother && (
                  <p className="text-sm">
                    <span className="font-semibold">אם: </span>
                    <button 
                      className="text-primary-600 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(person.mother!.id);
                      }}
                    >
                      {person.mother.name}
                    </button>
                  </p>
                )}
                {!person.father && !person.mother && (
                  <p className="text-sm text-gray-500">אין מידע על הורים</p>
                )}
              </div>

              {/* בן/בת זוג */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <FaHeart className="text-primary-500" />
                  בן/בת זוג
                </h4>
                {person.spouse ? (
                  <div>
                    <p className="text-sm">
                      <button 
                        className="text-primary-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(person.spouse!.id);
                        }}
                      >
                        {person.spouse.name}
                      </button>
                    </p>
                    {(person.spouse.marriageDate || person.spouse.marriageDateHebrew) && (
                      <p className="text-sm">
                        <span className="font-semibold">תאריך נישואין: </span>
                        {renderDate(person.spouse.marriageDate, person.spouse.marriageDateHebrew)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">אין בן/בת זוג</p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {/* ילדים */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <FaChild className="text-primary-500" />
                  ילדים
                </h4>
                {person.children && person.children.length > 0 ? (
                  <ul className="space-y-1">
                    {person.children.map((child) => (
                      <li key={child.id} className="text-sm">
                        <button 
                          className="text-primary-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(child.id);
                          }}
                        >
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">אין ילדים</p>
                )}
              </div>

              {/* אחים ואחיות */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <FaUsers className="text-primary-500" />
                  אחים ואחיות
                </h4>
                {person.siblings && person.siblings.length > 0 ? (
                  <ul className="space-y-1">
                    {person.siblings.map((sibling) => (
                      <li key={sibling.id} className="text-sm">
                        <button 
                          className="text-primary-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(sibling.id);
                          }}
                        >
                          {sibling.name}
                        </button>
                        {sibling.isHalfSibling && sibling.commonParent && (
                          <span className="text-xs text-gray-500 mr-1">
                            (אח/ות למחצה - {sibling.commonParent === 'father' ? 'אב' : 'אם'} משותף/ת)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">אין אחים ואחיות</p>
                )}
              </div>
            </div>
            
            {/* פרטי קשר ותאריכים נוספים */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              {person.email && (
                <p className="text-sm flex items-center gap-2">
                  <FaEnvelope className="text-primary-500" />
                  <span>{person.email}</span>
                </p>
              )}
              
              {(person.deathDateGregorian || person.deathDateHebrew) && (
                <p className="text-sm">
                  <span className="font-semibold">תאריך פטירה: </span>
                  {renderDate(person.deathDateGregorian, person.deathDateHebrew)}
                </p>
              )}
            </div>
          </div>
        )}
        
        {showAddForm && (
          <AddPersonForm 
            relatedPersonId={person.id}
            onClose={handleCloseForm}
          />
        )}
      </div>
    );
  }

  // רינדור תצוגת רשת (ברירת מחדל)
  return (
    <div 
      id={`person-card-${person.id}`}
      className={`person-card card ${isSelected ? 'card-highlighted' : ''} relative`}
      onClick={() => onSelect(person.id)}
    >
      {person.notifyOnBirthday && (
        <div className="absolute top-2 left-2 text-yellow-500">
          <FaStar />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{person.firstName} {person.lastName}</h3>
        <button 
          className="btn btn-secondary rounded-full p-2"
          onClick={(e) => {
            e.stopPropagation();
            handleAddClick();
          }}
          aria-label="הוסף קרוב משפחה"
        >
          <FaPlus />
        </button>
      </div>

      <div className="space-y-4">
        {/* תאריכי לידה ופטירה */}
        <div>
          {(person.birthDateGregorian || person.birthDateHebrew) && (
            <p className="text-sm">
              <span className="font-semibold">תאריך לידה: </span>
              {renderDate(person.birthDateGregorian, person.birthDateHebrew)}
            </p>
          )}
          
          {(person.deathDateGregorian || person.deathDateHebrew) && (
            <p className="text-sm">
              <span className="font-semibold">תאריך פטירה: </span>
              {renderDate(person.deathDateGregorian, person.deathDateHebrew)}
            </p>
          )}
        </div>

        {/* הורים */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-1">
            <FaUser className="text-primary-500" />
            הורים
          </h4>
          {person.father && (
            <p className="text-sm">
              <span className="font-semibold">אב: </span>
              <button 
                className="text-primary-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(person.father!.id);
                }}
              >
                {person.father.name}
              </button>
            </p>
          )}
          {person.mother && (
            <p className="text-sm">
              <span className="font-semibold">אם: </span>
              <button 
                className="text-primary-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(person.mother!.id);
                }}
              >
                {person.mother.name}
              </button>
            </p>
          )}
          {!person.father && !person.mother && (
            <p className="text-sm text-gray-500">אין מידע על הורים</p>
          )}
        </div>

        {/* בן/בת זוג */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-1">
            <FaHeart className="text-primary-500" />
            בן/בת זוג
          </h4>
          {person.spouse ? (
            <div>
              <p className="text-sm">
                <button 
                  className="text-primary-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(person.spouse!.id);
                  }}
                >
                  {person.spouse.name}
                </button>
              </p>
              {(person.spouse.marriageDate || person.spouse.marriageDateHebrew) && (
                <p className="text-sm">
                  <span className="font-semibold">תאריך נישואין: </span>
                  {renderDate(person.spouse.marriageDate, person.spouse.marriageDateHebrew)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">אין בן/בת זוג</p>
          )}
        </div>

        {/* ילדים */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-1">
            <FaChild className="text-primary-500" />
            ילדים
          </h4>
          {person.children && person.children.length > 0 ? (
            <ul className="space-y-1">
              {person.children.map((child) => (
                <li key={child.id} className="text-sm">
                  <button 
                    className="text-primary-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(child.id);
                    }}
                  >
                    {child.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">אין ילדים</p>
          )}
        </div>

        {/* אחים ואחיות */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-1">
            <FaUsers className="text-primary-500" />
            אחים ואחיות
          </h4>
          {person.siblings && person.siblings.length > 0 ? (
            <ul className="space-y-1">
              {person.siblings.map((sibling) => (
                <li key={sibling.id} className="text-sm">
                  <button 
                    className="text-primary-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(sibling.id);
                    }}
                  >
                    {sibling.name}
                  </button>
                  {sibling.isHalfSibling && sibling.commonParent && (
                    <span className="text-xs text-gray-500 mr-1">
                      (אח/ות למחצה - {sibling.commonParent === 'father' ? 'אב' : 'אם'} משותף/ת)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">אין אחים ואחיות</p>
          )}
        </div>
        
        {/* פרטי קשר */}
        <div>
          {person.email && (
            <p className="text-sm flex items-center gap-2">
              <FaEnvelope className="text-primary-500" />
              <span>{person.email}</span>
            </p>
          )}
          {person.phone && (
            <p className="text-sm flex items-center gap-2">
              <FaPhone className="text-primary-500" />
              <span>{person.phone}</span>
            </p>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddPersonForm 
          relatedPersonId={person.id}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
} 