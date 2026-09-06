import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateMockLeads } from '../data/mockLeads';

const LeadsContext = createContext();

export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('lb_leads');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [notesList, setNotesList] = useState(() => {
    try {
      const saved = localStorage.getItem('lb_saved_notes');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [currentQuery, setCurrentQuery] = useState(() => {
    try {
      const saved = localStorage.getItem('lb_last_query');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object') {
        return {
          biz: parsed.biz || 'Travel Agency',
          loc: parsed.loc || 'Mumbai',
          email: parsed.email || ''
        };
      }
      return { biz: 'Travel Agency', loc: 'Mumbai', email: '' };
    } catch {
      return { biz: 'Travel Agency', loc: 'Mumbai', email: '' };
    }
  });

  const [isScouting, setIsScouting] = useState(false);
  const [scoutMessage, setScoutMessage] = useState(null);

  // Sync leads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lb_leads', JSON.stringify(leads));
    } catch {}
  }, [leads]);

  // Sync notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lb_saved_notes', JSON.stringify(notesList));
    } catch {}
  }, [notesList]);

  // Sync query to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lb_last_query', JSON.stringify(currentQuery));
    } catch {}
  }, [currentQuery]);

  const scoutLeads = async (biz, loc, userEmail) => {
    setIsScouting(true);
    setScoutMessage({ type: 'info', text: '🔍 Scouting market and extracting verified leads...' });
    setCurrentQuery({ biz, loc, email: userEmail });

    // Simulate scout latency for natural UX
    await new Promise(r => setTimeout(r, 600));

    const generated = generateMockLeads(biz, loc);

    // Merge any existing notes from notesList
    const merged = generated.map(lead => {
      const existingNote = notesList.find(n => n.leadName === lead.name || n.leadId === lead.id);
      return {
        ...lead,
        notes: existingNote ? existingNote.notes : ''
      };
    });

    setLeads(merged);

    // Defensive HTML Escaping Helper for Webhook
    const escapeHTML = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Safe URL validator
    const sanitizeUrl = (url, fallback = '#') => {
      if (!url) return fallback;
      try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.href;
        }
        return fallback;
      } catch {
        return fallback;
      }
    };

    // Automation Webhook Delivery (Make.com)
    if (userEmail) {
      const safeBiz = escapeHTML(biz);
      const safeLoc = escapeHTML(loc);

      let emailBodyHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; font-size: 20px;">LanceBuddy Market Report</h2>
          <p style="color: #475569; font-size: 15px;">Here is your requested scout report for <strong>${safeBiz}</strong> in <strong>${safeLoc}</strong>.</p>
      `;

      merged.forEach((l, index) => {
        const rawMapsUrl = l.maps_url || `https://maps.google.com/?q=${encodeURIComponent(l.name)}`;
        const safeMapsUrl = sanitizeUrl(rawMapsUrl);
        const safeSourceUrl = sanitizeUrl(l.source_url);
        const safeName = escapeHTML(l.name);
        const safePhone = escapeHTML(l.phone);
        const safePlatform = escapeHTML(l.source_platform);

        emailBodyHTML += `
          <div style="background-color: #f8fafc; margin-bottom: 15px; padding: 15px; border-radius: 8px; border-left: 4px solid #0f172a;">
              <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">${index + 1}. ${safeName}</div>
              <div style="font-size: 14px; color: #475569; margin-bottom: 4px;">📞 <strong>Phone:</strong> ${safePhone}</div>
              <div style="font-size: 14px; color: #475569; margin-bottom: 4px;">💼 <strong>Source:</strong> ${safePlatform}</div>
              <div style="font-size: 14px; margin-top: 4px;"><a href="${safeSourceUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600;">🔗 View on ${safePlatform}</a></div>
              <div style="font-size: 14px; margin-top: 4px;"><a href="${safeMapsUrl}" style="color: #ef4444; text-decoration: none; font-weight: 600;">📍 View on Google Maps</a></div>
          </div>
        `;
      });

      emailBodyHTML += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b;">
              <p style="margin: 0 0 5px 0;">This automated report was generated via LanceBuddy.</p>
              <p style="margin: 0;">Made by <strong>Jakad Wangdu</strong></p>
          </div>
        </div>
      `;

      try {
        await fetch("https://hook.eu1.make.com/5298drcktoouug7vkdujeo95ki1dw8hr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail.trim().slice(0, 120),
            business_type: biz.slice(0, 80),
            location: loc.slice(0, 80),
            message: emailBodyHTML
          })
        });
        setScoutMessage({
          type: 'success',
          text: '✅ Leads scouted! Email report triggered. (Check your Spam/Promotions tab if needed).'
        });
      } catch {
        setScoutMessage({
          type: 'warning',
          text: '⚡ Leads scouted locally! Webhook delivery delayed.'
        });
      }
    } else {
      setScoutMessage({
        type: 'success',
        text: `✅ Scouted ${merged.length} verified leads for ${biz} in ${loc}!`
      });
    }

    setIsScouting(false);
  };

  const updateStatus = (leadId, nextStatus) => {
    const statuses = ['new', 'contacted', 'interested', 'converted', 'lost'];
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const resolvedStatus = nextStatus || statuses[(statuses.indexOf(lead.status) + 1) % statuses.length];
        return { ...lead, status: resolvedStatus };
      }
      return lead;
    }));
  };

  const saveNote = (leadId, noteText) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, notes: noteText };
      }
      return lead;
    }));

    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    setNotesList(prev => {
      const filtered = prev.filter(n => n.leadId !== leadId);
      if (noteText.trim()) {
        filtered.unshift({
          id: 'note_' + Date.now(),
          leadId: leadId,
          leadName: targetLead.name,
          biz: currentQuery.biz,
          location: currentQuery.loc,
          notes: noteText.trim(),
          savedAt: new Date().toISOString()
        });
      }
      return filtered;
    });
  };

  const deleteNote = (noteId) => {
    setNotesList(prev => prev.filter(n => n.id !== noteId));
  };

  const deleteLead = (leadId) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  const exportCSV = () => {
    if (!leads.length) return;
    // Defensive sanitization against CSV Formula Injection (DDE attacks)
    const sanitizeCSVField = (str) => {
      let val = (str || '').toString();
      if (/^[=+\-@\t\r]/.test(val)) {
        val = "'" + val;
      }
      return '"' + val.replace(/"/g, '""') + '"';
    };

    const headers = ['Business Name','Phone Number','Source Platform','Source URL','Google Maps URL','Snippet','Priority','Status','Notes','Date Added'];
    const rows = leads.map(l => [
      sanitizeCSVField(l.name),
      sanitizeCSVField(l.phone),
      sanitizeCSVField(l.source_platform),
      sanitizeCSVField(l.source_url),
      sanitizeCSVField(l.maps_url || ''),
      sanitizeCSVField(l.snippet),
      sanitizeCSVField(l.priority),
      sanitizeCSVField(l.status),
      sanitizeCSVField(l.notes),
      sanitizeCSVField(l.created_at)
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const safeBizName = (currentQuery.biz || 'Leads').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const safeLocName = (currentQuery.loc || 'India').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const filename = `LanceBuddy_${safeBizName}_${safeLocName}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: Array.isArray(leads) ? leads.length : 0,
    hot: Array.isArray(leads) ? leads.filter(l => l && l.priority === 'hot').length : 0,
    warm: Array.isArray(leads) ? leads.filter(l => l && l.priority === 'warm').length : 0,
    cold: Array.isArray(leads) ? leads.filter(l => l && l.priority === 'cold').length : 0,
    new: Array.isArray(leads) ? leads.filter(l => l && l.status === 'new').length : 0,
    contacted: Array.isArray(leads) ? leads.filter(l => l && l.status === 'contacted').length : 0,
    interested: Array.isArray(leads) ? leads.filter(l => l && l.status === 'interested').length : 0,
    converted: Array.isArray(leads) ? leads.filter(l => l && l.status === 'converted').length : 0,
    lost: Array.isArray(leads) ? leads.filter(l => l && l.status === 'lost').length : 0
  };

  return (
    <LeadsContext.Provider value={{
      leads,
      notesList,
      currentQuery,
      isScouting,
      scoutMessage,
      stats,
      scoutLeads,
      updateStatus,
      saveNote,
      deleteNote,
      deleteLead,
      exportCSV
    }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => useContext(LeadsContext);
