import mongoose from 'mongoose';
import PersonModel from '../../src/models/PersonModel';
import { Person } from '../../src/models/Person';
import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  try {
    // בדיקת סוג הבקשה
    const httpMethod = event.httpMethod;
    
    // התחברות למסד הנתונים
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!, {
        bufferCommands: false,
      });
    }
    
    // קבלת ה-ID מהנתיב
    const id = event.path.split('/').pop();
    
    if (httpMethod === 'GET') {
      // קבלת אדם ספציפי לפי ID
      const person = await PersonModel.findOne({ id: id }).lean();
      
      if (!person) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Person not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(person)
      };
    } else if (httpMethod === 'PUT' || httpMethod === 'PATCH') {
      // עדכון אדם
      const data = JSON.parse(event.body || '{}');
      const updatedPerson = await PersonModel.findOneAndUpdate(
        { id: id },
        data,
        { new: true }
      ).lean();
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(updatedPerson)
      };
    } else if (httpMethod === 'DELETE') {
      // מחיקת אדם
      await PersonModel.findOneAndDelete({ id: id });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Error handling person request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to process request', message: (error as Error).message })
    };
  }
};

export { handler }; 