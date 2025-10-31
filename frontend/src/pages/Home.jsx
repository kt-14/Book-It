import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Home() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/experiences`, {
        params: search ? { search } : {}
      });
      setExperiences(response.data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExperiences(searchQuery);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 h-48 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No experiences found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {experiences.map((exp) => (
              <div
                key={exp._id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/experience/${exp._id}`)}
              >
                <div className="relative">
                  <img
                    src={exp.imageUrl}
                    alt={exp.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {exp.location}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {exp.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500">From </span>
                      <span className="font-bold text-gray-900">₹{exp.price}</span>
                    </div>
                    <button className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;