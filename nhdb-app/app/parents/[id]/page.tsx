'use client';

import { useState, useEffect, use } from 'react';
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
  createdAt: string;
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

export default function ParentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    fetchParentDetails();
  }, [id]);

  const fetchParentDetails = async () => {
    try {
      const response = await fetch(`/api/parents/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch parent details');
        return;
      }

      setParent(data.parent);

      // Fetch children with vaccination status
      const childrenResponse = await fetch(`/api/children?parentId=${id}`);
      const childrenData = await childrenResponse.json();
      setChildren(childrenData.children || []);
    } catch {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Back to Home
          </Link>
        </div>
        <div className="card text-center py-8">
          <p className="text-red-600">{error || 'Parent not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back to Home
        </Link>
      </div>

      {/* Parent Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{parent.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Government ID: {parent.govtId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
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
            <p className="text-xs text-gray-500 uppercase">Registered</p>
            <p className="font-medium">{formatDate(parent.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Children Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Children ({children.length})</h2>
          <Link
            href={`/children?parentId=${parent._id}&villageId=${parent.villageId}`}
            className="btn btn-primary text-sm"
          >
            Add Child
          </Link>
        </div>

        {children.length > 0 ? (
          <ChildList children={children} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No children registered for this parent
          </div>
        )}
      </div>
    </div>
  );
}
