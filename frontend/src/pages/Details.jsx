import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchExperienceDetails();
  }, [id]);

  const fetchExperienceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/experiences/${id}`);
      setExperience(response.data);
      
      // Group slots by date
      const slotsByDate = {};
      response.data.slots.forEach(slot => {
        const dateKey = new Date(slot.date).toISOString().split('T')[0];
        if (!slotsByDate[dateKey]) {
          slotsByDate[dateKey] = [];
        }
        slotsByDate[dateKey].push(slot);
      });
      
      // Auto-select first available date
      const firstDate = Object.keys(slotsByDate)[0];
      if (firstDate) {
        setSelectedDate(firstDate);
      }
    } catch (error) {
      console.error('Error fetching experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${day}`;
  };

  const getAvailableDates = () => {
    if (!experience || !experience.slots) return [];
    
    const dates = {};
    experience.slots.forEach(slot => {
      const dateKey = new Date(slot.date).toISOString().split('T')[0];
      if (!dates[dateKey]) {
        dates[dateKey] = new Date(slot.date);
      }
    });
    
    return Object.entries(dates).map(([key, value]) => ({
      key,
      date: value
    }));
  };

  const getTimeSlotsForDate = () => {
    if (!experience || !selectedDate) return [];
    
    return experience.slots.filter(slot => {
      const slotDate = new Date(slot.date).toISOString().split('T')[0];
      return slotDate === selectedDate;
    });
  };

  const handleConfirm = () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    const bookingData = {
      experienceId: id,
      experienceTitle: experience.title,
      slotId: selectedSlot._id,
      date: selectedDate,
      time: selectedSlot.time,
      quantity,
      price: experience.price,
      subtotal: experience.price * quantity,
      taxes: Math.round((experience.price * quantity) * 0.10)
    };

    navigate('/checkout', { state: bookingData });
  };

  const subtotal = experience ? experience.price * quantity : 0;
  const taxes = Math.round(subtotal * 0.10);
  const total = subtotal + taxes;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header showBackButton />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-white">
        <Header showBackButton />
        <div className="text-center py-12">
          <p className="text-gray-500">Experience not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showBackButton />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Experience Details */}
          <div className="lg:col-span-2">
            <img
              src={experience.imageUrl}
              alt={experience.title}
              className="w-full h-80 object-cover rounded-lg mb-6"
            />

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {experience.title}
            </h1>

            <p className="text-gray-600 mb-6">{experience.description}</p>

            {/* Choose Date */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Choose date</h3>
              <div className="flex flex-wrap gap-2">
                {getAvailableDates().map(({ key, date }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedDate(key);
                      setSelectedSlot(null);
                    }}
                    className={`px-4 py-2 rounded border transition-colors ${
                      selectedDate === key
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Time */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Choose time</h3>
              <div className="flex flex-wrap gap-2">
                {getTimeSlotsForDate().map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={slot.availableSpots === 0}
                    className={`px-4 py-2 rounded border transition-colors ${
                      slot.availableSpots === 0
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : selectedSlot?._id === slot._id
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                All times are in IST (GMT +5:30)
              </p>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold text-lg mb-3">About</h3>
              <p className="text-gray-600">{experience.about}</p>
            </div>
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Starts at</span>
                  <span className="font-semibold">₹{experience.price}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-semibold">₹{taxes}</span>
                </div>
              </div>

              <div className="border-t pt-3 mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Details;