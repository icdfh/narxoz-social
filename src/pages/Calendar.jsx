// src/pages/Calendar.jsx
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEvents } from '../services/eventService';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const user = useSelector(s => s.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents()
      .then(({ data }) => {
        const fc = data.map(ev => ({
          id: ev.id,
          title: ev.title,
          date: ev.start_at.slice(0, 10),
        }));
        setEvents(fc);
      })
      .catch(console.error);
  }, []);

  // права на создание
  const canCreate = ['admin','teacher','organization'].includes(user.role);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h2 style={{ color: '#D50032' }}>Календарь событий</h2>
        {canCreate && (
          <button
            style={{
              background: '#D50032',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/events/create')}
          >
            + Создать событие
          </button>
        )}
      </div>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        eventClick={({ event }) => {
          // при клике идём в деталку
          navigate(`/events/${event.id}`);
        }}
      />
    </div>
  );
}
