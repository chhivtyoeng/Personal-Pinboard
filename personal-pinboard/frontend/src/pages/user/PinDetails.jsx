import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PinDetailsComponent from '../../components/pins/PinDetails';
import PinGrid from '../../components/pins/PinGrid';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import { pinService } from '../../services/pinService';

export default function PinDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState(null);
  const [relatedPins, setRelatedPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const pinData = await pinService.getPinById(id);
        if (!pinData) {
          setError('Pin not found or may have been deleted.');
          return;
        }
        setPin(pinData);

        // Load related pins in same category if category exists
        if (pinData.category_id) {
          try {
            const allPins = await pinService.getAllPins({
              categoryId: pinData.category_id,
            });
            const safePins = Array.isArray(allPins) ? allPins : (allPins?.pins || []);
            setRelatedPins(safePins.filter((p) => String(p.id) !== String(id)));
          } catch (catErr) {
            console.warn('Failed to fetch related pins:', catErr);
            setRelatedPins([]);
          }
        } else {
          setRelatedPins([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load pin');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDelete = () => {
    navigate('/pins');
  };

  if (loading) return <Loading message="Loading inspiration..." />;
  if (error) return <ErrorAlert title="Error" message={error} />;
  if (!pin) return null;

  return (
    <div className="space-y-12">
      <PinDetailsComponent pin={pin} onDelete={handleDelete} />

      {/* More like this section */}
      {relatedPins.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            More Visual Inspiration Like This
          </h2>
          <PinGrid pins={relatedPins} />
        </div>
      )}
    </div>
  );
}
