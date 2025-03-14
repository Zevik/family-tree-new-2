# עץ משפחה

פרויקט עץ משפחה דינמי המאפשר למשתמשים לבנות ולצפות בעץ משפחה, תוך ניהול פרטים אישיים וקשרים משפחתיים.

## תכונות

- תצוגת עץ משפחה דינמית
- ניהול קשרים משפחתיים (הורים, ילדים, אחים, בני זוג)
- חיפוש אנשים בעץ המשפחה
- תמיכה בתאריכים עבריים ולועזיים
- ממשק משתמש מודרני ונוח

## טכנולוגיות

- Next.js 14
- TypeScript
- Tailwind CSS
- MongoDB (Mongoose)
- SWR לניהול מצב ובקשות

## התקנה

1. התקן את התלויות:

```bash
npm install
```

2. צור קובץ `.env.local` והוסף את משתני הסביבה הבאים:

```
MONGODB_URI=your_mongodb_connection_string
```

3. הפעל את שרת הפיתוח:

```bash
npm run dev
```

4. פתח את [http://localhost:3000](http://localhost:3000) בדפדפן שלך.

## פריסה

הפרויקט מוכן לפריסה בנטליפיי. פשוט התחבר לחשבון נטליפיי שלך והפעל את הפקודה:

```bash
npx netlify deploy
```

## רישיון

MIT 