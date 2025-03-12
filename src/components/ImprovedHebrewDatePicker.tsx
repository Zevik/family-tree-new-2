'use client';

import React, { useState, useEffect } from 'react';
import { ReactJewishDatePicker, BasicJewishDay, BasicJewishDate } from "react-jewish-datepicker";
import "react-jewish-datepicker/dist/index.css";

// הגדרה מחדש של ה-enum JewishMonth כדי לפתור את הבעיה
enum JewishMonth {
  Nisan = 'Nisan',
  Iyyar = 'Iyyar',
  Sivan = 'Sivan',
  Tammuz = 'Tammuz',
  Av = 'Av',
  Elul = 'Elul',
  Tishri = 'Tishri',
  Cheshvan = 'Cheshvan',
  Kislev = 'Kislev',
  Tevet = 'Tevet',
  Shevat = 'Shevat',
  Adar = 'Adar',
  AdarI = 'AdarI',
  AdarII = 'AdarII',
  None = 'None'
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
  const [hebrewDateText, setHebrewDateText] = useState<string>('');
  
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
              monthName: monthName as any,
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

  // פונקציה לטיפול בשינוי תאריך
  const handleDateChange = (day: BasicJewishDay) => {
    try {
      console.log('Date changed:', day);
      setSelectedDay(day);
      
      // יצירת מחרוזת תאריך עברי
      const hebrewDateStr = isHebrew 
        ? `${day.jewishDate.day} ${getHebrewMonthName(day.jewishDate.monthName)} ${day.jewishDate.year}`
        : `${day.jewishDate.day} ${day.jewishDate.monthName} ${day.jewishDate.year}`;
      setHebrewDateText(hebrewDateStr);
      
      // המרת התאריך הלועזי לאובייקט Date אם הוא קיים
      let gregorianDate: Date | undefined = undefined;
      
      // בדיקה בטוחה של התאריך הלועזי
      const anyDay = day as any;
      if (anyDay && anyDay.gregorianDate && 
          typeof anyDay.gregorianDate.year === 'number' && 
          typeof anyDay.gregorianDate.month === 'number' && 
          typeof anyDay.gregorianDate.day === 'number') {
        gregorianDate = new Date(
          anyDay.gregorianDate.year, 
          anyDay.gregorianDate.month - 1, 
          anyDay.gregorianDate.day
        );
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
      [JewishMonth.Tammuz]: 'תמוז',
      [JewishMonth.Av]: 'אב',
      [JewishMonth.Elul]: 'אלול',
      [JewishMonth.Tishri]: 'תשרי',
      [JewishMonth.Cheshvan]: 'חשון',
      [JewishMonth.Kislev]: 'כסלו',
      [JewishMonth.Tevet]: 'טבת',
      [JewishMonth.Shevat]: 'שבט',
      [JewishMonth.Adar]: 'אדר',
      [JewishMonth.AdarI]: 'אדר א׳',
      [JewishMonth.AdarII]: 'אדר ב׳'
    };
    
    return hebrewMonthNames[monthName] || monthName;
  };

  // פונקציה להמרת שם חודש עברי בעברית לשם באנגלית
  const getJewishMonthFromHebrew = (hebrewName: string): JewishMonth => {
    const monthMap: Record<string, JewishMonth> = {
      'ניסן': JewishMonth.Nisan,
      'אייר': JewishMonth.Iyyar,
      'סיון': JewishMonth.Sivan,
      'תמוז': JewishMonth.Tammuz,
      'אב': JewishMonth.Av,
      'אלול': JewishMonth.Elul,
      'תשרי': JewishMonth.Tishri,
      'חשון': JewishMonth.Cheshvan,
      'כסלו': JewishMonth.Kislev,
      'טבת': JewishMonth.Tevet,
      'שבט': JewishMonth.Shevat,
      'אדר': JewishMonth.Adar,
      'אדר א׳': JewishMonth.AdarI,
      'אדר ב׳': JewishMonth.AdarII
    };
    
    return monthMap[hebrewName] || JewishMonth.None;
  };

  // פונקציה לרינדור בטוח של תאריך לועזי
  const renderGregorianDate = () => {
    try {
      const anyDay = selectedDay as any;
      if (anyDay && anyDay.gregorianDate && 
          typeof anyDay.gregorianDate.day === 'number' && 
          typeof anyDay.gregorianDate.month === 'number' && 
          typeof anyDay.gregorianDate.year === 'number') {
        return `${anyDay.gregorianDate.day}/${anyDay.gregorianDate.month}/${anyDay.gregorianDate.year}`;
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