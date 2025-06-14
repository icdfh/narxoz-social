// src/components/SubscriptionCard.jsx
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function SubscriptionCard({ sub }) {
  return (
    <div className="border rounded p-4 shadow-sm">
      <h4 className="font-medium">{sub.event.title}</h4>
      <p className="text-sm text-gray-600">
        Начало: {format(new Date(sub.event.start_at), 'dd.MM.yyyy HH:mm')}
      </p>
      <Link
        to={`/subscriptions/${sub.id}`}
        className="inline-block mt-2 text-red-600 hover:underline"
      >
        Подробнее →
      </Link>
    </div>
  );
}
