'use client';

import { useState, useEffect } from 'react';
import { PersonWithRelations } from '@/models/Person';
import { getUpcomingDates, getCurrentHebrewDate, formatHebrewDate } from '@/utils/familyUtils';
import { FaBirthdayCake, FaHeart, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useFamilyData } from '@/lib/hooks/useFamilyData';

interface UpcomingDatesProps {
  people: PersonWithRelations[];
  onPersonSelect: (personId: string) => void;
}

export default function UpcomingDates({ people, onPersonSelect }: UpcomingDatesProps) {
  console.log('UpcomingDates component rendering');
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<any>({});

  useEffect(() => {
    console.log('UpcomingDates useEffect called');
    
    const fetchCurrentHebrewDate = async () => {
      try {
        const hebrewDate = await getCurrentHebrewDate();
        console.log('Current Hebrew date:', hebrewDate);
        if (hebrewDate) {
          setCurrentDate({
            hebrew: `${hebrewDate.day} ${hebrewDate.monthName} ${hebrewDate.year}`
          });
        }
      } catch (error) {
        console.error('Error fetching current Hebrew date:', error);
      }
    };
    
    fetchCurrentHebrewDate();
    
    if (people && people.length > 0) {
      console.log('Calling getUpcomingDates with', people.length, 'people');
      const { birthdays, anniversaries } = getUpcomingDates(people);
      console.log('getUpcomingDates results:', { birthdays: birthdays?.length, anniversaries: anniversaries?.length });
      
      if (birthdays) setBirthdays(birthdays);
      if (anniversaries) setAnniversaries(anniversaries);
    }
  }, [people]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <h2 className="text-xl font-bold flex items-center">
          <FaCalendarAlt className="text-primary-500 ml-2" />
          תאריכים קרובים
        </h2>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 mt-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">התאריך העברי היום:</h3>
            {currentDate.hebrew ? (
              <p className="text-lg">{formatHebrewDate(currentDate.hebrew)}</p>
            ) : (
              <p>טוען...</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">ימי הולדת קרובים:</h3>
            {birthdays.length > 0 ? (
              <ul className="space-y-2">
                {birthdays.map((birthday, index) => (
                  <li key={index} className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <button 
                          className="font-medium text-primary-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPersonSelect(birthday.person.id);
                          }}
                        >
                          {birthday.person.firstName} {birthday.person.lastName}
                        </button>
                        <div className="text-sm text-gray-600">
                          {birthday.dateType === 'hebrew' ? (
                            <span>
                              {formatHebrewDate(birthday.date)} 
                              {birthday.gregorianDate && <span className="text-xs">({birthday.gregorianDate})</span>}
                            </span>
                          ) : (
                            <span>
                              {birthday.date}
                              {birthday.hebrewDate && <span className="text-xs"> ({formatHebrewDate(birthday.hebrewDate)})</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-primary-600 font-bold">
                        {birthday.daysUntil === 0 
                          ? 'היום!' 
                          : birthday.daysUntil === 1 
                            ? 'מחר' 
                            : `בעוד ${birthday.daysUntil} ימים`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">אין ימי הולדת קרובים</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">ימי נישואין קרובים:</h3>
            {anniversaries.length > 0 ? (
              <ul className="space-y-2">
                {anniversaries.map((anniversary, index) => (
                  <li key={index} className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          <button 
                            className="text-primary-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPersonSelect(anniversary.couple[0].id);
                            }}
                          >
                            {anniversary.couple[0].firstName} {anniversary.couple[0].lastName}
                          </button>
                          <span className="mx-1">ו-</span>
                          <button 
                            className="text-primary-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPersonSelect(anniversary.couple[1].id);
                            }}
                          >
                            {anniversary.couple[1].firstName} {anniversary.couple[1].lastName}
                          </button>
                        </div>
                        <div className="text-sm text-gray-600">
                          {anniversary.dateType === 'hebrew' ? (
                            <span>
                              {formatHebrewDate(anniversary.date)} 
                              {anniversary.gregorianDate && <span className="text-xs">({anniversary.gregorianDate})</span>}
                            </span>
                          ) : (
                            <span>
                              {anniversary.date}
                              {anniversary.hebrewDate && <span className="text-xs"> ({formatHebrewDate(anniversary.hebrewDate)})</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-primary-600 font-bold">
                        {anniversary.daysUntil === 0 
                          ? 'היום!' 
                          : anniversary.daysUntil === 1 
                            ? 'מחר' 
                            : `בעוד ${anniversary.daysUntil} ימים`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">אין ימי נישואין קרובים</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 