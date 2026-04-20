const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Fallback channels in case API fails or returns no results (Default to Indian News)
const FALLBACK_CHANNELS = [
  { id: 'Xvj1_nLqoxg', name: 'NDTV India Live (English)' },
  { id: 'vzTfCqE1_c4', name: 'India Today Live (English)' },
  { id: 'D-yMOf2lHGE', name: 'Aaj Tak Live (Hindi)' }
];

export async function fetchLiveNewsStreams(locationName) {
  if (!API_KEY || API_KEY.trim() === '') {
    console.warn("No Google API Key found. Using fallback channels.");
    return FALLBACK_CHANNELS;
  }

  // Parse location name safely
  let cleanName = locationName || 'Global';
  if (cleanName.includes('Your Location')) {
    cleanName = cleanName.replace(/.*Your Location\s*\(/i, '').replace(/\)/g, '');
  } else if (cleanName.startsWith('📍')) {
    cleanName = cleanName.replace(/📍\s*/, '');
  }
  
  const parts = cleanName.split(',').map(p => p.trim()).filter(Boolean);
  
  // Choose the best search context
  // Usually, parts = [City, State, Country]
  // Searching for "City live news" often fails. "State live news" is highly effective.
  let primaryTerm = parts.length > 1 ? parts[1] : parts[0];
  let secondaryTerm = parts[parts.length - 1]; // Country level

  // If primary and secondary are the same, no need for secondary.
  if (primaryTerm === secondaryTerm && parts.length > 2) {
      primaryTerm = parts[parts.length - 2];
  }

  const query = `${primaryTerm} live news channel`;

  try {
    // 1st Attempt: State / Region level
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=4&videoCategoryId=25`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("YouTube API error. Check quota or key validity.");
      return FALLBACK_CHANNELS;
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.map(item => ({
        id: item.id.videoId,
        name: item.snippet.channelTitle,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.default?.url
      }));
    } else {
      // 2nd Attempt: Country / Macro level
      const backupUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(secondaryTerm + " live news")}&key=${API_KEY}&maxResults=3`;
      const backupResponse = await fetch(backupUrl);
      if (backupResponse.ok) {
         const backupData = await backupResponse.json();
         if (backupData.items && backupData.items.length > 0) {
             return backupData.items.map(item => ({
                id: item.id.videoId,
                name: item.snippet.channelTitle,
                title: item.snippet.title
             }));
         }
      }
      return FALLBACK_CHANNELS;
    }
  } catch (err) {
    console.error("Error fetching live streams:", err);
    return FALLBACK_CHANNELS;
  }
}
