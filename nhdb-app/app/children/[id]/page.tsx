'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import VaccinationHistory from '@/components/VaccinationHistory';
import RecordVaccinationForm from '@/components/RecordVaccinationForm';

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
  villageId: string;
  villageName: string;
  parentId: string;
  parentName: string;
  govtId?: string;
}

interface VaccinationStatus {
  vaccinesGiven: string[];
  nextVaccineDue: string | null;
  dueStatus: 'overdue' | 'due' | 'upcoming' | 'complete';
  dueWindow?: { start: string; end: string };
}

interface VaccinationVisit {
  _id: string;
  visitDate: string;
  vaccineGiven: string;
  notes?: string;
  createdAt: string;
}

export default function ChildDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [child, setChild] = useState<Child | null>(null);
  const [vaccinationStatus, setVaccinationStatus] =
    useState<VaccinationStatus | null>(null);
  const [vaccinationHistory, setVaccinationHistory] = useState<
    VaccinationVisit[]
  >([]);
  const [showRecordForm, setShowRecordForm] = useState(false);

  useEffect(() => {
    fetchChildDetails();
  }, [id]);

  const fetchChildDetails = async () => {
    try {
      const response = await fetch(`/api/children/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch child details');
        return;
      }

      setChild(data.child);
      setVaccinationStatus(data.vaccinationStatus);
      setVaccinationHistory(data.vaccinationHistory || []);
    } catch {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleVaccinationRecorded = () => {
    setShowRecordForm(false);
    fetchChildDetails();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'complete':
        return 'badge-complete';
      case 'due':
        return 'badge-due';
      case 'overdue':
        return 'badge-overdue';
      case 'upcoming':
        return 'badge-upcoming';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string, nextVaccine: string | null) => {
    switch (status) {
      case 'complete':
        return 'All Vaccinations Complete';
      case 'due':
        return `Vaccine ${nextVaccine} is Due`;
      case 'overdue':
        return `Vaccine ${nextVaccine} is Overdue`;
      case 'upcoming':
        return `Vaccine ${nextVaccine} Upcoming`;
      default:
        return status;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - dob.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays} days old`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} old`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} old`;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Back to Home
          </Link>
        </div>
        <div className="card text-center py-8">
          <p className="text-red-600">{error || 'Child not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href={`/parents/${child.parentId}`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Back to Parent
        </Link>
      </div>

      {/* Child Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{child.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {calculateAge(child.dateOfBirth)}
            </p>
          </div>
          {vaccinationStatus && (
            <span
              className={`badge ${getStatusBadgeClass(
                vaccinationStatus.dueStatus
              )}`}
            >
              {getStatusLabel(
                vaccinationStatus.dueStatus,
                vaccinationStatus.nextVaccineDue
              )}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
            <p className="font-medium">{formatDate(child.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Village</p>
            <p className="font-medium">{child.villageName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Parent</p>
            <p className="font-medium">{child.parentName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Birth Cert. ID</p>
            <p className="font-medium">{child.govtId || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Vaccination Status Card */}
      {vaccinationStatus && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Vaccination Status</h2>

          <div className="flex flex-wrap gap-3 mb-4">
            {['A', 'B', 'C'].map((vaccine) => {
              const isGiven = vaccinationStatus.vaccinesGiven.includes(vaccine);
              const isDue = vaccinationStatus.nextVaccineDue === vaccine;
              return (
                <div
                  key={vaccine}
                  className={`px-4 py-3 rounded-lg border-2 ${
                    isGiven
                      ? 'border-green-500 bg-green-50'
                      : isDue
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold">Vaccine {vaccine}</p>
                    <p
                      className={`text-sm ${
                        isGiven
                          ? 'text-green-600'
                          : isDue
                          ? 'text-yellow-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {isGiven ? 'Given' : isDue ? 'Due' : 'Pending'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {vaccinationStatus.dueWindow &&
            vaccinationStatus.dueStatus !== 'complete' && (
              <div className="text-sm text-gray-600 mb-4">
                <p>
                  <strong>Due Window:</strong>{' '}
                  {formatDate(vaccinationStatus.dueWindow.start)} -{' '}
                  {formatDate(vaccinationStatus.dueWindow.end)}
                </p>
              </div>
            )}

          {vaccinationStatus.dueStatus !== 'complete' && (
            <button
              onClick={() => setShowRecordForm(true)}
              className="btn btn-success"
            >
              Record Vaccination Visit
            </button>
          )}
        </div>
      )}

      {/* Record Vaccination Form Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Record Vaccination Visit</h3>
              <button
                onClick={() => setShowRecordForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <RecordVaccinationForm
              childId={child._id}
              suggestedVaccine={vaccinationStatus?.nextVaccineDue || undefined}
              onSuccess={handleVaccinationRecorded}
              onCancel={() => setShowRecordForm(false)}
            />
          </div>
        </div>
      )}

      {/* Vaccination History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Vaccination History</h2>
        {vaccinationHistory.length > 0 ? (
          <VaccinationHistory history={vaccinationHistory} />
        ) : (
          <p className="text-gray-500 text-center py-4">
            No vaccination records yet
          </p>
        )}
      </div>
    </div>
  );
}
