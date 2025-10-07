// Utility to call Express backend for recommendations
export async function fetchRecommendations(postId) {
  try {
    // Call Express backend route for lost post recommendations
    const apiBase = '/api/recommend/lost/';
    const res = await fetch(`${apiBase}${postId}`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}
