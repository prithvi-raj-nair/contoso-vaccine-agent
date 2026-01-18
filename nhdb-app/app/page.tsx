'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChildList from '@/components/ChildList';

interface Parent {
  _id: string;
  govtId: string;
  name: string;
  dateOfBirth: string;
  villageId: string;
  villageName: string;
  phoneNumber?: string;
}

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
  villageId: string;
  vaccinationStatus: {
    vaccinesGiven: string[];
    nextVaccineDue: string | null;
    dueStatus: 'overdue' | 'due' | 'upcoming' | 'complete';
  };
}

export default function Home() {
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setSearching(true);
    setError('');
    setParent(null);
    setChildren([]);

    try {
      const response = await fetch(`/api/parents?govtId=${encodeURIComponent(searchId.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to find parent');
        return;
      }

      setParent(data.parent);
      setChildren(data.children || []);
    } catch {
      setError('An error occurred while searching');
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          National Health Database
        </h1>
        <p className="text-gray-600">
          Search for patient records and manage vaccination tracking
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4 mb-8">
        <Link href="/parents" className="btn btn-primary">
          Add New Parent
        </Link>
        <Link href="/children" className="btn btn-secondary">
          Add New Child
        </Link>
      </div>

      {/* Search Section */}
      <div className="card max-w-xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">Search by Parent ID</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Government ID (e.g., A1B2C3D4)"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={searching || !searchId.trim()}
            className="btn btn-primary whitespace-nowrap"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {parent && (
        <div className="space-y-6">
          {/* Parent Info Card */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{parent.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Government ID: {parent.govtId}</p>
              </div>
              <Link
                href={`/parents/${parent._id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
                <p className="font-medium">{formatDate(parent.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Village</p>
                <p className="font-medium">{parent.villageName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="font-medium">{parent.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Children</p>
                <p className="font-medium">{children.length}</p>
              </div>
            </div>
          </div>

          {/* Children List */}
          {children.length > 0 ? (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Children</h3>
              <ChildList children={children} />
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-500 mb-4">No children registered for this parent</p>
              <Link
                href={`/children?parentId=${parent._id}`}
                className="btn btn-primary"
              >
                Add Child
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
