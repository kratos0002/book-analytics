import { Book, Theme, Character, Location, BookAIEnrichment } from '../models/BookTypes';

/**
 * AIEnrichmentService
 * 
 * A service that uses AI (Perplexity API) to enhance book metadata
 * by filling in missing details and enriching existing information.
 */
export class AIEnrichmentService {
  // Use a predefined API key instead of requiring user input
  // In a production environment, this would be a server-side secret
  // For development/demo purposes, we're setting it here
  private API_KEY: string = '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'; // <-- REPLACE THIS with your actual Perplexity API key (starts with pplx-)
  private API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
  
  /**
   * Check if the API key is set and valid
   * @returns True if API key is available
   */
  hasAPIKey(): boolean {
    return Boolean(this.API_KEY && this.API_KEY.startsWith('pplx-') && this.API_KEY.length > 20);
  }
  
  /**
   * Make a request to Perplexity API
   * @param prompt The prompt to send to Perplexity
   * @returns Promise with the AI response
   */
  private async queryPerplexity(prompt: string): Promise<string> {
    if (!this.hasAPIKey()) {
      throw new Error('Perplexity API key not set. Please set a valid API key first.');
    }
    
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: 'pplx-7b-online', // Online model with web search capability
          messages: [
            { role: 'system', content: 'You are a literary analysis expert providing accurate, detailed information about books. Provide rich, structured information in JSON format when requested.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1024,
          temperature: 0.2
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error querying Perplexity API:', error);
      throw error;
    }
  }
  
  /**
   * Identify missing data fields in a book object
   * @param book The book to analyze
   * @returns Array of keys that need enrichment
   */
  identifyMissingData(book: Book): (keyof Book)[] {
    const missingFields: (keyof Book)[] = [];
    
    // Check for empty arrays or undefined values in key fields
    if (!book.themes || book.themes.length === 0) {
      missingFields.push('themes');
    }
    
    if (!book.characters || book.characters.length === 0) {
      missingFields.push('characters');
    }
    
    if (!book.locations || book.locations.length === 0) {
      missingFields.push('locations');
    }
    
    if (!book.narrativeStructure || !book.narrativeStructure.pov) {
      missingFields.push('narrativeStructure');
    }
    
    // Check for missing genre information
    if (!book.genres || book.genres.length === 0) {
      missingFields.push('genres');
    }
    
    if (!book.subgenres || book.subgenres.length === 0) {
      missingFields.push('subgenres');
    }
    
    // Check for missing complexity information
    if (!book.complexity || !book.complexity.conceptual) {
      missingFields.push('complexity');
    }
    
    // Check for missing cultural context
    if (!book.culturalContext || !book.culturalContext.representation) {
      missingFields.push('culturalContext');
    }
    
    return missingFields;
  }
  
  /**
   * Generate a book analysis prompt based on available information
   * @param book The book data to analyze
   * @param section The section to focus on
   * @returns Prompt for Perplexity
   */
  private generatePrompt(book: Book, section: keyof Book): string {
    const baseInfo = `
      Title: ${book.title}
      ${book.subtitle ? `Subtitle: ${book.subtitle}` : ''}
      Author(s): ${book.authors.map(a => a.name).join(', ')}
      Publisher: ${book.publisher}
      Published Date: ${book.publishedDate}
      Description: ${book.description}
      ${book.genres && book.genres.length > 0 ? `Genres: ${book.genres.join(', ')}` : ''}
      ${book.pageCount ? `Page Count: ${book.pageCount}` : ''}
      ${book.language ? `Language: ${book.language}` : ''}
      ${book.isbn ? `ISBN: ${book.isbn}` : ''}
    `;
    
    let specificPrompt = '';
    
    switch(section) {
      case 'themes':
        specificPrompt = `
          Based on the book information above, identify 5-7 major themes in "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          For each theme:
          1. Provide the name of the theme
          2. Rate its relevance/importance to the book on a scale of 1-5
          3. Include a brief note explaining how this theme manifests in the book
          
          Do additional web research if needed to identify accurate themes.
          
          Return the data as a valid JSON array with objects having the following structure:
          [
            {
              "name": "Theme name",
              "relevance": 5, // number between 1-5
              "userNotes": "Brief explanation of theme's significance"
            }
          ]
        `;
        break;
        
      case 'characters':
        specificPrompt = `
          Based on the book information above, identify 3-6 major characters in "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          For each character:
          1. Provide the character's name
          2. Identify their role (protagonist, antagonist, supporting, or minor)
          3. Note their archetype if applicable
          4. Include demographic information if known (gender, age, background, occupation)
          5. List 2-4 key personality traits
          6. Indicate if they undergo character development (static or dynamic)
          
          Do additional web research to find accurate character information.
          
          Return the data as a valid JSON array with objects having the following structure:
          [
            {
              "name": "Character name",
              "role": "protagonist", // one of: protagonist, antagonist, supporting, minor
              "archetype": "The Hero", // if applicable
              "demographics": {
                "gender": "Female",
                "age": "30s",
                "background": "Middle-class American",
                "occupation": "Teacher"
              },
              "personalityTraits": ["intelligent", "determined", "compassionate"],
              "development": "dynamic", // either static or dynamic
              "notes": "Brief description of character arc"
            }
          ]
        `;
        break;
        
      case 'locations':
        specificPrompt = `
          Based on the book information above, identify 2-5 major settings or locations in "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          For each location:
          1. Provide the location name
          2. Classify the type (city, country, region, fictional, planet, or other)
          3. Indicate if it's a real-world place or fictional
          4. Rate its importance to the narrative on a scale of 1-5
          5. Include a brief description of the setting and its significance
          
          Do additional web research to find accurate location information.
          
          Return the data as a valid JSON array with objects having the following structure:
          [
            {
              "name": "Location name",
              "type": "city", // one of: city, country, region, fictional, planet, other
              "realWorld": true, // boolean indicating if real or fictional
              "importance": 4, // number between 1-5
              "description": "Brief description of the location and its significance to the story"
            }
          ]
        `;
        break;
        
      case 'narrativeStructure':
        specificPrompt = `
          Based on the book information above, analyze the narrative structure of "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          
          Determine:
          1. The point of view (POV) used (first-person, second-person, third-person-limited, third-person-omniscient, multiple, or other)
          2. The primary tense used (past, present, future, or mixed)
          3. The timeline structure (linear, non-linear, or multiple-timelines)
          4. The format if applicable (prose, verse, epistolary, mixed-media, or other)
          
          Do additional web research to find accurate information about the book's narrative structure.
          
          Return the data as a valid JSON object with the following structure:
          {
            "pov": "third-person-limited", // one of: first-person, second-person, third-person-limited, third-person-omniscient, multiple, other
            "tense": "past", // one of: past, present, future, mixed
            "timeline": "linear", // one of: linear, non-linear, multiple-timelines
            "format": "prose" // one of: prose, verse, epistolary, mixed-media, other
          }
        `;
        break;
        
      case 'genres':
        specificPrompt = `
          Based on the book information above, identify the most appropriate genres and subgenres for "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          
          Provide:
          1. 1-3 primary genres that best characterize the book
          2. 2-4 more specific subgenres that apply
          3. Determine if the book is fiction or non-fiction
          4. Identify the target audience (children, middle-grade, young-adult, adult, or academic)
          
          Do additional web research to find accurate genre information.
          
          Return the data as a valid JSON object with the following structure:
          {
            "genres": ["Genre1", "Genre2"],
            "subgenres": ["Subgenre1", "Subgenre2", "Subgenre3"],
            "fiction": true, // boolean
            "audience": "adult" // one of: children, middle-grade, young-adult, adult, academic
          }
        `;
        break;
        
      case 'complexity':
        specificPrompt = `
          Based on the book information above, evaluate the complexity of "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          
          Rate on a scale of 1-5 (where 1 is simplest and 5 is most complex):
          1. Readability: How difficult is the language to comprehend?
          2. Vocabulary: How advanced or specialized is the vocabulary?
          3. Conceptual difficulty: How complex are the ideas presented?
          4. Structural complexity: How complex is the narrative structure?
          
          Do additional web research to find accurate information about the book's complexity.
          
          Return the data as a valid JSON object with the following structure:
          {
            "readability": 3, // number between 1-5
            "vocabulary": 4, // number between 1-5
            "conceptual": 4, // number between 1-5
            "structural": 3 // number between 1-5
          }
        `;
        break;
        
      case 'culturalContext':
        specificPrompt = `
          Based on the book information above, analyze the cultural context of "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          
          Identify:
          1. Social groups, identities, or perspectives represented in the book
          2. Elements of diversity or cultural significance
          3. Any sensitive content that readers should be aware of
          
          Do additional web research to find accurate information about the book's cultural context.
          
          Return the data as a valid JSON object with the following structure:
          {
            "representation": ["Group1", "Group2"],
            "diversityElements": ["Element1", "Element2"],
            "sensitivity": "Brief note about potentially sensitive content, if applicable"
          }
        `;
        break;
        
      default:
        specificPrompt = `
          Based on the book information above, provide additional insights about "${book.title}" by ${book.authors.map(a => a.name).join(', ')}.
          
          Focus on any missing or incomplete information and provide factual, researched data that would enhance understanding of this book.
          
          Return the data as JSON with appropriate fields matching the book's data structure.
        `;
    }
    
    return `${baseInfo}\n\n${specificPrompt}`;
  }
  
  /**
   * Parse JSON data from Perplexity API response
   * @param response Raw response from API
   * @returns Parsed JSON data
   */
  private parseJsonFromResponse(response: string): any {
    try {
      // Look for JSON pattern in the response
      const jsonPattern = /```json\n([\s\S]*?)\n```|^\[([\s\S]*)\]$|^\{([\s\S]*)\}$/m;
      const match = response.match(jsonPattern);
      
      if (match) {
        // Use the matched JSON content
        const jsonContent = match[1] || match[2] || match[3] || response;
        return JSON.parse(jsonContent.trim());
      }
      
      // If no JSON pattern found, try parsing the whole response
      return JSON.parse(response.trim());
    } catch (error) {
      console.error('Error parsing JSON from API response:', error);
      console.log('Original response:', response);
      
      // Return null to indicate parsing failure
      return null;
    }
  }
  
  /**
   * Enrich book metadata using AI
   * @param book The book to enrich
   * @returns Promise with the enriched book
   */
  async enrichBookMetadata(book: Book): Promise<Book> {
    // Create a copy of the book to enrich
    const enrichedBook: Book = { ...book };
    
    // Identify missing data fields
    const missingFields = this.identifyMissingData(book);
    console.log(`Fields needing enrichment for "${book.title}":`, missingFields);
    
    // If there's nothing to enrich, return the original book
    if (missingFields.length === 0) {
      console.log(`Book "${book.title}" already has complete metadata.`);
      return book;
    }
    
    // Create a basic BookAIEnrichment object if it doesn't exist
    if (!enrichedBook.enrichedData) {
      enrichedBook.enrichedData = {
        themes: [],
        enrichmentDate: new Date().toISOString(),
        enrichmentSource: 'perplexity_ai',
        version: '1.0'
      };
    }
    
    // Process each missing field, limiting to 3 at a time to avoid rate limits
    const fieldsToProcess = missingFields.slice(0, 3);
    
    for (const field of fieldsToProcess) {
      try {
        console.log(`Enriching field "${field}" for book "${book.title}"...`);
        
        // Generate a prompt specific to this field
        const prompt = this.generatePrompt(book, field);
        
        // Query Perplexity API
        const response = await this.queryPerplexity(prompt);
        
        // Parse the response JSON
        const data = this.parseJsonFromResponse(response);
        
        if (!data) {
          console.error(`Failed to parse response for field "${field}"`);
          continue;
        }
        
        // Update the book with the enriched data
        switch (field) {
          case 'themes':
            enrichedBook.themes = data as Theme[];
            if (enrichedBook.enrichedData) {
              enrichedBook.enrichedData.themes = data.map((theme: Theme) => theme.name);
            }
            break;
            
          case 'characters':
            enrichedBook.characters = data as Character[];
            break;
            
          case 'locations':
            enrichedBook.locations = data as Location[];
            break;
            
          case 'narrativeStructure':
            enrichedBook.narrativeStructure = data;
            if (enrichedBook.enrichedData) {
              enrichedBook.enrichedData.narrativeStyle = data.pov;
              enrichedBook.enrichedData.mood = data.format || 'Unknown';
            }
            break;
            
          case 'genres':
            if (data.genres) enrichedBook.genres = data.genres;
            if (data.subgenres) enrichedBook.subgenres = data.subgenres;
            if (data.fiction !== undefined) enrichedBook.fiction = data.fiction;
            if (data.audience) enrichedBook.audience = data.audience;
            break;
            
          case 'complexity':
            enrichedBook.complexity = data;
            if (enrichedBook.enrichedData && data.conceptual) {
              enrichedBook.enrichedData.complexity = data.conceptual.toString();
            }
            break;
            
          case 'culturalContext':
            enrichedBook.culturalContext = data;
            if (enrichedBook.enrichedData) {
              enrichedBook.enrichedData.culturalSignificance = data.representation?.join(', ') || 'Unknown';
            }
            break;
        }
        
        // Ensure we don't hit rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error enriching field "${field}":`, error);
      }
    }
    
    // Update the enrichment data
    if (enrichedBook.enrichedData) {
      enrichedBook.enrichedData.enrichmentDate = new Date().toISOString();
      enrichedBook.enrichedData.enrichmentSource = 'perplexity_ai';
      
      // Add an AI analysis summarizing the book
      const genreText = enrichedBook.genres?.join(', ') || 'unknown genres';
      const themeText = enrichedBook.themes?.map(t => t.name).join(', ') || 'various themes';
      enrichedBook.enrichedData.aiAnalysis = `This book is categorized as ${genreText} and explores themes of ${themeText}.`;
    }
    
    // Update the last modified timestamp
    enrichedBook.lastModified = new Date().toISOString();
    
    return enrichedBook;
  }
  
  /**
   * Generate a detailed book analysis using Perplexity API
   * @param book The book to analyze
   * @returns Promise with a BookAIEnrichment object
   */
  async generateBookAnalysis(book: Book): Promise<BookAIEnrichment> {
    try {
      // Generate a comprehensive analysis prompt
      const prompt = `
        Please provide a comprehensive analysis of the book:
        
        Title: ${book.title}
        ${book.subtitle ? `Subtitle: ${book.subtitle}` : ''}
        Author(s): ${book.authors.map(a => a.name).join(', ')}
        ${book.genres && book.genres.length > 0 ? `Genres: ${book.genres.join(', ')}` : ''}
        ${book.description ? `Description: ${book.description}` : ''}
        
        Do thorough web research to create a detailed analysis of this book, including:
        1. Major themes and their significance
        2. Target audience and why it appeals to them
        3. Cultural significance or impact
        4. Writing style and narrative approach
        5. Similar books that readers might enjoy
        
        Return the analysis in the following JSON format:
        
        {
          "themes": ["Theme1", "Theme2", "Theme3"],
          "mood": "e.g., Contemplative, Thrilling, etc.",
          "narrativeStyle": "e.g., First-person, Third-person limited, etc.",
          "pacing": "Slow, Medium, or Fast",
          "targetAudience": "Who this book is best suited for",
          "complexity": "Simple, Medium, or Complex",
          "similarBooks": ["Similar Book 1", "Similar Book 2"],
          "culturalSignificance": "Brief explanation of impact or importance",
          "aiAnalysis": "A paragraph summarizing key insights about this book"
        }
      `;
      
      // Query Perplexity API
      const response = await this.queryPerplexity(prompt);
      
      // Parse the response JSON
      const data = this.parseJsonFromResponse(response);
      
      if (!data) {
        throw new Error('Failed to parse analysis response from Perplexity API');
      }
      
      // Construct the BookAIEnrichment object
      const enrichment: BookAIEnrichment = {
        themes: data.themes || [],
        mood: data.mood || 'Unknown',
        narrativeStyle: data.narrativeStyle || 'Unknown',
        pacing: data.pacing || 'Medium',
        targetAudience: data.targetAudience || 'General',
        complexity: data.complexity || 'Medium',
        similarBooks: data.similarBooks || [],
        culturalSignificance: data.culturalSignificance || 'Unknown',
        aiAnalysis: data.aiAnalysis || `This book is a ${data.complexity || 'medium'} complexity work in the ${book.genres?.join(', ') || 'unknown'} genre.`,
        enrichmentDate: new Date().toISOString(),
        enrichmentSource: 'perplexity_ai',
        version: '1.0'
      };
      
      return enrichment;
    } catch (error) {
      console.error('Error generating book analysis:', error);
      
      // Return a minimal enrichment object to avoid null errors
      return {
        themes: [],
        enrichmentDate: new Date().toISOString(),
        enrichmentSource: 'error',
        version: '1.0'
      };
    }
  }
}

// Create and export a singleton instance
export const aiEnrichmentService = new AIEnrichmentService(); 