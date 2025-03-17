import mongoose from 'mongoose';
import PersonModel from '../../src/models/PersonModel';
import { Person } from '../../src/models/Person';
import { Handler } from '@netlify/functions';
import { HebrewCalendar, HDate, Location } from '@hebcal/core';

const calculateDaysUntilNextBirthday = (birthDate: string, format: 'hebrew' | 'gregorian'): number => {
  const today = new Date();
  let birthDateObj: Date;
  
  if (format === 'hebrew') {
    // המרת תאריך עברי ללועזי
    const [_, month] = birthDate.split(' ');
    // מיפוי חודשים עבריים למספרים
    const hebrewMonths: { [key: string]: number } = {
      'בתשרי': 1, 'בחשון': 2, 'בכסלו': 3, 'בטבת': 4,
      'בשבט': 5, 'באדר': 6, 'בניסן': 7, 'באייר': 8,
      'בסיון': 9, 'בתמוז': 10, 'באב': 11, 'באלול': 12
    };
    
    const monthNum = hebrewMonths[month];
    if (!monthNum) {
      throw new Error(`Invalid Hebrew month: ${month}`);
    }
    
    // יצירת תאריך עברי
    const hdate = new HDate(1, monthNum, today.getFullYear());
    // קבלת התאריך הלועזי הבא של יום ההולדת
    const todayHeb = new HDate(today);
    const nextDate = HebrewCalendar.getBirthdayOrAnniversary(todayHeb.getFullYear(), hdate);
    birthDateObj = nextDate.greg();
  } else {
    // פיצול התאריך הלועזי dd/mm/yyyy
    const [day, month, year] = birthDate.split('/');
    birthDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // יצירת תאריך יום ההולדת הבא
  const nextBirthday = new Date(today.getFullYear(), birthDateObj.getMonth(), birthDateObj.getDate());
  
  // אם התאריך כבר עבר השנה, נוסיף שנה
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  // חישוב ההפרש בימים
  const diffTime = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

const handler: Handler = async (event, context) => {
  try {
    // התחברות למסד הנתונים
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!, {
        bufferCommands: false,
      });
    }

    // אם זו בקשת DELETE, נמחק את כל האנשים
    if (event.httpMethod === 'DELETE') {
      await PersonModel.deleteMany({});
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, message: 'All people were deleted successfully' })
      };
    }
    
    // אם זו בקשת GET, נחזיר את כל האנשים כרגיל
    const people = await PersonModel.find({}).lean();
    
    // מיפוי קשרים
    const peopleMap = new Map(people.map(p => [p.id, p]));
    
    // עיבוד התאריכים והקשרים לכל אדם
    const processedPeople = people.map(person => {
      // חישוב ימים עד יום ההולדת
      const daysUntil = calculateDaysUntilNextBirthday(
        person.primaryDateFormat === 'hebrew' ? person.birthDateHebrew : person.birthDateGregorian,
        person.primaryDateFormat
      );
      
      // הוספת קשרים
      const father = person.fatherId ? peopleMap.get(person.fatherId) : null;
      const mother = person.motherId ? peopleMap.get(person.motherId) : null;
      const spouse = person.spouseId ? peopleMap.get(person.spouseId) : null;
      const children = people.filter(p => p.fatherId === person.id || p.motherId === person.id);
      
      return {
        ...person,
        daysUntilBirthday: daysUntil,
        father: father ? {
          id: father.id,
          name: `${father.firstName} ${father.lastName}`
        } : null,
        mother: mother ? {
          id: mother.id,
          name: `${mother.firstName} ${mother.lastName}`
        } : null,
        spouse: spouse ? {
          id: spouse.id,
          name: `${spouse.firstName} ${spouse.lastName}`
        } : null,
        children: children.map(child => ({
          id: child.id,
          name: `${child.firstName} ${child.lastName}`
        }))
      };
    });
    
    console.log('API: Fetched and processed', people.length, 'people from database');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(processedPeople)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Operation failed', message: (error as Error).message })
    };
  }
};

export { handler }; 