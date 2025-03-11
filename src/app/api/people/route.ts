import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PersonModel from '@/models/PersonModel';
import { processData } from '@/utils/familyUtils';
import { Person } from '@/models/Person';

export async function GET() {
  console.log('API: GET /api/people called');
  try {
    console.log('API: Connecting to database...');
    await dbConnect();
    console.log('API: Connected to database');
    
    console.log('API: Fetching people from database...');
    const people = await PersonModel.find<Person>({}).lean();
    console.log('API: Fetched', people.length, 'people from database');
    
    console.log('API: Processing data...');
    const processedData = processData(people);
    console.log('API: Processed data, returning', processedData.length, 'items');
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('API: Error fetching people:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
} 