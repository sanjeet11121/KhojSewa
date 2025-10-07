import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchRecommendations } from '../../utils/recommendationApi';

const Recommendations = () => {
  const { postId } = useParams();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getRecommendations() {
      setLoading(true);
      setError("");
      const result = await fetchRecommendations(postId);
      if (result.error) setError(result.error);
      else setRecommendations(result.recommendations || []);
      setLoading(false);
    }
    if (postId) getRecommendations();
  }, [postId]);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6 text-green-700">Recommendations</h2>
      {loading ? (
        <div className="text-purple-700">Loading recommendations...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : recommendations.length === 0 ? (
        <div className="text-gray-500">No recommendations found.</div>
      ) : (
        <ul className="space-y-4">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="p-4 bg-white rounded-xl shadow border">
              {/* Customize below based on ML backend response structure */}
              <div className="font-semibold text-purple-700">{rec.title || rec.itemName || 'Untitled'}</div>
              <div className="text-gray-700">{rec.description}</div>
              {rec.images && rec.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {rec.images.map((img, i) => (
                    <img key={i} src={img} alt="rec-img" className="h-12 w-12 object-cover rounded" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Recommendations;
