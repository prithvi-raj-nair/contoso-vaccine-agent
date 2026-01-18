'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Village {
  _id: string;
  villageId: string;
  name: string;
}

interface Parent {
  _id: string;
  name: string;
  govtId: string;
  villageId: string;
}

function AddChildForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [parentSearchId, setParentSearchId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    govtId: '',
  });

  useEffect(() => {
    fetchVillages();

    // Pre-fill parent if provided in URL
    const parentId = searchParams.get('parentId');
    const villageId = searchParams.get('villageId');
    if (parentId) {
      fetchParentById(parentId, villageId);
    }
  }, [searchParams]);

  const fetchVillages = async () => {
    try {
      const response = await fetch('/api/villages');
      const data = await response.json();
      setVillages(data.villages || []);
    } catch {
      console.error('Failed to fetch villages');
    }
  };

  const fetchParentById = async (parentId: string, villageId: string | null) => {
    try {
      const response = await fetch(`/api/parents/${parentId}`);
      const data = await response.json();
      if (response.ok && data.parent) {
        setSelectedParent({
          _id: data.parent._id,
          name: data.parent.name,
          govtId: data.parent.govtId,
          villageId: villageId || data.parent.villageId,
        });
      }
    } catch {
      console.error('Failed to fetch parent');
    }
  };

  const handleParentSearch = async () => {
    if (!parentSearchId.trim()) return;

    setSearching(true);
    setError('');

    try {
      const response = await fetch(
        `/api/parents?govtId=${encodeURIComponent(parentSearchId.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Parent not found');
        setSelectedParent(null);
        return;
      }

      setSelectedParent({
        _id: data.parent._id,
        name: data.parent.name,
        govtId: data.parent.govtId,
        villageId: data.parent.villageId,
      });
    } catch {
      setError('Failed to search for parent');
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParent) {
      setError('Please select a parent first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: selectedParent._id,
          villageId: selectedParent.villageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create child');
        return;
      }

      router.push(`/children/${data.child._id}`);
    } catch {
      setError('An error occurred while creating child');
    } finally {
      setLoading(false);
    }
  };

  const getVillageName = (villageId: string) => {
    const village = villages.find((v) => v.villageId === villageId);
    return village?.name || villageId;
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back to Home
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Add New Child</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Parent Selection */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent *
          </label>

          {selectedParent ? (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedParent.name}</p>
                  <p className="text-sm text-gray-500">
                    ID: {selectedParent.govtId} | Village:{' '}
                    {getVillageName(selectedParent.villageId)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedParent(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={parentSearchId}
                onChange={(e) => setParentSearchId(e.target.value)}
                placeholder="Enter parent's government ID"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleParentSearch}
                disabled={searching}
                className="btn btn-secondary whitespace-nowrap"
              >
                {searching ? 'Searching...' : 'Find Parent'}
              </button>
            </div>
          )}
        </div>

        {/* Child Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child&apos;s Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter child's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Certificate / ID Number
            </label>
            <input
              type="text"
              name="govtId"
              value={formData.govtId}
              onChange={handleChange}
              placeholder="Enter birth certificate number (optional)"
            />
          </div>

          {selectedParent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Village
              </label>
              <input
                type="text"
                value={getVillageName(selectedParent.villageId)}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically set from parent&apos;s village
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading || !selectedParent}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Child'}
            </button>
            <Link href="/" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddChildPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <AddChildForm />
    </Suspense>
  );
}
