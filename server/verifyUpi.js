import tls from 'tls';

/**
 * Verifies a 12-digit UTR against incoming payment receipt emails in Gmail
 * @param {string} targetUtr - 12-digit UPI Transaction Reference Number
 * @returns {Promise<{ verified: boolean, payer?: string, amount?: string, utr?: string, reason?: string }>}
 */
export function verifyUtrViaGmail(targetUtr) {
  return new Promise((resolve) => {
    const cleanUtr = String(targetUtr || '').trim().replace(/\D/g, '');
    const user = (process.env.UPI_VERIFY_EMAIL || '').trim();
    const pass = (process.env.UPI_VERIFY_APP_PASS || '').replace(/\s+/g, '');

    if (!cleanUtr || cleanUtr.length !== 12) {
      return resolve({
        verified: false,
        reason: 'Invalid UTR format. Must be exactly 12 numeric digits.'
      });
    }

    if (!user || !pass) {
      return resolve({
        verified: false,
        reason: 'UPI email verification service is not configured with email credentials in environment variables.'
      });
    }

    const client = tls.connect({
      host: 'imap.gmail.com',
      port: 993,
      rejectUnauthorized: false
    });

    let buffer = '';
    let step = 0;
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        try { client.destroy(); } catch {}
        resolve({
          verified: false,
          reason: 'Verification timed out while checking bank emails. Please try again in 30 seconds.'
        });
      }
    }, 15000);

    const finish = (result) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        try { client.write('A99 LOGOUT\r\n'); } catch {}
        try { client.end(); } catch {}
        resolve(result);
      }
    };

    client.on('data', (data) => {
      buffer += data.toString();

      // Step 0: Greeting
      if (step === 0 && buffer.includes('* OK')) {
        buffer = '';
        step = 1;
        client.write(`A01 LOGIN ${user} ${pass}\r\n`);
      }
      // Step 1: Login
      else if (step === 1 && buffer.includes('A01 OK')) {
        buffer = '';
        step = 2;
        client.write('A02 SELECT INBOX\r\n');
      } else if (step === 1 && (buffer.includes('A01 NO') || buffer.includes('A01 BAD'))) {
        finish({ verified: false, reason: 'Email authentication failed on server.' });
      }
      // Step 2: Search for UTR in emails
      else if (step === 2 && buffer.includes('A02 OK')) {
        buffer = '';
        step = 3;
        client.write(`A03 SEARCH TEXT "${cleanUtr}"\r\n`);
      }
      // Step 3: Parse Search Results
      else if (step === 3 && buffer.includes('A03 OK')) {
        const match = buffer.match(/\* SEARCH ([\d\s]+)/);
        buffer = '';
        if (match && match[1] && match[1].trim()) {
          const ids = match[1].trim().split(/\s+/).filter(Boolean);
          const lastId = ids[ids.length - 1]; // Latest email with this UTR
          step = 4;
          client.write(`A04 FETCH ${lastId} (BODY[TEXT] BODY[HEADER.FIELDS (SUBJECT FROM DATE)])\r\n`);
        } else {
          finish({
            verified: false,
            reason: `No incoming payment credit with UTR ${cleanUtr} was found in your FamPay / bank receipts. If you just paid, please wait 30-60 seconds for the receipt email and retry.`
          });
        }
      }
      // Step 4: Fetch Body and Verify Content
      else if (step === 4 && buffer.includes('A04 OK')) {
        const emailContent = buffer;
        buffer = '';

        if (emailContent.includes(cleanUtr)) {
          // Extract sender / payer and amount
          const isReceived = /received|credited|payment.*?received|money.*?received/i.test(emailContent);
          
          if (!isReceived) {
            return finish({
              verified: false,
              reason: 'Email found, but transaction was not an incoming credit/payment.'
            });
          }

          const payerMatch = 
            emailContent.match(/from\s+([A-Z0-9\s]+?)\s+at/i) ||
            emailContent.match(/from\s+<span[^>]*>([A-Za-z0-9\s]+)<\/span>/i) ||
            emailContent.match(/from\s+([A-Za-z\s]+)/i);

          const amtMatch = 
            emailContent.match(/received.*?₹?\s*(\d+(?:\.\d+)?)/i) ||
            emailContent.match(/₹\s*(\d+(?:\.\d+)?)/);

          finish({
            verified: true,
            utr: cleanUtr,
            payer: payerMatch ? payerMatch[1].trim() : 'Verified Payer',
            amount: amtMatch ? amtMatch[1] : '1.0'
          });
        } else {
          finish({
            verified: false,
            reason: 'UTR mismatch in payment email.'
          });
        }
      }
    });

    client.on('error', (err) => {
      finish({ verified: false, reason: `Connection error: ${err.message}` });
    });
  });
}
