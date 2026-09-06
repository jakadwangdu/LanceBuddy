import React from 'react';
import { useLeads } from '../../context/LeadsContext';

export const NotesSection = () => {
  const { notesList = [], deleteNote } = useLeads() || {};
  const safeNotes = Array.isArray(notesList) ? notesList.filter(Boolean) : [];

  const formatSavedDate = (savedAt) => {
    if (!savedAt) return 'Recently';
    try {
      const d = new Date(savedAt);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <section className="notes-section" id="notes">
      <div className="sec-hd">
        <h2>Saved Lead Notes</h2>
        <p>Your meeting notes, research findings, and follow-up checklists, stored locally on your device.</p>
      </div>

      {safeNotes.length > 0 ? (
        <div className="notes-grid">
          {safeNotes.map((note) => (
            <div key={note.id || Math.random()} className="note-card">
              <div className="note-card-top">
                <div>
                  <h4 className="note-card-title">{note.leadName || 'Lead Note'}</h4>
                  <div className="note-card-meta">
                    {note.biz && (
                      <span>
                        <i className="ri-building-line"></i> {note.biz}
                      </span>
                    )}
                    {note.location && (
                      <span>
                        <i className="ri-map-pin-line"></i> {note.location}
                      </span>
                    )}
                    <span>
                      <i className="ri-time-line"></i> {formatSavedDate(note.savedAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="note-card-delete"
                  onClick={() => deleteNote(note.id)}
                  title="Delete note"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>

              <p className="note-card-content">{note.notes}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="notes-empty">
          <i className="ri-file-text-line"></i>
          <p>No notes saved yet</p>
          <span>When you add notes to any scouted lead, they will automatically appear here.</span>
        </div>
      )}
    </section>
  );
};
