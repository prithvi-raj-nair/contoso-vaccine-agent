'use client';

interface VaccinationVisit {
  _id: string;
  visitDate: string;
  vaccineGiven: string;
  notes?: string;
  createdAt: string;
}

interface VaccinationHistoryProps {
  history: VaccinationVisit[];
}

export default function VaccinationHistory({
  history,
}: VaccinationHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVaccineLabel = (vaccine: string) => {
    switch (vaccine) {
      case 'A':
      case 'B':
      case 'C':
        return `Vaccine ${vaccine}`;
      case 'none_required':
        return 'No Vaccine Required';
      case 'not_available':
        return 'Vaccine Not Available';
      default:
        return vaccine;
    }
  };

  const getVaccineBadgeClass = (vaccine: string) => {
    switch (vaccine) {
      case 'A':
      case 'B':
      case 'C':
        return 'bg-green-100 text-green-800';
      case 'none_required':
        return 'bg-gray-100 text-gray-800';
      case 'not_available':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Visit Date</th>
            <th>Vaccine</th>
            <th>Notes</th>
            <th>Recorded</th>
          </tr>
        </thead>
        <tbody>
          {history.map((visit) => (
            <tr key={visit._id}>
              <td className="font-medium">{formatDate(visit.visitDate)}</td>
              <td>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVaccineBadgeClass(
                    visit.vaccineGiven
                  )}`}
                >
                  {getVaccineLabel(visit.vaccineGiven)}
                </span>
              </td>
              <td className="text-gray-600">{visit.notes || '-'}</td>
              <td className="text-gray-500 text-sm">
                {formatDate(visit.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
