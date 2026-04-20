const MOCK_NEWS = {
  general: [
    { title: "Local Administration Prepares for Monsoon Season", source: "Daily Weather", time: "2 hours ago", desc: "City officials announce new drainage clearing initiatives.", url: "#" },
    { title: "New AI Disaster System Deployed", source: "Tech Monitor", time: "5 hours ago", desc: "Region gets upgraded multi-hazard monitoring.", url: "#" },
  ],
  flood: [
    { title: "URGENT: Flash Flood Warnings Issued", source: "National Weather Guard", time: "10 mins ago", desc: "Residents in low-lying areas advised to move to higher ground.", url: "#" },
    { title: "River Levels Surpass Danger Mark", source: "Emergency Broadcast", time: "30 mins ago", desc: "Severe waterlogging in major districts.", url: "#" },
  ],
  landslide: [
    { title: "ALERT: Steep Terrain Unstable After Heavy Rain", source: "Geological Survey", time: "45 mins ago", desc: "Soil moisture critical. Residents near hillsides should remain vigilant.", url: "#" },
    { title: "Highway Closed Due to Mudslides", source: "Traffic Authority", time: "15 mins ago", desc: "Avoid mountain passes.", url: "#" },
  ]
};

export async function fetchLocalNews(locationName, prediction) {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY;
  const isFloodRisk = prediction?.floodScore >= 40;
  const isLandslideRisk = prediction?.landslideScore >= 40;
  
  // Clean the location name (remove " Your Location (XXX)" wrapping)
  let cleanName = locationName || '';
  if (cleanName.includes('Your Location')) {
    cleanName = cleanName.replace(/.*Your Location\s*\(/i, '').replace(/\)/g, '');
  } else if (cleanName.startsWith('')) {
    cleanName = cleanName.replace(/\s*/, '');
  }
  
  // Take just the city name to keep the search broad enough
  const geoTerm = cleanName.split(',')[0].trim();

  // Decide search queries based on risk
  let query = 'weather';
  if (isFloodRisk && isLandslideRisk) query = 'flood OR landslide';
  else if (isFloodRisk) query = 'flood OR rain';
  else if (isLandslideRisk) query = 'landslide OR mudslide';
  
  const finalQuery = geoTerm ? `${geoTerm} ${query}` : query;

  // Fallback to mock data if no key or error occurs
  const fallback = () => {
    let selectedNews = [];
    if (isFloodRisk) selectedNews.push(...MOCK_NEWS.flood);
    if (isLandslideRisk) selectedNews.push(...MOCK_NEWS.landslide);
    if (!isFloodRisk && !isLandslideRisk) selectedNews.push(...MOCK_NEWS.general);
    return selectedNews.slice(0, 3);
  };

  if (!apiKey || apiKey === 'YOUR_GNEWS_KEY') {
    console.log("No GNews API Key found, using mock fallback.");
    return fallback();
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(finalQuery)}&lang=en&max=3&apikey=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn("GNews API failed (possibly rate limited), falling back manually.");
      return fallback();
    }
    
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      return data.articles.map(article => ({
        title: article.title,
        source: article.source.name,
        time: new Date(article.publishedAt).toLocaleDateString(),
        desc: article.description,
        url: article.url
      }));
    } else {
      // If 0 results for exact city, try falling back to just the general query
      const broadUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=3&apikey=${apiKey}`;
      const broadResponse = await fetch(broadUrl);
      if (broadResponse.ok) {
         const broadData = await broadResponse.json();
         if (broadData.articles && broadData.articles.length > 0) {
            return broadData.articles.map(article => ({
              title: article.title,
              source: article.source.name,
              time: new Date(article.publishedAt).toLocaleDateString(),
              desc: article.description,
              url: article.url
            }));
         }
      }
      return fallback();
    }
  } catch (error) {
    console.error("GNews API fetch error:", error);
    return fallback();
  }
}
