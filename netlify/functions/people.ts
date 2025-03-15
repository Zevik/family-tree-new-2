import mongoose from 'mongoose';
import PersonModel from '../../src/models/PersonModel';
import { Person } from '../../src/models/Person';
import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  try {
    // התחברות למסד הנתונים
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!, {
        bufferCommands: false,
      });
    }
    
    // קבלת הנתונים
    const people = await PersonModel.find({}).lean();
    
    // עיבוד הנתונים (אם צריך)
    console.log('API: Fetched', people.length, 'people from database');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(people)
    };
  } catch (error) {
    console.error('Error fetching people:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to fetch people', message: (error as Error).message })
    };
  }
};

export { handler }; 