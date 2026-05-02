import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{
    minHeight: '80vh', display:'flex', alignItems:'center', justifyContent:'center',
    background: 'var(--green-25)', padding: 24,
  }}>
    <div style={{ textAlign:'center', maxWidth: 440 }}>
      <div style={{
        fontFamily:"'Playfair Display',serif", fontSize: 120, fontWeight: 700,
        color: 'var(--green-100)', lineHeight: 1, marginBottom: 8,
      }}>404</div>
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: 28, color:'var(--text-primary)', marginBottom: 12 }}>
        Page not found
      </h1>
      <p style={{ color:'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary" style={{ padding:'12px 28px', fontSize: 15 }}>
        ← Back to Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
