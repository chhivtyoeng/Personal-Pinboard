import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import PinForm from '../../components/pins/PinForm';
import ErrorAlert from '../../components/common/ErrorAlert';
import { pinService } from '../../services/pinService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../context/ToastContext';

export default function CreatePin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const createdPin = await pinService.createPin(formData);
      toast.success('Pin created successfully!');
      navigate(`/pins/${createdPin.id || ''}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/pins')}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-slate-700 transition-all cursor-pointer"
      >
        <IconArrowLeft size={15} />
        Back to My Pins
      </button>

      <PageHeader
        title="Create New Pin"
        description="Share inspiring photography, design assets, architectural works, or moodboard ideas."
      />

      <ErrorAlert
        title="Pin Creation Error"
        message={error}
        onClose={() => setError('')}
      />

      <PinForm onSubmit={handleCreate} loading={loading} />
    </div>
  );
}
