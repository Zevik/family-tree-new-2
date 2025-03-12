import { Person, PersonWithRelations } from '@/models/Person';

export function processData(people: Person[]): PersonWithRelations[] {
  console.log('processData: Starting to process', people ? people.length : 0, 'people');
  
  if (!people || people.length === 0) {
    console.log('processData: No people to process, returning empty array');
    return [];
  }

  // Create a map of people by ID for quick lookup
  const peopleMap = new Map<string, Person>();
  people.forEach((person) => {
    if (!person.hidden) {
      peopleMap.set(person.id, person);
    }
  });
  console.log('processData: Created map with', peopleMap.size, 'people');

  // Create a map of children by parent ID
  const childrenByParent = new Map<string, Set<string>>();
  
  // First pass: populate the peopleMap
  people.forEach((person) => {
    if (person.hidden) return;
    
    // Add children to their parents' sets
    if (person.fatherId && peopleMap.has(person.fatherId)) {
      if (!childrenByParent.has(person.fatherId)) {
        childrenByParent.set(person.fatherId, new Set());
      }
      childrenByParent.get(person.fatherId)!.add(person.id);
    }
    
    if (person.motherId && peopleMap.has(person.motherId)) {
      if (!childrenByParent.has(person.motherId)) {
        childrenByParent.set(person.motherId, new Set());
      }
      childrenByParent.get(person.motherId)!.add(person.id);
    }
  });
  console.log('processData: Created children map with', childrenByParent.size, 'parents');

  // Second pass: build relationships
  const result: PersonWithRelations[] = [];
  
  try {
    peopleMap.forEach((person) => {
      const personWithRelations: PersonWithRelations = { ...person };
      
      // Add father
      if (person.fatherId && peopleMap.has(person.fatherId)) {
        const father = peopleMap.get(person.fatherId)!;
        personWithRelations.father = {
          id: father.id,
          name: `${father.firstName} ${father.lastName}`,
        };
      }
      
      // Add mother
      if (person.motherId && peopleMap.has(person.motherId)) {
        const mother = peopleMap.get(person.motherId)!;
        personWithRelations.mother = {
          id: mother.id,
          name: `${mother.firstName} ${mother.lastName}`,
        };
      }
      
      // Add spouse
      if (person.spouseId && peopleMap.has(person.spouseId)) {
        const spouse = peopleMap.get(person.spouseId)!;
        personWithRelations.spouse = {
          id: spouse.id,
          name: `${spouse.firstName} ${spouse.lastName}`,
          marriageDate: person.marriageDate,
          marriageDateHebrew: person.marriageDateHebrew,
        };
      }
      
      // Add children
      if (childrenByParent.has(person.id)) {
        personWithRelations.children = Array.from(childrenByParent.get(person.id)!)
          .map((childId) => {
            const child = peopleMap.get(childId)!;
            return {
              id: child.id,
              name: `${child.firstName} ${child.lastName}`,
            };
          });
      }
      
      // Add siblings
      const siblings: PersonWithRelations['siblings'] = [];
      
      // Get father's children
      if (person.fatherId && childrenByParent.has(person.fatherId)) {
        const fatherChildren = childrenByParent.get(person.fatherId)!;
        
        // Get mother's children
        if (person.motherId && childrenByParent.has(person.motherId)) {
          const motherChildren = childrenByParent.get(person.motherId)!;
          
          // Full siblings (same father and mother)
          const fullSiblings = new Set<string>();
          fatherChildren.forEach((childId) => {
            if (childId !== person.id && motherChildren.has(childId)) {
              fullSiblings.add(childId);
              const sibling = peopleMap.get(childId)!;
              siblings.push({
                id: sibling.id,
                name: `${sibling.firstName} ${sibling.lastName}`,
                isHalfSibling: false,
              });
            }
          });
          
          // Half siblings from mother
          motherChildren.forEach((childId) => {
            if (childId !== person.id && !fullSiblings.has(childId)) {
              const sibling = peopleMap.get(childId)!;
              siblings.push({
                id: sibling.id,
                name: `${sibling.firstName} ${sibling.lastName}`,
                isHalfSibling: true,
                commonParent: 'mother',
              });
            }
          });
          
          // Half siblings from father
          fatherChildren.forEach((childId) => {
            if (childId !== person.id && !fullSiblings.has(childId) && !motherChildren.has(childId)) {
              const sibling = peopleMap.get(childId)!;
              siblings.push({
                id: sibling.id,
                name: `${sibling.firstName} ${sibling.lastName}`,
                isHalfSibling: true,
                commonParent: 'father',
              });
            }
          });
        } else {
          // Only father's children (all half siblings)
          fatherChildren.forEach((childId) => {
            if (childId !== person.id) {
              const sibling = peopleMap.get(childId)!;
              siblings.push({
                id: sibling.id,
                name: `${sibling.firstName} ${sibling.lastName}`,
                isHalfSibling: true,
                commonParent: 'father',
              });
            }
          });
        }
      } else if (person.motherId && childrenByParent.has(person.motherId)) {
        // Only mother's children (all half siblings)
        const motherChildren = childrenByParent.get(person.motherId)!;
        motherChildren.forEach((childId) => {
          if (childId !== person.id) {
            const sibling = peopleMap.get(childId)!;
            siblings.push({
              id: sibling.id,
              name: `${sibling.firstName} ${sibling.lastName}`,
              isHalfSibling: true,
              commonParent: 'mother',
            });
          }
        });
      }
      
      if (siblings.length > 0) {
        personWithRelations.siblings = siblings;
      }
      
      result.push(personWithRelations);
    });
  } catch (error) {
    console.error('processData: Error building relationships:', error);
  }
  
  console.log('processData: Finished processing, returning', result.length, 'people with relationships');
  return result;
}

export function generateUniqueId(): string {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// פונקציה לקבלת תאריכים קרובים במשפחה
export function getUpcomingDates(people: PersonWithRelations[]): {
  birthdays: Array<{ person: PersonWithRelations, date: string, daysUntil: number }>;
  anniversaries: Array<{ couple: [PersonWithRelations, PersonWithRelations], date: string, daysUntil: number }>;
} {
  console.log('getUpcomingDates: Starting with', people ? people.length : 0, 'people');
  
  if (!people || !Array.isArray(people)) {
    console.log('getUpcomingDates: Invalid input, returning empty arrays');
    return { birthdays: [], anniversaries: [] };
  }
  
  const birthdays: Array<{ person: PersonWithRelations, date: string, daysUntil: number }> = [];
  const anniversaries: Array<{ couple: [PersonWithRelations, PersonWithRelations], date: string, daysUntil: number }> = [];
  
  try {
    // קבלת התאריך העברי הנוכחי
    const currentHebrewDate = getCurrentHebrewDate();
    console.log('Current Hebrew date:', currentHebrewDate);
    
    // מעבר על כל האנשים
    people.forEach(person => {
      if (!person) {
        console.log('getUpcomingDates: Skipping undefined person');
        return;
      }
      
      // בדיקת יום הולדת
      if (person.notifyOnBirthday) {
        if (person.primaryDateFormat === 'hebrew' && person.birthDateHebrew) {
          // חישוב מספר הימים עד יום ההולדת העברי הבא
          const daysUntil = calculateDaysUntilHebrewDate(person.birthDateHebrew, currentHebrewDate);
          console.log(`Calculated days until Hebrew birthday for ${person.firstName}: ${daysUntil}`);
          
          birthdays.push({
            person,
            date: person.birthDateHebrew,
            daysUntil
          });
        } else if (person.birthDateGregorian) {
          // חישוב מספר הימים עד יום ההולדת הלועזי הבא
          const daysUntil = calculateDaysUntil(person.birthDateGregorian);
          console.log(`Calculated days until Gregorian birthday for ${person.firstName}: ${daysUntil}`);
          
          birthdays.push({
            person,
            date: person.birthDateGregorian,
            daysUntil
          });
        }
      }
      
      // בדיקת יום נישואין
      if (person.notifyOnMarriageAnniversary && person.spouse && person.spouseId) {
        if (person.primaryDateFormat === 'hebrew' && person.marriageDateHebrew) {
          // חישוב מספר הימים עד יום הנישואין העברי הבא
          const daysUntil = calculateDaysUntilHebrewDate(person.marriageDateHebrew, currentHebrewDate);
          console.log(`Calculated days until Hebrew anniversary for ${person.firstName}: ${daysUntil}`);
          
          // מציאת בן/בת הזוג
          const spouse = people.find(p => p && p.id === person.spouseId);
          
          if (spouse) {
            // נוסיף רק פעם אחת לכל זוג (כשהמזהה של האדם קטן מהמזהה של בן/בת הזוג)
            if (person.id < spouse.id) {
              anniversaries.push({
                couple: [person, spouse],
                date: person.marriageDateHebrew,
                daysUntil
              });
            }
          }
        } else if (person.marriageDate) {
          // חישוב מספר הימים עד יום הנישואין הלועזי הבא
          const daysUntil = calculateDaysUntil(person.marriageDate);
          console.log(`Calculated days until Gregorian anniversary for ${person.firstName}: ${daysUntil}`);
          
          // מציאת בן/בת הזוג
          const spouse = people.find(p => p && p.id === person.spouseId);
          
          if (spouse) {
            // נוסיף רק פעם אחת לכל זוג (כשהמזהה של האדם קטן מהמזהה של בן/בת הזוג)
            if (person.id < spouse.id) {
              anniversaries.push({
                couple: [person, spouse],
                date: person.marriageDate,
                daysUntil
              });
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('getUpcomingDates: Error processing dates:', error);
    return { birthdays: [], anniversaries: [] };
  }
  
  // מיון לפי מספר הימים עד התאריך
  birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  anniversaries.sort((a, b) => a.daysUntil - b.daysUntil);
  
  console.log('getUpcomingDates: Finished, returning', birthdays.length, 'birthdays and', anniversaries.length, 'anniversaries');
  return { birthdays, anniversaries };
}

// פונקציה לחישוב מספר הימים עד התאריך הלועזי הבא
function calculateDaysUntil(dateString: string): number {
  try {
    console.log(`Calculating days until date: ${dateString}`);
    
    // פירוק התאריך בפורמט DD/MM/YYYY
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      console.log(`Invalid date format: ${dateString}, returning default value`);
      return 30; // ערך ברירת מחדל
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // החודשים ב-JavaScript הם 0-11
    
    if (isNaN(day) || isNaN(month)) {
      console.log(`Invalid day or month in date: ${dateString}, returning default value`);
      return 30; // ערך ברירת מחדל
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // יצירת תאריך היעד בשנה הנוכחית
    const targetDate = new Date(currentYear, month, day);
    console.log(`Target date for this year: ${targetDate.toDateString()}`);
    
    // אם התאריך כבר עבר השנה, נחשב לשנה הבאה
    if (targetDate < today) {
      targetDate.setFullYear(currentYear + 1);
      console.log(`Date already passed this year, using next year: ${targetDate.toDateString()}`);
    }
    
    // חישוב ההפרש בימים
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`Days until ${dateString}: ${diffDays}`);
    return diffDays;
  } catch (error) {
    console.error(`Error calculating days until ${dateString}:`, error);
    return 30; // ערך ברירת מחדל במקרה של שגיאה
  }
}

// פונקציה לקבלת התאריך העברי הנוכחי
export async function getCurrentHebrewDate(): Promise<{
  day: number;
  month: string;
  year: number;
  hebrew: string;
  monthName: string;
} | null> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() מחזיר 0-11
    const day = today.getDate();
    
    console.log(`Getting Hebrew date for ${day}/${month}/${year}`);
    
    // שימוש ב-API של Hebcal לקבלת התאריך העברי
    const url = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Hebrew date data:', data);
    
    return {
      day: data.hd,
      month: data.hm,
      year: data.hy,
      hebrew: data.hebrew,
      monthName: data.heDateParts.m
    };
  } catch (error) {
    console.error('Error getting Hebrew date:', error);
    return null;
  }
}

// פונקציה לחישוב מספר הימים עד התאריך העברי הבא
function calculateDaysUntilHebrewDate(hebrewDateString: string, currentHebrewDate: any): number {
  try {
    if (!currentHebrewDate) {
      console.log('Current Hebrew date not available, using default value');
      return 30; // ערך ברירת מחדל
    }
    
    console.log(`Calculating days until Hebrew date: ${hebrewDateString}`);
    
    // פירוק התאריך העברי (בפורמט "יום חודש")
    const parts = hebrewDateString.split(' ');
    if (parts.length < 2) {
      console.log(`Invalid Hebrew date format: ${hebrewDateString}, returning default value`);
      return 30; // ערך ברירת מחדל
    }
    
    const targetDay = parseInt(parts[0], 10);
    const targetMonth = parts[1];
    
    if (isNaN(targetDay)) {
      console.log(`Invalid Hebrew day in date: ${hebrewDateString}, returning default value`);
      return 30; // ערך ברירת מחדל
    }
    
    // מיפוי חודשים עבריים לסדר שלהם בשנה
    const hebrewMonthOrder: { [key: string]: number } = {
      'תשרי': 1, 'חשון': 2, 'כסלו': 3, 'טבת': 4, 'שבט': 5, 'אדר': 6, 
      'אדר א': 6, 'אדר ב': 7, 'ניסן': 8, 'אייר': 9, 'סיון': 10, 'תמוז': 11, 'אב': 12, 'אלול': 13
    };
    
    const currentMonthOrder = hebrewMonthOrder[currentHebrewDate.monthName] || 0;
    const targetMonthOrder = hebrewMonthOrder[targetMonth] || 0;
    
    if (currentMonthOrder === 0 || targetMonthOrder === 0) {
      console.log(`Unknown month order: current=${currentHebrewDate.monthName}, target=${targetMonth}, returning default value`);
      return 30; // ערך ברירת מחדל
    }
    
    // חישוב מספר הימים עד התאריך העברי הבא
    let monthDiff = targetMonthOrder - currentMonthOrder;
    if (monthDiff < 0) {
      monthDiff += 13; // מספר החודשים בשנה עברית מעוברת
    } else if (monthDiff === 0) {
      // אם אנחנו באותו חודש, בדוק את היום
      let dayDiff = targetDay - currentHebrewDate.day;
      if (dayDiff < 0) {
        // אם היום כבר עבר, נחכה לשנה הבאה
        monthDiff = 13;
      } else {
        // אם היום עוד לא הגיע, נחזיר את מספר הימים שנותרו
        return dayDiff;
      }
    }
    
    // הערכה גסה של מספר הימים בחודש עברי (בממוצע)
    const daysInHebrewMonth = 29.5;
    
    // הערכה גסה של מספר הימים עד התאריך העברי הבא
    let daysUntil = Math.round(monthDiff * daysInHebrewMonth - currentHebrewDate.day + targetDay);
    
    // וידוא שהתוצאה היא חיובית
    if (daysUntil < 0) {
      daysUntil += 385; // מספר הימים בשנה עברית מעוברת
    }
    
    console.log(`Estimated days until Hebrew date ${hebrewDateString}: ${daysUntil}`);
    return daysUntil;
  } catch (error) {
    console.error(`Error calculating days until Hebrew date ${hebrewDateString}:`, error);
    return 30; // ערך ברירת מחדל במקרה של שגיאה
  }
} 