import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import PinForm from '../../components/pins/PinForm';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import { pinService } from '../../services/pinService';
import { toast } from '../../context/ToastContext';

export default function EditPin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPin() {
      try {
        const data = await pinService.getPinById(id);
        if (!data) {
          setError('Pin not found or may have been deleted.');
        } else {
          setPin(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch pin');
      } finally {
        setLoading(false);
      }
    }
    loadPin();
  }, [id]);

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      await pinService.updatePin(id, formData);
      toast.success('Pin updated successfully!');
      navigate(`/pins/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update pin');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading pin details..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(`/pins/${id}`)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-slate-700 transition-all cursor-pointer"
      >
        <IconArrowLeft size={15} />
        Back to Pin Details
      </button>

      <PageHeader
        title="Edit Pin"
        description="Update pin details, assign to a different board, or update keywords."
      />

      <ErrorAlert
        title="Update Error"
        message={error}
        onClose={() => setError('')}
      />

      {pin && (
        <PinForm
          initialData={pin}
          onSubmit={handleUpdate}
          loading={submitting}
          isEdit={true}
        />
      )}
    </div>
  );
}
