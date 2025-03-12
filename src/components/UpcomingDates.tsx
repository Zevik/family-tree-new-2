'use client';

import { useState, useEffect } from 'react';
import { PersonWithRelations } from '@/models/Person';
import { getUpcomingDates, getCurrentHebrewDate } from '@/utils/familyUtils';
import { FaBirthdayCake, FaHeart, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface UpcomingDatesProps {
  people: PersonWithRelations[];
  onPersonSelect: (personId: string) => void;
}

export default function UpcomingDates({ people, onPersonSelect }: UpcomingDatesProps) {
  console.log('UpcomingDates component rendering, people:', people ? people.length : 0);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState<{ 
    gregorian: string,
    hebrew: string | null
  }>({ 
    gregorian: '',
    hebrew: null
  });
  
  let birthdays: any[] = [];
  let anniversaries: any[] = [];
  
  try {
    console.log('Calling getUpcomingDates');
    const result = getUpcomingDates(people);
    birthdays = result.birthdays;
    anniversaries = result.anniversaries;
    console.log('getUpcomingDates result:', { 
      birthdays: birthdays.length, 
      anniversaries: anniversaries.length 
    });
  } catch (error) {
    console.error('Error in getUpcomingDates:', error);
    birthdays = [];
    anniversaries = [];
  }
  
  useEffect(() => {
    // קבלת התאריך הנוכחי
    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1; // getMonth() מחזיר 0-11
      const year = today.getFullYear();
      
      const gregorianDate = `${day}/${month}/${year}`;
      console.log('Setting current Gregorian date:', gregorianDate);
      
      // קבלת התאריך העברי הנוכחי
      const fetchHebrewDate = async () => {
        try {
          const hebrewDate = await getCurrentHebrewDate();
          if (hebrewDate) {
            console.log('Current Hebrew date:', hebrewDate);
            setCurrentDate({ 
              gregorian: gregorianDate,
              hebrew: hebrewDate.hebrew
            });
          } else {
            setCurrentDate({ 
              gregorian: gregorianDate,
              hebrew: null
            });
          }
        } catch (error) {
          console.error('Error fetching Hebrew date:', error);
          setCurrentDate({ 
            gregorian: gregorianDate,
            hebrew: null
          });
        }
      };
      
      fetchHebrewDate();
    } catch (error) {
      console.error('Error setting current date:', error);
    }
  }, []);
  
  const hasUpcomingDates = birthdays.length > 0 || anniversaries.length > 0;
  
  console.log('hasUpcomingDates:', hasUpcomingDates);
  
  if (!hasUpcomingDates) {
    console.log('No upcoming dates, returning null');
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FaCalendarAlt className="text-primary-500 ml-2" />
          תאריכים קרובים
        </h2>
        
        <div className="flex items-center">
          <div className="text-sm text-gray-500 ml-4 text-left">
            {currentDate.hebrew && (
              <div className="font-bold">{currentDate.hebrew}</div>
            )}
            <div>{currentDate.gregorian}</div>
          </div>
          <button className="text-gray-500">
            {isExpanded ? (
              <FaChevronUp onClick={() => setIsExpanded(false)} />
            ) : (
              <FaChevronDown onClick={() => setIsExpanded(true)} />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-6">
          {/* ימי הולדת */}
          {birthdays.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center">
                <FaBirthdayCake className="text-primary-500 ml-2" />
                ימי הולדת
              </h3>
              <ul className="space-y-2">
                {birthdays.slice(0, 5).map((birthday, index) => (
                  <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <button 
                      className="text-primary-600 hover:underline text-right"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPersonSelect(birthday.person.id);
                      }}
                    >
                      {birthday.person.firstName} {birthday.person.lastName}
                    </button>
                    <div className="flex flex-col items-end">
                      <span className="text-sm">{birthday.date}</span>
                      <span className="text-xs text-gray-500">
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
            </div>
          )}
          
          {/* ימי נישואין */}
          {anniversaries.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center">
                <FaHeart className="text-primary-500 ml-2" />
                ימי נישואין
              </h3>
              <ul className="space-y-2">
                {anniversaries.slice(0, 5).map((anniversary, index) => (
                  <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <div>
                      <button 
                        className="text-primary-600 hover:underline block text-right"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPersonSelect(anniversary.couple[0].id);
                        }}
                      >
                        {anniversary.couple[0].firstName} {anniversary.couple[0].lastName}
                      </button>
                      <span className="text-sm text-gray-500 mx-2">ו-</span>
                      <button 
                        className="text-primary-600 hover:underline block text-right"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPersonSelect(anniversary.couple[1].id);
                        }}
                      >
                        {anniversary.couple[1].firstName} {anniversary.couple[1].lastName}
                      </button>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm">{anniversary.date}</span>
                      <span className="text-xs text-gray-500">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
} 