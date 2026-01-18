'use client';

import { useState } from 'react';

interface RecordVaccinationFormProps {
  childId: string;
  suggestedVaccine?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RecordVaccinationForm({
  childId,
  suggestedVaccine,
  onSuccess,
  onCancel,
}: RecordVaccinationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    vaccineGiven: suggestedVaccine || '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to record vaccination');
        return;
      }

      onSuccess();
    } catch {
      setError('An error occurred while recording vaccination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Visit Date *
        </label>
        <input
          type="date"
          name="visitDate"
          value={formData.visitDate}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vaccine Given *
        </label>
        <select
          name="vaccineGiven"
          value={formData.vaccineGiven}
          onChange={handleChange}
          required
        >
          <option value="">Select vaccine</option>
          <option value="A">Vaccine A</option>
          <option value="B">Vaccine B</option>
          <option value="C">Vaccine C</option>
          <option value="none_required">No Vaccine Required</option>
          <option value="not_available">Vaccine Not Available</option>
        </select>
        {suggestedVaccine && (
          <p className="text-xs text-gray-500 mt-1">
            Suggested: Vaccine {suggestedVaccine}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Optional notes about this visit"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-success flex-1"
        >
          {loading ? 'Recording...' : 'Record Visit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
