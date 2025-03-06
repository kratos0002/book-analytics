import { Book, Theme, Character, Location } from '../models/BookTypes';

/**
 * AIEnrichmentService
 * 
 * A service that uses AI (Perplexity API) to enhance book metadata
 * by filling in missing details and enriching existing information.
 */
export class AIEnrichmentService {
  private API_KEY: string | null = null;
  private API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
  
  /**
   * Set the API key for Perplexity
   * @param apiKey Perplexity API key
   */
  setAPIKey(apiKey: string): void {
    this.API_KEY = apiKey;
    localStorage.setItem('perplexity_api_key', apiKey);
  }
  
  /**
   * Check if the API key is set
   * @returns True if API key is available
   */
  hasAPIKey(): boolean {
    if (!this.API_KEY) {
      const storedKey = localStorage.getItem('perplexity_api_key');
      if (storedKey) {
        this.API_KEY = storedKey;
        return true;
      }
      return false;
    }
    return true;
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
      ${book.genres.length > 0 ? `Genres: ${book.genres.join(', ')}` : ''}
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
   * Try to parse JSON from the AI response, handling potential formatting issues
   * @param response The raw response from the AI
   * @returns Parsed JSON data
   */
  private safeParseJSON(response: string): any {
    try {
      // Try direct parsing first
      return JSON.parse(response);
    } catch (e) {
      // If that fails, try to extract JSON from the response
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) ||
                         response.match(/{[\s\S]*?}/);
                         
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1]);
        } else if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // As a last resort, try to find anything that looks like JSON
        const possibleJson = response.match(/(\[[\s\S]*?\]|{[\s\S]*?})/);
        if (possibleJson) {
          return JSON.parse(possibleJson[0]);
        }
        
        throw new Error('Could not extract valid JSON from response');
      } catch (innerError) {
        console.error('Error parsing AI response as JSON:', innerError);
        throw new Error('Failed to parse AI response as JSON: ' + response);
      }
    }
  }
  
  /**
   * Use Perplexity to generate book themes
   * @param book The book to analyze
   * @returns Promise with generated themes
   */
  async generateThemes(book: Book): Promise<Theme[]> {
    try {
      const prompt = this.generatePrompt(book, 'themes');
      const response = await this.queryPerplexity(prompt);
      const themes = this.safeParseJSON(response);
      
      return themes;
    } catch (error) {
      console.error('Error generating themes:', error);
      throw error;
    }
  }
  
  /**
   * Use Perplexity to generate book characters
   * @param book The book to analyze
   * @returns Promise with generated characters
   */
  async generateCharacters(book: Book): Promise<Character[]> {
    try {
      const prompt = this.generatePrompt(book, 'characters');
      const response = await this.queryPerplexity(prompt);
      const characters = this.safeParseJSON(response);
      
      return characters;
    } catch (error) {
      console.error('Error generating characters:', error);
      throw error;
    }
  }
  
  /**
   * Use Perplexity to generate book locations
   * @param book The book to analyze
   * @returns Promise with generated locations
   */
  async generateLocations(book: Book): Promise<Location[]> {
    try {
      const prompt = this.generatePrompt(book, 'locations');
      const response = await this.queryPerplexity(prompt);
      const locations = this.safeParseJSON(response);
      
      return locations;
    } catch (error) {
      console.error('Error generating locations:', error);
      throw error;
    }
  }
  
  /**
   * Use Perplexity to generate narrative structure information
   * @param book The book to analyze
   * @returns Promise with narrative structure data
   */
  async generateNarrativeStructure(book: Book): Promise<Book['narrativeStructure']> {
    try {
      const prompt = this.generatePrompt(book, 'narrativeStructure');
      const response = await this.queryPerplexity(prompt);
      const structure = this.safeParseJSON(response);
      
      return structure;
    } catch (error) {
      console.error('Error generating narrative structure:', error);
      throw error;
    }
  }
  
  /**
   * Use Perplexity to generate genre information
   * @param book The book to analyze
   * @returns Promise with genre data
   */
  async generateGenreInfo(book: Book): Promise<{ 
    genres: string[]; 
    subgenres: string[]; 
    fiction: boolean; 
    audience: Book['audience'];
  }> {
    try {
      const prompt = this.generatePrompt(book, 'genres');
      const response = await this.queryPerplexity(prompt);
      const genreInfo = this.safeParseJSON(response);
      
      return genreInfo;
    } catch (error) {
      console.error('Error generating genre information:', error);
      throw error;
    }
  }
  
  /**
   * Use Perplexity to generate complexity analysis
   * @param book The book to analyze
   * @returns Promise with complexity data
   */
  async generateComplexityAnalysis(book: Book): Promise<Book['complexity']> {
    try {
      const prompt = this.generatePrompt(book, 'complexity');
      const response = await this.queryPerplexity(prompt);
      const complexity = this.safeParseJSON(response);
      
      return complexity;
    } catch (error) {
      console.error('Error generating complexity analysis:', error);
      throw error;
    }
  }
  
  /**
   * Use Perplexity to generate cultural context information
   * @param book The book to analyze
   * @returns Promise with cultural context data
   */
  async generateCulturalContext(book: Book): Promise<Book['culturalContext']> {
    try {
      const prompt = this.generatePrompt(book, 'culturalContext');
      const response = await this.queryPerplexity(prompt);
      const context = this.safeParseJSON(response);
      
      return context;
    } catch (error) {
      console.error('Error generating cultural context:', error);
      throw error;
    }
  }
  
  /**
   * Generate all missing metadata for a book
   * @param book The book to enrich
   * @returns Promise with the enriched book
   */
  async enrichBookMetadata(book: Book): Promise<Book> {
    try {
      const enrichedBook = { ...book };
      const tasks = [];
      
      // Generate themes if empty
      if (!book.themes || book.themes.length === 0) {
        tasks.push(
          this.generateThemes(book)
            .then(themes => { enrichedBook.themes = themes; })
            .catch(error => { console.error('Error generating themes:', error); })
        );
      }
      
      // Generate characters if empty
      if (!book.characters || book.characters.length === 0) {
        tasks.push(
          this.generateCharacters(book)
            .then(characters => { enrichedBook.characters = characters; })
            .catch(error => { console.error('Error generating characters:', error); })
        );
      }
      
      // Generate locations if empty
      if (!book.locations || book.locations.length === 0) {
        tasks.push(
          this.generateLocations(book)
            .then(locations => { enrichedBook.locations = locations; })
            .catch(error => { console.error('Error generating locations:', error); })
        );
      }
      
      // Generate narrative structure if empty or default
      if (!book.narrativeStructure || Object.keys(book.narrativeStructure).length <= 1) {
        tasks.push(
          this.generateNarrativeStructure(book)
            .then(structure => { enrichedBook.narrativeStructure = structure; })
            .catch(error => { console.error('Error generating narrative structure:', error); })
        );
      }
      
      // Generate genres if empty
      if (!book.genres || book.genres.length === 0) {
        tasks.push(
          this.generateGenreInfo(book)
            .then(genreInfo => { 
              enrichedBook.genres = genreInfo.genres;
              enrichedBook.subgenres = genreInfo.subgenres;
              enrichedBook.fiction = genreInfo.fiction;
              enrichedBook.audience = genreInfo.audience;
            })
            .catch(error => { console.error('Error generating genre information:', error); })
        );
      }
      
      // Generate complexity if empty
      if (!book.complexity || Object.keys(book.complexity).length === 0) {
        tasks.push(
          this.generateComplexityAnalysis(book)
            .then(complexity => { enrichedBook.complexity = complexity; })
            .catch(error => { console.error('Error generating complexity analysis:', error); })
        );
      }
      
      // Generate cultural context if empty
      if (!book.culturalContext || Object.keys(book.culturalContext).length <= 1) {
        tasks.push(
          this.generateCulturalContext(book)
            .then(context => { enrichedBook.culturalContext = context; })
            .catch(error => { console.error('Error generating cultural context:', error); })
        );
      }
      
      // Wait for all metadata generation tasks to complete
      await Promise.all(tasks);
      
      // Update last modified timestamp
      enrichedBook.lastModified = new Date().toISOString();
      
      return enrichedBook;
    } catch (error) {
      console.error('Error enriching book metadata:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const aiEnrichmentService = new AIEnrichmentService(); 