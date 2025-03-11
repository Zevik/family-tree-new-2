'use client';

import React, { useState, useEffect } from 'react';
import { ReactJewishDatePicker, BasicJewishDay, BasicJewishDate } from "react-jewish-datepicker";
import "react-jewish-datepicker/dist/index.css";

// הגדרה מחדש של ה-enum JewishMonth כדי לפתור את הבעיה
enum JewishMonth {
  Nisan = 'Nisan',
  Iyyar = 'Iyyar',
  Sivan = 'Sivan',
  Tamuz = 'Tamuz',
  Av = 'Av',
  Elul = 'Elul',
  Tishrei = 'Tishrei',
  Cheshvan = 'Cheshvan',
  Kislev = 'Kislev',
  Tevet = 'Tevet',
  Shevat = 'Shevat',
  Adar = 'Adar',
  Adar1 = 'Adar1',
  Adar2 = 'Adar2'
}

interface ImprovedHebrewDatePickerProps {
  value?: string;
  onChange: (hebrewDate: string, gregorianDate?: Date) => void;
  className?: string;
  label?: string;
  isHebrew?: boolean;
}

export default function ImprovedHebrewDatePicker({
  value,
  onChange,
  className,
  label,
  isHebrew = true
}: ImprovedHebrewDatePickerProps) {
  const [selectedDay, setSelectedDay] = useState<BasicJewishDay | undefined>();
  const [initialDate, setInitialDate] = useState<BasicJewishDate | undefined>();
  
  console.log('ImprovedHebrewDatePicker rendering with value:', value);

  // אתחול התאריך ההתחלתי אם יש ערך
  useEffect(() => {
    if (value && !selectedDay) {
      console.log('Trying to parse initial value:', value);
      // ננסה לפרסר את הערך ההתחלתי
      try {
        // אם יש לנו תאריך עברי בפורמט מחרוזת, ננסה לפרסר אותו
        // לדוגמה: "15 ניסן 5783"
        const parts = value.split(' ');
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const monthName = getJewishMonthFromHebrew(parts[1]);
          const year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && monthName && !isNaN(year)) {
            const initialJewishDate: BasicJewishDate = {
              day,
              monthName,
              year
            };
            console.log('Setting initial date:', initialJewishDate);
            setInitialDate(initialJewishDate);
          }
        }
      } catch (error) {
        console.error('Error parsing initial date:', error);
      }
    } else if (!value) {
      setSelectedDay(undefined);
      setInitialDate(undefined);
    }
  }, [value, selectedDay]);

  // טיפול בשינוי תאריך
  const handleDateChange = (day: BasicJewishDay) => {
    console.log('Date selected:', day);
    setSelectedDay(day);
    
    try {
      // בדיקה שיש לנו את כל הנתונים הדרושים
      if (!day || !day.jewishDate) {
        console.error('Invalid day object:', day);
        return;
      }
      
      // המרת התאריך לפורמט מחרוזת
      const hebrewDateStr = isHebrew 
        ? `${day.jewishDate.day} ${getHebrewMonthName(day.jewishDate.monthName)} ${day.jewishDate.year}`
        : `${day.jewishDate.day} ${day.jewishDate.monthName} ${day.jewishDate.year}`;
      
      console.log('Hebrew date string:', hebrewDateStr);
      
      // המרת התאריך הלועזי לאובייקט Date אם הוא קיים
      let gregorianDate: Date | undefined = undefined;
      if (day.gregorianDate && typeof day.gregorianDate.year === 'number' && 
          typeof day.gregorianDate.month === 'number' && 
          typeof day.gregorianDate.day === 'number') {
        gregorianDate = new Date(day.gregorianDate.year, day.gregorianDate.month - 1, day.gregorianDate.day);
      }
      
      onChange(hebrewDateStr, gregorianDate);
    } catch (error) {
      console.error('Error in handleDateChange:', error);
    }
  };

  // פונקציה להמרת שם חודש עברי לעברית
  const getHebrewMonthName = (monthName: string): string => {
    const hebrewMonthNames: Record<string, string> = {
      [JewishMonth.Nisan]: 'ניסן',
      [JewishMonth.Iyyar]: 'אייר',
      [JewishMonth.Sivan]: 'סיון',
      [JewishMonth.Tamuz]: 'תמוז',
      [JewishMonth.Av]: 'אב',
      [JewishMonth.Elul]: 'אלול',
      [JewishMonth.Tishrei]: 'תשרי',
      [JewishMonth.Cheshvan]: 'חשון',
      [JewishMonth.Kislev]: 'כסלו',
      [JewishMonth.Tevet]: 'טבת',
      [JewishMonth.Shevat]: 'שבט',
      [JewishMonth.Adar]: 'אדר',
      [JewishMonth.Adar1]: 'אדר א׳',
      [JewishMonth.Adar2]: 'אדר ב׳'
    };
    
    return hebrewMonthNames[monthName] || monthName;
  };

  // פונקציה להמרת שם חודש עברי בעברית לערך JewishMonth
  const getJewishMonthFromHebrew = (hebrewName: string): string | undefined => {
    const monthMap: Record<string, string> = {
      'ניסן': JewishMonth.Nisan,
      'אייר': JewishMonth.Iyyar,
      'סיון': JewishMonth.Sivan,
      'תמוז': JewishMonth.Tamuz,
      'אב': JewishMonth.Av,
      'אלול': JewishMonth.Elul,
      'תשרי': JewishMonth.Tishrei,
      'חשון': JewishMonth.Cheshvan,
      'כסלו': JewishMonth.Kislev,
      'טבת': JewishMonth.Tevet,
      'שבט': JewishMonth.Shevat,
      'אדר': JewishMonth.Adar,
      'אדר א׳': JewishMonth.Adar1,
      'אדר ב׳': JewishMonth.Adar2
    };
    
    return monthMap[hebrewName];
  };

  // פונקציה לרינדור בטוח של תאריך לועזי
  const renderGregorianDate = () => {
    try {
      if (selectedDay && selectedDay.gregorianDate && 
          typeof selectedDay.gregorianDate.day === 'number' && 
          typeof selectedDay.gregorianDate.month === 'number' && 
          typeof selectedDay.gregorianDate.year === 'number') {
        return `${selectedDay.gregorianDate.day}/${selectedDay.gregorianDate.month}/${selectedDay.gregorianDate.year}`;
      }
      return 'תאריך לא זמין';
    } catch (error) {
      console.error('Error rendering Gregorian date:', error);
      return 'שגיאה בהצגת התאריך';
    }
  };

  // פונקציה לרינדור בטוח של תאריך עברי
  const renderHebrewDate = () => {
    try {
      if (selectedDay && selectedDay.jewishDate) {
        return isHebrew 
          ? `${selectedDay.jewishDate.day} ${getHebrewMonthName(selectedDay.jewishDate.monthName)} ${selectedDay.jewishDate.year}`
          : `${selectedDay.jewishDate.day} ${selectedDay.jewishDate.monthName} ${selectedDay.jewishDate.year}`;
      }
      return 'תאריך לא זמין';
    } catch (error) {
      console.error('Error rendering Hebrew date:', error);
      return 'שגיאה בהצגת התאריך';
    }
  };

  return (
    <div className={`improved-hebrew-date-picker ${className || ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
          {label}
        </label>
      )}
      
      <div className="rtl-wrapper" dir="rtl">
        <ReactJewishDatePicker
          isHebrew={isHebrew}
          onClick={handleDateChange}
          className="w-full"
          value={initialDate}
        />
      </div>
      
      {selectedDay && (
        <div className="mt-2 text-sm text-gray-600 text-right">
          <p>
            תאריך עברי: {renderHebrewDate()}
          </p>
          <p>
            תאריך לועזי: {renderGregorianDate()}
          </p>
        </div>
      )}
    </div>
  );
}