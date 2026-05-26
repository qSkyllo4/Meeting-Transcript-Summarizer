import React, { useState } from 'react';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000'
});

function App() {
  const [user, setUser] = useState(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authUsername || !authPassword) return alert('Fill in all fields');
    
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await axiosInstance.post(endpoint, { username: authUsername, password: authPassword });
      if (isRegistering) {
        alert('Registration complete. Please log in.');
        setIsRegistering(false);
      } else {
        setUser(res.data);
      }
      setAuthUsername('');
      setAuthPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!title || !rawText) return alert('Please provide a title and transcript');
    
    setLoading(true);
    setResult(null);
    try {
      const res = await axiosInstance.post('/api/transcripts', { title, rawText, userId: user.userId });
      setResult(res.data);
      setTitle('');
      setRawText('');
    } catch (err) {
      if (err.response?.status === 429) {
        alert("AI Server Throttling: Rate limit exceeded. Please wait 10 seconds and click send again.");
      } else {
        const errMsg = err.response?.data?.error || 'Processing failed';
        const errDetails = err.response?.data?.details || '';
        alert(`${errMsg}\n${errDetails}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setSearchLoading(true);
    try {
      const res = await axiosInstance.get(`/api/transcripts/search?q=${encodeURIComponent(searchQuery)}&userId=${user.userId}`);
      setSearchResults(res.data);
    } catch (err) {
      if (err.response?.status === 429) {
        alert("Search Throttling: Rate limit exceeded. Please wait 10 seconds and try again.");
      } else {
        alert('Search execution failed');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const styles = {
    wrapper: {
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
      boxSizing: 'border-box'
    },
    authContainer: {
      maxWidth: '400px',
      margin: '60px auto',
      padding: '32px',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      border: '1px solid #334155'
    },
    mainContainer: {
      maxWidth: '1100px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #334155',
      paddingBottom: '20px',
      marginBottom: '32px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '40px'
    },
    card: {
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #334155',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    },
    inputGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#94a3b8',
      fontSize: '14px'
    },
    input: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '15px',
      boxSizing: 'border-box',
      outline: 'none'
    },
    textarea: {
      width: '100%',
      height: '180px',
      padding: '12px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      color: '#f8fafc',
      fontSize: '15px',
      boxSizing: 'border-box',
      outline: 'none',
      resize: 'vertical'
    },
    btnPrimary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%'
    },
    btnSecondary: {
      backgroundColor: '#475569',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    btnDanger: {
      backgroundColor: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      borderRadius: '6px',
      padding: '6px 12px',
      fontSize: '13px',
      cursor: 'pointer'
    },
    btnAction: {
      backgroundColor: '#334155',
      color: '#e2e8f0',
      border: 'none',
      borderRadius: '6px',
      padding: '6px 12px',
      fontSize: '13px',
      cursor: 'pointer'
    },
    outputBox: {
      marginTop: '24px',
      padding: '20px',
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      borderLeft: '4px solid #10b981'
    },
    resultRow: {
      borderBottom: '1px solid #334155',
      paddingBottom: '20px',
      marginBottom: '20px'
    },
    tag: {
      backgroundColor: '#1e293b',
      color: '#3b82f6',
      border: '1px solid #334155',
      padding: '4px 10px',
      fontSize: '12px',
      borderRadius: '16px',
      fontWeight: '500'
    },
    badge: {
      backgroundColor: '#065f46',
      color: '#34d399',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600'
    }
  };

  if (!user) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.authContainer}>
          <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', textAlign: 'center' }}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <form onSubmit={handleAuth}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} style={styles.input} placeholder="Enter username" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={styles.input} placeholder="Enter password" />
            </div>
            <button type="submit" style={styles.btnPrimary}>
              {isRegistering ? 'Sign Up' : 'Log In'}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} style={{ width: '100%', background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'none', marginTop: '16px', cursor: 'pointer', fontSize: '14px' }}>
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Transcript Workspace</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#94a3b8' }}>User: <strong style={{ color: '#f8fafc' }}>{user.username}</strong></span>
            <button onClick={() => { setUser(null); setSearchResults([]); setResult(null); }} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        
        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#3b82f6' }}>Submit New Transcript</h2>
            <form onSubmit={handleProcess}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Meeting Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} placeholder="" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Transcript Text</label>
                <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} style={styles.textarea} placeholder="" />
              </div>
              <button type="submit" disabled={loading} style={styles.btnPrimary}>
                {loading ? 'Processing via Gemini AI...' : 'Generate AI Summary'}
              </button>
            </form>

            {result && (
              <div style={styles.outputBox}>
                <h3 style={{ marginTop: 0, color: '#10b981', fontSize: '18px' }}>Analysis Complete</h3>
                <p style={{ lineHeight: '1.5', fontSize: '15px' }}><strong>Summary:</strong> {result.summary}</p>
                <p style={{ marginBottom: '6px' }}><strong>Action Items:</strong></p>
                <ul style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.6', fontSize: '14px' }}>
                  {result.actionItems.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {result.tags.map((t, i) => <span key={i} style={styles.tag}>{t}</span>)}
                </div>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#3b82f6' }}>Semantic Engine</h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.input} placeholder="" />
              <button type="submit" style={styles.btnSecondary}>Search</button>
            </form>

            {searchLoading && <p style={{ color: '#94a3b8' }}>Vector space matching in progress...</p>}

            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
              {searchResults.map((item) => (
                <div key={item.id} style={styles.resultRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>{item.title}</h4>
                    <span style={styles.badge}>{(item.similarityScore * 100).toFixed(1)}% Match</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5', marginTop: 0, marginBottom: '12px' }}>{item.summary}</p>
                  
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {item.tags.map((t, i) => <span key={i} style={styles.tag}>{t}</span>)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={async () => {
                      const newTitle = prompt("Enter new title:", item.title);
                      if (!newTitle) return;
                      try {
                        await axiosInstance.put(`/api/transcripts/${item.id}`, { title: newTitle, userId: user.userId });
                        alert("Title updated! Run search again to refresh.");
                      } catch (err) { alert("Update failed"); }
                    }} style={styles.btnAction}>
                      Rename
                    </button>
                    <button onClick={async () => {
                      if (!confirm("Delete this transcript?")) return;
                      try {
                        await axiosInstance.delete(`/api/transcripts/${item.id}?userId=${user.userId}`);
                        setSearchResults(searchResults.filter(r => r.id !== item.id));
                        alert("Deleted successfully");
                      } catch (err) { alert("Delete failed"); }
                    }} style={styles.btnDanger}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;