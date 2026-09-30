import React from 'react';
import { useLeads } from '../../context/LeadsContext';
import { motion } from 'framer-motion';

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
      <motion.div 
        className="sec-hd"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <h2>Saved Lead Notes</h2>
        <p>Your meeting notes, research findings, and follow-up checklists, stored locally on your device.</p>
      </motion.div>

      {safeNotes.length > 0 ? (
        <motion.div 
          className="notes-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
            hidden: {}
          }}
        >
          {safeNotes.map((note) => (
            <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} key={note.id || Math.random()} className="note-card">
              <div className="note-card-top">
                <div>
                  <h3 className="note-card-title">{note.leadName || 'Lead Note'}</h3>
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
            </motion.div>
          ))}
        </motion.div>
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
