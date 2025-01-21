const apiKey = '650ff50a48a7379fd245c173ad422ff8';

// Helper functions
const filterValidContent = (item: any) => {
  return (
    item &&
    item.poster_path &&
    (item.title || item.name) &&
    !item.adult
  );
};

const isAnime = (item: any) => {
  const animeKeywords = ['anime', 'animated series', 'japanese animation'];
  const title = (item.title || item.name || '').toLowerCase();
  return animeKeywords.some(keyword => title.includes(keyword));
};

const getContentScore = (item: any, isDirector: boolean = false) => {
  let score = 0;

  if (item.media_type === 'movie') {
    score += 1000;
  }

  const priorityGenres = ['28', '12', '18', '35'];
  if (item.genre_ids) {
    score += item.genre_ids.filter((id: string) => priorityGenres.includes(id)).length * 100;
  }

  if (item.genre_ids && item.genre_ids.includes('99')) {
    score -= 500;
  }

  if (item.popularity) {
    score += item.popularity;
  }
  if (item.vote_average) {
    score += item.vote_average * 10;
  }

  if (isDirector) {
    score += item.release_type === 'Theatrical' ? 200 : 0;
  }

  return score;
};

export const fetchMovies = async (page: number = 1) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}&watch_region=US&with_original_language=en|es|fr|de|it&with_release_type=2|3&vote_count.gte=100`
  );
  const data = await response.json();

  const filteredResults = data.results.filter((movie: any) => {
    if (movie.production_countries) {
      const validCountries = ['US', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'SE', 'DK', 'NO'];
      return movie.production_countries.some((country: any) => 
        validCountries.includes(country.iso_3166_1)
      );
    }
    return ['en', 'es', 'fr', 'de', 'it'].includes(movie.original_language);
  });

  return {
    results: filteredResults.map((movie: any) => ({
      ...movie,
      media_type: 'movie'
    })) || [],
    total_pages: data.total_pages || 1
  };
};

export const filterCategory = async (categoryId: string, page: number = 1) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${categoryId}&page=${page}&watch_region=US&with_original_language=en|es|fr|de|it&with_release_type=2|3&vote_count.gte=100`
  );
  const data = await response.json();

  const filteredResults = data.results.filter((movie: any) => {
    if (movie.production_countries) {
      const validCountries = ['US', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'SE', 'DK', 'NO'];
      return movie.production_countries.some((country: any) => 
        validCountries.includes(country.iso_3166_1)
      );
    }
    return ['en', 'es', 'fr', 'de', 'it'].includes(movie.original_language);
  });

  return {
    results: filteredResults.map((movie: any) => ({
      ...movie,
      media_type: 'movie'
    })) || [],
    total_pages: data.total_pages || 1
  };
};

export const fetchTVSeries = async (page: number = 1) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}&watch_region=US&with_original_language=en|es|fr|de|it&with_networks=213|1024|2739|49|2552|4330|3186|64|44|2|359|2668|318|16|80|174|453|13|40|56|65|2597|4`
  );
  const data = await response.json();
  
  const filteredResults = data.results
    .filter((show: any) => {
      // First check if the show has a poster image
      if (!show.poster_path) {
        return false;
      }

      // Then check country of origin
      const originCountries = show.origin_country || [];
      const validCountries = ['US', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'SE', 'DK', 'NO'];
      return originCountries.some(country => validCountries.includes(country));
    });

  return {
    results: filteredResults.map((show: any) => ({
      ...show,
      media_type: 'tv'
    })),
    total_pages: data.total_pages || 1
  };
};

export const fetchTVSeriesByCategory = async (categoryId: string, page: number = 1) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${categoryId}&page=${page}&watch_region=US&with_original_language=en|es|fr|de|it&with_networks=213|1024|2739|49|2552|4330|3186|64|44|2|359|2668|318|16|80|174|453|13|40|56|65|2597|4`
  );
  const data = await response.json();

  const filteredResults = data.results
    .filter((show: any) => {
      // First check if the show has a poster image
      if (!show.poster_path) {
        return false;
      }

      // Then check country of origin
      const originCountries = show.origin_country || [];
      const validCountries = ['US', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'SE', 'DK', 'NO'];
      return originCountries.some(country => validCountries.includes(country));
    });

  return {
    results: filteredResults.map((show: any) => ({
      ...show,
      media_type: 'tv'
    })),
    total_pages: data.total_pages || 1
  };
};

export const handleSearch = async (query: string) => {
  if (!query.trim()) return [];
  
  try {
    const [movieResponse, tvResponse, peopleResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`),
      fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`),
      fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`)
    ]);

    const [movieData, tvData, peopleData] = await Promise.all([
      movieResponse.json(),
      tvResponse.json(),
      peopleResponse.json()
    ]);

    let results = [];

    // Process movie results
    if (movieData?.results) {
      results.push(...movieData.results
        .filter(item => item.poster_path)
        .map(item => ({
          ...item,
          media_type: 'movie'
        }))
      );
    }

    // Process TV results
    if (tvData?.results) {
      results.push(...tvData.results
        .filter(item => item.poster_path)
        .map(item => ({
          ...item,
          media_type: 'tv'
        }))
      );
    }

    // Process people results
    if (peopleData?.results) {
      const peopleResults = peopleData.results
        .filter(person => person.profile_path)
        .map(person => ({
          ...person,
          id: person.id.toString(),
          media_type: 'person',
          title: person.name,
          name: person.name,
          profile_path: person.profile_path,
          poster_path: person.profile_path,
          known_for_department: person.known_for_department
        }));
      results.push(...peopleResults);
    }

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

export const fetchPersonMovies = async (personId: number, page: number = 1) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${apiKey}`
  );
  const data = await response.json();
  
  const uniqueItems = new Map();
  
  [...data.cast, ...data.crew].forEach(item => {
    if (!uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, {
        ...item,
        media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
      });
    }
  });

  const allResults = Array.from(uniqueItems.values())
    .filter(filterValidContent)
    .filter((item: any) => !isAnime(item))
    .map((item: any) => ({
      ...item,
      contentScore: getContentScore(item)
    }))
    .sort((a: any, b: any) => b.contentScore - a.contentScore);

  const itemsPerPage = 20;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = allResults.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(allResults.length / itemsPerPage));

  return {
    results: paginatedResults,
    total_pages: totalPages
  };
};

export const fetchDirectorMovies = async (directorId: number, page: number = 1) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/person/${directorId}/combined_credits?api_key=${apiKey}`
  );
  const data = await response.json();
  
  const uniqueItems = new Map();
  
  data.crew
    .filter((item: any) => item.job === 'Director' && item.media_type === 'movie')
    .forEach(item => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, {
          ...item,
          media_type: 'movie',
          job: 'Director'
        });
      }
    });

  const detailedResults = await Promise.all(
    Array.from(uniqueItems.values()).map(async (item: any) => {
      try {
        const detailsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${item.id}?api_key=${apiKey}`
        );
        const details = await detailsResponse.json();
        return {
          ...item,
          ...details,
          genre_ids: details.genres?.map((g: any) => g.id) || []
        };
      } catch (error) {
        console.error('Error fetching details:', error);
        return item;
      }
    })
  );

  const allResults = detailedResults
    .filter(filterValidContent)
    .filter((item: any) => !isAnime(item))
    .map((item: any) => ({
      ...item,
      contentScore: getContentScore(item, true)
    }))
    .sort((a: any, b: any) => b.contentScore - a.contentScore);

  const itemsPerPage = 20;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = allResults.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(allResults.length / itemsPerPage));

  return {
    results: paginatedResults,
    total_pages: totalPages
  };
};

export const advancedSearch = async (
  filters: {
    year?: string;
    genre?: string;
    people?: any[];
    rating?: number;
  },
  contentType: 'movie' | 'tv' = 'movie',
  page: number = 1
) => {
  try {
    let results: any[] = [];
    let totalPages = 1;
    const itemsPerPage = 20;
    
    // Parse year filter
    let yearStart: string | undefined;
    let yearEnd: string | undefined;
    
    if (filters.year) {
      if (filters.year.includes('-')) {
        [yearStart, yearEnd] = filters.year.split('-').map(y => y.trim());
      } else {
        yearStart = yearEnd = filters.year.trim();
      }
    }
    
    // If people are selected, we need to fetch credits for each person
    if (filters.people && filters.people.length > 0) {
      // Get credits for each person
      const creditsPromises = filters.people.map(person =>
        fetch(`https://api.themoviedb.org/3/person/${person.id}/combined_credits?api_key=${apiKey}`)
          .then(res => res.json())
      );

      const creditsData = await Promise.all(creditsPromises);

      // Get all valid IDs for each person (including both cast and crew)
      const personMovieIds = creditsData.map((data, index) => {
        const validIds = new Set<string>();
        const person = filters.people[index];

        // Include both cast and crew credits
        data.cast?.forEach(credit => {
          if (credit.id && !credit.character?.toLowerCase().includes('uncredited')) {
            const mediaType = credit.media_type || (credit.first_air_date ? 'tv' : 'movie');
            if (mediaType === contentType) {
              validIds.add(credit.id.toString());
            }
          }
        });

        // Include crew credits (especially important for directors)
        data.crew?.forEach(credit => {
          if (credit.id) {
            const mediaType = credit.media_type || (credit.first_air_date ? 'tv' : 'movie');
            if (mediaType === contentType) {
              validIds.add(credit.id.toString());
            }
          }
        });

        return validIds;
      });

      // Find intersection of all person's movie IDs
      const commonIds = [...personMovieIds[0]].filter(id =>
        personMovieIds.every(ids => ids.has(id))
      );

      // Fetch full details for each common ID
      const detailsPromises = commonIds.map(async id => {
        try {
          const endpoint = contentType === 'movie' 
            ? `movie/${id}` 
            : `tv/${id}`;
          
          const response = await fetch(
            `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&append_to_response=credits`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // Verify that all selected people are involved in this title
            const allPeopleInvolved = filters.people.every(person => {
              const personId = person.id.toString();
              const inCast = data.credits?.cast?.some(c => c.id.toString() === personId);
              const inCrew = data.credits?.crew?.some(c => c.id.toString() === personId);
              return inCast || inCrew;
            });

            if (allPeopleInvolved) {
              return {
                ...data,
                media_type: contentType
              };
            }
          }
          return null;
        } catch (error) {
          console.error(`Error fetching details for ID ${id}:`, error);
          return null;
        }
      });

      const details = (await Promise.all(detailsPromises))
        .filter(item => 
          item && 
          item.poster_path && 
          // Exclude documentaries unless specifically selected
          (filters.genre === '99' || !item.genres?.some(g => g.id === 99)) &&
          (!filters.year || (() => {
            const date = item.release_date || item.first_air_date;
            if (!date) return false;
            const year = parseInt(date.split('-')[0]);
            return yearStart && yearEnd 
              ? year >= parseInt(yearStart) && year <= parseInt(yearEnd)
              : year === parseInt(yearStart);
          })()) &&
          (!filters.genre || item.genres?.some(g => g.id.toString() === filters.genre)) &&
          (!filters.rating || item.vote_average >= filters.rating) &&
          item.poster_path
        )
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      results = details;
      totalPages = Math.ceil(results.length / itemsPerPage);
      
      // Handle pagination
      const start = (page - 1) * 20;
      const end = start + 20;
      results = results.slice(start, end);
    } else {
      // If no people selected, use the regular discover API
      const endpoints = [];
      const minVoteCount = 100;

      if (contentType === 'movie') {
        let movieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&include_adult=false&sort_by=popularity.desc&vote_count.gte=${minVoteCount}&with_original_language=en|es|fr|de|it&page=${page}`;
        
        // Exclude documentaries unless specifically selected
        if (filters.genre !== '99') {
          movieUrl += '&without_genres=99';
        }

        if (filters.year) {
          if (yearStart && yearEnd && yearStart !== yearEnd) {
            movieUrl += `&primary_release_date.gte=${yearStart}-01-01&primary_release_date.lte=${yearEnd}-12-31`;
          } else {
            movieUrl += `&primary_release_year=${yearStart}`;
          }
        }
        if (filters.genre) {
          movieUrl += `&with_genres=${filters.genre}`;
        }
        if (filters.rating) {
          movieUrl += `&vote_average.gte=${filters.rating}`;
        }
        
        endpoints.push(fetch(movieUrl));
      }
      
      if (contentType === 'tv') {
        let tvUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&include_adult=false&sort_by=popularity.desc&vote_count.gte=${minVoteCount}&with_original_language=en|es|fr|de|it&page=${page}`;
        
        // Exclude documentaries unless specifically selected
        if (filters.genre !== '99') {
          tvUrl += '&without_genres=99';
        }

        if (filters.year) {
          if (yearStart && yearEnd && yearStart !== yearEnd) {
            tvUrl += `&first_air_date.gte=${yearStart}-01-01&first_air_date.lte=${yearEnd}-12-31`;
          } else {
            tvUrl += `&first_air_date_year=${yearStart}`;
          }
        }
        if (filters.genre) {
          tvUrl += `&with_genres=${filters.genre}`;
        }
        if (filters.rating) {
          tvUrl += `&vote_average.gte=${filters.rating}`;
        }
        
        endpoints.push(fetch(tvUrl));
      }

      const responses = await Promise.all(endpoints);
      const data = await Promise.all(responses.map(r => r.json()));

      if (contentType === 'movie') {
        const movieData = data[0];
        if (movieData?.results) {
          totalPages = Math.max(totalPages, movieData.total_pages || 1);
          results.push(...movieData.results.map((item: any) => ({
            ...item,
            media_type: 'movie'
          })));
        }
      }

      if (contentType === 'tv') {
        const tvData = data[0];
        if (tvData?.results) {
          totalPages = Math.max(totalPages, tvData.total_pages || 1);
          results.push(...tvData.results.map((item: any) => ({
            ...item,
            media_type: 'tv'
          })));
        }
      }
    }

    // Filter out items without posters
    results = results.filter(item => item.poster_path);

    // Sort by rating if specified, otherwise by popularity
    if (filters.rating) {
      results.sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0));
    } else {
      results.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
    }

    return {
      results: results || [],
      total_pages: totalPages
    };
  } catch (error) {
    console.error('Advanced search error:', error);
    return {
      results: [],
      total_pages: 1
    };
  }
};