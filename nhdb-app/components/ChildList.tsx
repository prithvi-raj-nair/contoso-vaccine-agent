'use client';

import Link from 'next/link';

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

interface ChildListProps {
  children: Child[];
}

export default function ChildList({ children }: ChildListProps) {
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
        return 'Complete';
      case 'due':
        return `${nextVaccine} Due`;
      case 'overdue':
        return `${nextVaccine} Overdue`;
      case 'upcoming':
        return `${nextVaccine} Upcoming`;
      default:
        return status;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date of Birth</th>
            <th>Vaccines Given</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {children.map((child) => (
            <tr key={child._id}>
              <td className="font-medium">{child.name}</td>
              <td>{formatDate(child.dateOfBirth)}</td>
              <td>
                {child.vaccinationStatus.vaccinesGiven.length > 0 ? (
                  <div className="flex gap-1">
                    {child.vaccinationStatus.vaccinesGiven.map((vaccine) => (
                      <span
                        key={vaccine}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                      >
                        {vaccine}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </td>
              <td>
                <span
                  className={`badge ${getStatusBadgeClass(
                    child.vaccinationStatus.dueStatus
                  )}`}
                >
                  {getStatusLabel(
                    child.vaccinationStatus.dueStatus,
                    child.vaccinationStatus.nextVaccineDue
                  )}
                </span>
              </td>
              <td>
                <Link
                  href={`/children/${child._id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
